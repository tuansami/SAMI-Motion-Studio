// SAMI Motion Studio — local server (http://localhost:5178). No internet needed after install.
import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import {spawn, spawnSync} from 'child_process';
import {ROOT, DATA, TEMPLATES, DEFAULT_PROJECTS} from './paths.mjs';
import {readProject, writeProject, syncEngineAssets} from './project.mjs';
import {previewBundle} from './preview.mjs';
import {addJob, cancelJob, clearDone, resumeJob, stopAll, killOrphans, publicJobs, jobs, onJobs} from './render.mjs';
import {validateProject} from './validate.mjs';
import {analyzeMusic} from './audio.mjs';
import {importAssets, listAssets} from './assets.mjs';
import {listTemplates, checkTemplate, saveAsTemplate, importTemplate, exportTemplate, CATEGORIES, GOALS} from './template.mjs';
import {gpuEncoders, gpuDiagnose, FFMPEG} from './ffmpeg.mjs';

const PORT = +(process.env.STUDIO_PORT || 5178);
fs.mkdirSync(DATA, {recursive: true});
const SETTINGS = path.join(DATA, 'settings.json');
const DEFAULT_RENDER = {threads: Math.min(8, os.cpus().length), gpu: 'auto', res: 'FHD', fps: 30, codec: 'h264', crf: 18, priority: 'normal', titles: true, subtitles: true, audio: true};
const loadSettings = () => { try { return {recent: [], render: DEFAULT_RENDER, projectsRoot: DEFAULT_PROJECTS, ...JSON.parse(fs.readFileSync(SETTINGS, 'utf8'))}; } catch { return {recent: [], render: DEFAULT_RENDER, projectsRoot: DEFAULT_PROJECTS}; } };
const saveSettings = (s) => fs.writeFileSync(SETTINGS, JSON.stringify(s, null, 1));
let settings = loadSettings();

// ── project registry (id ↔ absolute folder) ──────────────────────────────
const idOf = (dir) => crypto.createHash('sha1').update(path.resolve(dir).toLowerCase()).digest('hex').slice(0, 10);
const dirs = new Map();
const register = (dir) => { const d = path.resolve(dir); const id = idOf(d); dirs.set(id, d); return id; };
for (const r of settings.recent) if (fs.existsSync(path.join(r.dir, 'project.json'))) register(r.dir);
const touchRecent = (dir, name) => {
  settings.recent = [{dir: path.resolve(dir), name, opened: new Date().toISOString()}, ...settings.recent.filter((r) => path.resolve(r.dir) !== path.resolve(dir))].slice(0, 20);
  saveSettings(settings);
};
// sample projects shipped with the app
if (fs.existsSync(DEFAULT_PROJECTS)) for (const e of fs.readdirSync(DEFAULT_PROJECTS)) {
  const d = path.join(DEFAULT_PROJECTS, e);
  if (fs.existsSync(path.join(d, 'project.json')) && !settings.recent.some((r) => path.resolve(r.dir) === path.resolve(d))) { settings.recent.push({dir: d, name: readProject(d).name, opened: null}); register(d); }
}
saveSettings(settings);

// ── watchers: scene code edited (e.g. by Claude Code) → rebuild preview + tell the UI ─────
const sse = new Set();
const broadcast = (type, data) => { const msg = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`; for (const r of sse) r.write(msg); };
onJobs((s) => { for (const r of sse) r.write(`event: jobs\ndata: ${s}\n\n`); });
const watchers = new Map();
const watch = (id) => {
  if (watchers.has(id)) return;
  const dir = dirs.get(id);
  let t = null;
  const fire = (what) => { clearTimeout(t); t = setTimeout(async () => {
    if (what === 'code') { const b = await previewBundle(dir); broadcast('code', {id, hash: b.hash, error: b.error}); }
    else broadcast('project', {id});
  }, 400); };
  try {
    const w1 = fs.watch(path.join(dir, 'scenes'), {recursive: true}, () => fire('code'));
    const w2 = fs.watch(dir, (ev, f) => { if (f === 'project.json') fire('project'); });
    watchers.set(id, [w1, w2]);
  } catch {}
};

// ── helpers ───────────────────────────────────────────────────────────
const MIME = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.srt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8'};
const sendFile = (req, res, f) => {
  if (!fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); return res.end('not found'); }
  const st = fs.statSync(f); const type = MIME[path.extname(f).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range;
  if (range) { // needed for audio/video seeking in the preview
    const [a, b] = range.replace('bytes=', '').split('-'); const s = +a, e = b ? +b : st.size - 1;
    res.writeHead(206, {'Content-Type': type, 'Content-Range': `bytes ${s}-${e}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': e - s + 1});
    return fs.createReadStream(f, {start: s, end: e}).pipe(res);
  }
  res.writeHead(200, {'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache'});
  fs.createReadStream(f).pipe(res);
};
const json = (res, obj, code = 200) => { res.writeHead(code, {'Content-Type': 'application/json; charset=utf-8'}); res.end(JSON.stringify(obj)); };
const body = (req) => new Promise((ok, bad) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => ok(Buffer.concat(c))); req.on('error', bad); });
const jbody = async (req) => { const b = await body(req); return b.length ? JSON.parse(b.toString('utf8')) : {}; };
const openPath = (p) => {
  if (process.platform === 'win32') spawn('explorer.exe', [p.replace(/\//g, '\\')], {detached: true});
  else if (process.platform === 'darwin') spawn('open', [p], {detached: true});
  else spawn('xdg-open', [p], {detached: true, stdio: 'ignore'});
};
// Windows dialogs run async (a dialog hidden behind the browser must never freeze the Studio server)
const runPs = (ps) => new Promise((ok) => { const c = spawn('powershell.exe', ['-NoProfile', '-STA', '-Command', ps], {windowsHide: true}); let out = ''; c.stdout.on('data', (d) => (out += d)); c.on('exit', () => ok(out.trim() || null)); c.on('error', () => ok(null)); });
const pickFolder = async () => {
  if (process.platform !== 'win32') return null;
  const ps = "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; $f.ShowNewFolderButton = $true; $w = New-Object System.Windows.Forms.Form; $w.TopMost = $true; $f.Description = 'Chon thu muc'; if ($f.ShowDialog($w) -eq 'OK') { [Console]::OutputEncoding = [Text.Encoding]::UTF8; Write-Output $f.SelectedPath }";
  return runPs(ps);
};
const pickFile = async (filter) => {
  if (process.platform !== 'win32') return null;
  const ps = `Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.OpenFileDialog; $f.Filter = '${filter.replace(/'/g, '')}'; $w = New-Object System.Windows.Forms.Form; $w.TopMost = $true; if ($f.ShowDialog($w) -eq 'OK') { [Console]::OutputEncoding = [Text.Encoding]::UTF8; Write-Output $f.FileName }`;
  return runPs(ps);
};
const copyDir = (s, d, skip = () => false) => {
  fs.mkdirSync(d, {recursive: true});
  for (const e of fs.readdirSync(s, {withFileTypes: true})) {
    if (skip(e.name)) continue;
    const a = path.join(s, e.name), b = path.join(d, e.name);
    e.isDirectory() ? copyDir(a, b, skip) : fs.copyFileSync(a, b);
  }
};
const slug = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 48) || 'du-an';

const SESSION_MARK = '<!-- sami-session-protocol v1 -->';
const sessionProtocol = (app) => `${SESSION_MARK}
## Quy trình phiên làm việc (bắt buộc — chi tiết: \`${path.join(app, 'docs/QUY_TRINH_LAM_VIEC.md')}\`)
1. Đọc theo thứ tự: CLAUDE.md → \`brief/TRANG_THAI.md\` → CHỈ file việc hiện tại cần (BRIEF.md / SCRIPT_STORYBOARD.md / project.json / \`scenes/<ID>.tsx\` được nêu tên).
2. KHÔNG đọc: node_modules/, out/, public/_engine/, dự án khác, code engine của app (trừ khi lỗi chỉ vào đó). Ảnh: chỉ xem ảnh cần; QA bằng cli-still.
3. Chữ/thời lượng/tiêu đề/phụ đề/ảnh chèn/âm thanh/màu/xuất video → người dùng làm trong Studio; hãy chỉ tab thay vì tự sửa (trừ khi được yêu cầu rõ).
4. Video mới: viết brief/SCRIPT_STORYBOARD.md và DỪNG chờ duyệt ⛔ trước khi code.
5. Dừng và hỏi khi brief thiếu thông tin quyết định (CTA, ngôn ngữ, tỉ lệ, ảnh thật?) hoặc yêu cầu mâu thuẫn với "Đã chốt".
6. Trước khi báo xong: cli-validate không ✗ + đã tự xem ảnh tĩnh phần vừa sửa.
7. Cuối phiên: cập nhật \`brief/TRANG_THAI.md\` (giai đoạn, đã chốt, việc tiếp theo, phản hồi khách, ghi chú kỹ thuật) — ngắn, ≤ 1 trang.
`;
const trangThaiMd = (p) => `# TRẠNG THÁI — ${p.name}
Cập nhật: ${new Date().toISOString().slice(0, 10)} · bởi: Studio (tạo dự án)

## Giai đoạn
Brief ▢ · Kịch bản ⛔ ▢ · Dựng cảnh ▢ · Tinh chỉnh ▢ · Nháp ⛔ ▢ · Khách duyệt ⛔ ▢ · Xong ▢

## Đã chốt (không bàn lại nếu khách không yêu cầu)
- Khán giả / ngôn ngữ / CTA:
- Độ dài, tỉ lệ: ${(p.formats || []).join(' · ')}
- Nhạc:

## Việc tiếp theo
- [ ] Điền brief/BRIEF.md
- [ ] Claude Code: lên kịch bản + storyboard (chưa code)

## Phản hồi khách
### Vòng 1 (ngày …)
- [ ] Sxx · 0:00 — … → [Studio] / [Claude]

## Ghi chú kỹ thuật
-
`;
const projectClaudeMd = (p) => {
  const app = ROOT; const n = (x) => path.join(app, x);
  return `# CLAUDE.md — ${p.name}

Dự án video của SAMI Motion Studio. Owner: Tuan (CEO) — trả lời tiếng Việt, ngắn gọn, phản biện khi cần.
App Studio: \`${app}\` — ĐỌC \`${n('docs/PROJECT_GUIDE.md')}\` trước khi sửa.

- Chữ: \`project.json → copy\` (mỗi mục có label tiếng Việt mô tả vị trí) — scene đọc \`COPY.KEY\` bên trong component.
- Thời lượng/cảnh: \`project.json → scenes\` (base 30 fps, cắt trên nhịp 15n+1). Kéo dài cảnh bằng \`warp\`.
- Code cảnh: \`scenes/<ID>.tsx\`, đăng ký trong \`scenes/index.ts\`. Import: \`@engine/components/...\`, \`@engine/lib/anim\` (tw/keys — MỘT easing), \`@engine/lib/useT\`, \`@engine/core/format\` (useFormat/usePick cho 16:9 · 9:16 · 1:1).
- Tài nguyên: \`public/img|video|audio|fonts\`. Brief + tài liệu khách: \`brief/\`.
- Không bịa số liệu; không Math.random/Date; không sửa \`public/_engine\`.

## Lệnh (chạy trong thư mục dự án)
- Kiểm tra: \`node "${n('server/cli-validate.mjs')}" .\`
- Ảnh tĩnh QA: \`node "${n('server/cli-still.mjs')}" . out/qa/x.jpg 30,90,150 9:16\` → Read \`out/qa/x_<frame>.jpg\`
- Nhịp nhạc: \`node "${n('server/cli-grid.mjs')}" public/audio/music.mp3\`
- Studio tự tải lại preview khi scenes/ thay đổi. Không tự render video đầy đủ — người dùng xuất trong Studio.

${sessionProtocol(app)}`;
};


// give every project its own Claude Code context (only adds what is missing — never overwrites user edits)
const ensureClaude = (dir, pj) => {
  try {
    const cm = path.join(dir, 'CLAUDE.md');
    if (!fs.existsSync(cm)) fs.writeFileSync(cm, projectClaudeMd(pj));
    else if (!fs.readFileSync(cm, 'utf8').includes(SESSION_MARK)) fs.appendFileSync(cm, '\n' + sessionProtocol(ROOT));
    const tt = path.join(dir, 'brief', 'TRANG_THAI.md');
    if (!fs.existsSync(tt)) { fs.mkdirSync(path.dirname(tt), {recursive: true}); fs.writeFileSync(tt, trangThaiMd(pj)); }
    const src = path.join(ROOT, 'claude-code');
    if (fs.existsSync(src) && !fs.existsSync(path.join(dir, '.claude'))) copyDir(src, path.join(dir, '.claude'));
    // app-owned skill + workflow: keep in sync with the installed Studio version
    for (const rel of ['skills/sami-motion-studio/SKILL.md', 'workflows/sami-motion-video.js']) {
      const a = path.join(src, rel), b = path.join(dir, '.claude', rel);
      if (fs.existsSync(a) && (!fs.existsSync(b) || fs.readFileSync(a, 'utf8') !== fs.readFileSync(b, 'utf8'))) { fs.mkdirSync(path.dirname(b), {recursive: true}); fs.copyFileSync(a, b); }
    }
  } catch {}
};

// ── server ───────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x');
    const p = decodeURIComponent(u.pathname);
    // UI
    if (p === '/' || p === '/index.html') return sendFile(req, res, path.join(ROOT, 'ui', 'index.html'));
    if (p.startsWith('/ui/')) return sendFile(req, res, path.join(ROOT, 'ui', p.slice(4)));
    if (p.startsWith('/docs/')) return sendFile(req, res, path.join(ROOT, 'docs', p.slice(6)));
    // project public files (images, audio) for the live preview
    let m = p.match(/^\/proj\/([0-9a-f]{10})\/public\/(.+)$/);
    if (m) return sendFile(req, res, path.join(dirs.get(m[1]) || '/nonexistent', 'public', m[2]));
    m = p.match(/^\/proj\/([0-9a-f]{10})\/out\/(.+)$/);
    if (m) return sendFile(req, res, path.join(dirs.get(m[1]) || '/nonexistent', 'out', m[2]));
    m = p.match(/^\/tpl\/([\w.-]+)\/(preview\/[\w.-]+)$/);
    if (m) return sendFile(req, res, path.join(TEMPLATES, m[1], m[2]));
    // preview bundle
    m = p.match(/^\/bundle\/([0-9a-f]{10})\/(.+)$/);
    if (m) {
      const dir = dirs.get(m[1]); if (!dir) return json(res, {error: 'unknown project'}, 404);
      const b = await previewBundle(dir);
      if (b.error && m[2] === 'entry.js') { res.writeHead(200, {'Content-Type': 'text/javascript'}); return res.end(`window.__bundleError = ${JSON.stringify(b.error)};`); }
      return sendFile(req, res, path.join(b.outdir, m[2].replace(/^\//, '')));
    }
    if (p === '/api/events') {
      res.writeHead(200, {'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive'});
      res.write(`event: jobs\ndata: ${JSON.stringify(publicJobs())}\n\n`);
      sse.add(res); const hb = setInterval(() => res.write(`event: ping\ndata: ${Date.now()}\n\n`), 10000); req.on('close', () => { clearInterval(hb); sse.delete(res); }); return;
    }
    if (p === '/api/state') {
      const recent = settings.recent.filter((r) => fs.existsSync(path.join(r.dir, 'project.json'))).map((r) => ({...r, id: register(r.dir)}));
      const templates = listTemplates();
      return json(res, {recent, templates, categories: CATEGORIES, goals: GOALS, render: {...DEFAULT_RENDER, ...settings.render}, cpus: os.cpus().length, cpuModel: os.cpus()[0]?.model, platform: process.platform, gpu: gpuEncoders(), ffmpeg: !!FFMPEG, projectsRoot: settings.projectsRoot, version: JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version});
    }
    if (p === '/api/settings' && req.method === 'POST') { const b = await jbody(req); settings = {...settings, ...b, render: {...settings.render, ...(b.render || {})}}; saveSettings(settings); return json(res, {ok: true}); }
    if (p === '/api/pick-folder') { const d = await pickFolder(); return json(res, {dir: d, supported: process.platform === 'win32'}); }
    if (p === '/api/open' && req.method === 'POST') { const b = await jbody(req); if (b.path && fs.existsSync(b.path)) openPath(b.path); return json(res, {ok: true}); }
    if (p === '/api/project/open' && req.method === 'POST') {
      const b = await jbody(req);
      const dir = b.id ? dirs.get(b.id) : b.dir;
      if (!dir || !fs.existsSync(path.join(dir, 'project.json'))) return json(res, {error: 'Thư mục này không có project.json'}, 400);
      const id = register(dir); const pj = readProject(dir); syncEngineAssets(dir); ensureClaude(dir, pj); touchRecent(dir, pj.name); watch(id);
      return json(res, {id, dir, project: pj, assets: listAssets(dir)});
    }
    if (p === '/api/project/save' && req.method === 'POST') {
      const b = await jbody(req); const dir = dirs.get(b.id); if (!dir) return json(res, {error: 'unknown'}, 404);
      writeProject(dir, b.project); touchRecent(dir, b.project.name);
      return json(res, {ok: true, validation: validateProject(dir)});
    }
    if (p === '/api/project/validate') { const dir = dirs.get(u.searchParams.get('id')); return json(res, validateProject(dir)); }
    if (p === '/api/project/assets') { const dir = dirs.get(u.searchParams.get('id')); return json(res, listAssets(dir)); }
    if (p === '/api/project/new' && req.method === 'POST') {
      const b = await jbody(req);
      const tpl = path.join(TEMPLATES, b.template || 'agency-promo');
      if (!fs.existsSync(tpl)) return json(res, {error: 'Không có mẫu ' + b.template}, 400);
      const root = b.location || settings.projectsRoot || DEFAULT_PROJECTS;
      let dir = path.join(root, slug(b.name || 'du-an-moi')); let n = 2;
      while (fs.existsSync(dir)) dir = path.join(root, slug(b.name || 'du-an-moi') + '-' + n++);
      copyDir(tpl, dir, (name) => ['out', '_engine', 'template.json', 'preview', 'README.md', 'brief', '.claude', 'CLAUDE.md'].includes(name));
      const pj = readProject(dir); pj.name = b.name || pj.name; pj.client = b.client || pj.client;
      if (b.brand) pj.brand = {...pj.brand, colors: {...(pj.brand?.colors || {}), ...b.brand}};
      let report = null;
      if (b.assetsDir && fs.existsSync(b.assetsDir)) report = importAssets(b.assetsDir, dir);
      writeProject(dir, pj);
      fs.mkdirSync(path.join(dir, 'brief'), {recursive: true});
      fs.writeFileSync(path.join(dir, 'CLAUDE.md'), projectClaudeMd(pj)); ensureClaude(dir, pj);
      fs.writeFileSync(path.join(dir, 'brief', 'BRIEF.md'), `# BRIEF — ${pj.name}\n\nKhách hàng: ${pj.client || ''}\nMục tiêu video:\nKhán giả:\nNgôn ngữ:\nThông điệp chính:\nCTA (liên hệ):\nĐộ dài / tỉ lệ:\nGhi chú brand (màu, font, logo):\n\n## Tài nguyên đã nhập\n${report ? report.files.map((f) => '- ' + f).join('\n') : '(chưa có)'}\n`);
      const id = register(dir); touchRecent(dir, pj.name);
      return json(res, {id, dir, report});
    }
    if (p === '/api/project/import-assets' && req.method === 'POST') { const b = await jbody(req); const dir = dirs.get(b.id); return json(res, importAssets(b.from, dir)); }
    if (p === '/api/upload' && req.method === 'POST') { // raw body, ?id=&sub=audio&name=file.mp3
      const dir = dirs.get(u.searchParams.get('id')); const sub = (u.searchParams.get('sub') || 'img').replace(/[^a-z]/g, '');
      const name = path.basename(u.searchParams.get('name') || 'file').replace(/[^\p{L}\p{N}._-]+/gu, '_');
      const dst = path.join(dir, 'public', sub, name); fs.mkdirSync(path.dirname(dst), {recursive: true});
      fs.writeFileSync(dst, await body(req)); return json(res, {path: `${sub}/${name}`});
    }
    if (p === '/api/audio/analyze') {
      const dir = dirs.get(u.searchParams.get('id')); const f = path.join(dir, 'public', u.searchParams.get('file') || '');
      if (!fs.existsSync(f)) return json(res, {error: 'Không thấy file ' + u.searchParams.get('file')}, 400);
      return json(res, analyzeMusic(f));
    }
    if (p === '/api/render' && req.method === 'POST') {
      const b = await jbody(req); const dir = dirs.get(b.id); if (!dir) return json(res, {error: 'unknown'}, 404);
      if (b.saveDefaults) { const {id, name, scope, ratio, saveDefaults, ...r} = b; settings.render = {...settings.render, ...r}; saveSettings(settings); }
      const v = validateProject(dir); if (v.fail.length) return json(res, {error: 'Dự án còn lỗi:\n• ' + v.fail.join('\n• ')}, 400);
      return json(res, addJob({...b, dir}));
    }
    if (p === '/api/render/cancel' && req.method === 'POST') { const b = await jbody(req); cancelJob(b.jobId); return json(res, {ok: true}); }
    if (p === '/api/render/clear' && req.method === 'POST') { clearDone(); return json(res, {ok: true}); }
    if (p === '/api/render/resume' && req.method === 'POST') { const b = await jbody(req); const r = resumeJob(b.jobId); return r ? json(res, r) : json(res, {error: 'Không tiếp tục được lượt này'}, 400); }
    if (p === '/api/template/check' && req.method === 'POST') { const b = await jbody(req); return json(res, checkTemplate(path.join(TEMPLATES, path.basename(b.tpl)))); }
    if (p === '/api/template/thumbs' && req.method === 'POST') {
      const b = await jbody(req); const dir = path.join(TEMPLATES, path.basename(b.tpl));
      const r = spawn(process.execPath, [path.join(ROOT, 'server', 'cli-template.mjs'), 'thumbs', dir], {windowsHide: true, env: process.env});
      let log = ''; r.stderr.on('data', (d) => (log += d));
      r.on('exit', (code) => broadcast('template', {tpl: b.tpl, thumbs: code === 0, error: code ? log.slice(-500) : null}));
      return json(res, {ok: true});
    }
    if (p === '/api/template/from-project' && req.method === 'POST') {
      const b = await jbody(req); const dir = dirs.get(b.id); if (!dir) return json(res, {error: 'unknown'}, 404);
      const r = saveAsTemplate(dir, b);
      const t = spawn(process.execPath, [path.join(ROOT, 'server', 'cli-template.mjs'), 'thumbs', r.dir], {windowsHide: true, env: process.env});
      t.on('exit', (code) => broadcast('template', {tpl: r.id, thumbs: code === 0}));
      return json(res, {id: r.id, dir: r.dir, check: checkTemplate(r.dir)});
    }
    if (p === '/api/template/import' && req.method === 'POST') { const b = await jbody(req); return json(res, importTemplate(b.from)); }
    if (p === '/api/template/export' && req.method === 'POST') { const b = await jbody(req); const r = exportTemplate(path.basename(b.tpl)); openPath(path.dirname(r.out)); return json(res, r); }
    if (p === '/api/pick-file') { const d = await pickFile(u.searchParams.get('filter') || 'Zip|*.zip'); return json(res, {file: d, supported: process.platform === 'win32'}); }
    if (p === '/api/gpu/diagnose') return json(res, gpuDiagnose());
    if (p === '/api/render/stop-all' && req.method === 'POST') { stopAll(); return json(res, {ok: true}); }
    if (p === '/api/jobs') return json(res, publicJobs());
    res.writeHead(404); res.end('not found');
  } catch (e) {
    console.error(e); json(res, {error: String(e?.message || e)}, 500);
  }
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log(`\n  Studio da chay san o cua so khac -> mo trinh duyet http://localhost:${PORT}\n`);
    if (process.platform === 'win32' && !process.env.NO_OPEN) spawn('cmd', ['/c', 'start', '', `http://localhost:${PORT}`], {detached: true, stdio: 'ignore'});
    setTimeout(() => process.exit(0), 1500);
  } else throw e;
});
server.listen(PORT, '127.0.0.1', () => {
  killOrphans(); // headless Chrome left over from a crashed/closed session
  const url = `http://localhost:${PORT}`;
  console.log(`\n  SAMI Motion Studio ${url}\n  (giu cua so nay mo trong khi dung; dong cua so = tat Studio)\n`);
  if (!process.env.NO_OPEN) {
    if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '', url], {detached: true, stdio: 'ignore'});
    else if (process.platform === 'darwin') spawn('open', [url], {detached: true, stdio: 'ignore'});
  }
});
