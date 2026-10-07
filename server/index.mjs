// SAMI Motion Studio — local server (http://localhost:5178). No internet needed after install.
import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import {spawn, spawnSync} from 'child_process';
import {ROOT, DATA, TEMPLATES, DEFAULT_PROJECTS, LIBRARY, CACHE} from './paths.mjs';
import {readProject, writeProject, syncEngineAssets} from './project.mjs';
import {previewBundle} from './preview.mjs';
import {addJob, cancelJob, clearDone, resumeJob, stopAll, killOrphans, publicJobs, jobs, onJobs} from './render.mjs';
import {validateProject} from './validate.mjs';
import {analyzeMusic} from './audio.mjs';
import {importAssets, listAssets} from './assets.mjs';
import {listTemplates, checkTemplate, saveAsTemplate, importTemplate, exportTemplate, tplDir, setSharedRoots, CATEGORIES, GOALS} from './template.mjs';
import {gpuEncoders, gpuDiagnose, FFMPEG, refreshCaps, caps} from './ffmpeg.mjs';
import {stageHtml, resolveStaged, isHf, lintScene, HF_VERSION} from './hf.mjs';
import * as library from './library.mjs';
import * as history from './history.mjs';
import {CMP_ROOT} from './review.mjs';
import * as providers from '../providers/gateway.mjs';
import * as pcfg from '../providers/config.mjs';

const PORT = +(process.env.STUDIO_PORT || 5178);
if (!caps()) refreshCaps(); // async NVENC/filter probe → .studio/caps.json (0.5 probed synchronously on the first request)
fs.mkdirSync(DATA, {recursive: true});
const SETTINGS = path.join(DATA, 'settings.json');
const DEFAULT_RENDER = {threads: Math.min(8, os.cpus().length), gpu: 'auto', res: 'FHD', fps: 30, codec: 'h264', crf: 18, priority: 'normal', titles: true, subtitles: true, audio: true, loudness: -14};
const loadSettings = () => { try { return {recent: [], render: DEFAULT_RENDER, projectsRoot: DEFAULT_PROJECTS, ...JSON.parse(fs.readFileSync(SETTINGS, 'utf8'))}; } catch { return {recent: [], render: DEFAULT_RENDER, projectsRoot: DEFAULT_PROJECTS}; } };
const saveSettings = (s) => fs.writeFileSync(SETTINGS, JSON.stringify(s, null, 1));
let settings = loadSettings();
setSharedRoots(settings.sharedTemplates);
const userName = () => settings.userName || os.userInfo().username;

// ── project registry (id ↔ absolute folder) ──────────────────────────────
const idOf = (dir) => crypto.createHash('sha1').update(path.resolve(dir).toLowerCase()).digest('hex').slice(0, 10);
const dirs = new Map();
const register = (dir) => { const d = path.resolve(dir); const id = idOf(d); dirs.set(id, d); return id; };
for (const r of settings.recent) if (fs.existsSync(path.join(r.dir, 'project.json'))) register(r.dir);
const samePath = (a, b) => idOf(a) === idOf(b); // Windows paths are case-insensitive
const touchRecent = (dir, name) => {
  settings.recent = [{dir: path.resolve(dir), name, opened: new Date().toISOString()}, ...settings.recent.filter((r) => !samePath(r.dir, dir))].slice(0, 20);
  saveSettings(settings);
};
settings.recent = settings.recent.filter((r, i, a) => a.findIndex((x) => samePath(x.dir, r.dir)) === i); // drop case-variant duplicates
// sample projects shipped with the app
if (fs.existsSync(DEFAULT_PROJECTS)) for (const e of fs.readdirSync(DEFAULT_PROJECTS)) {
  const d = path.join(DEFAULT_PROJECTS, e);
  if (fs.existsSync(path.join(d, 'project.json')) && !settings.recent.some((r) => samePath(r.dir, d))) { settings.recent.push({dir: d, name: readProject(d).name, opened: null}); register(d); }
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
    const ws = [];
    if (fs.existsSync(path.join(dir, 'scenes'))) ws.push(fs.watch(path.join(dir, 'scenes'), {recursive: true}, () => fire('code')));
    ws.push(fs.watch(dir, (ev, f) => { if (f === 'project.json') fire('project'); }));
    // Hyperframes scenes: no bundle needed — just tell the preview to reload its iframes
    if (fs.existsSync(path.join(dir, 'hf'))) { let th = null; ws.push(fs.watch(path.join(dir, 'hf'), {recursive: true}, () => { clearTimeout(th); th = setTimeout(() => broadcast('hf', {id, rev: Date.now()}), 300); })); }
    watchers.set(id, ws);
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
    if (fs.existsSync(src) && !fs.existsSync(path.join(dir, '.claude'))) copyDir(path.join(src, 'workflows'), path.join(dir, '.claude', 'workflows'));
    // app-owned skill + workflow: keep in sync with the installed Studio version
    for (const rel of ['workflows/sami-motion-video.js']) { // skills: ONE global copy (tools/install-skills.mjs), not per project
      const a = path.join(src, rel), b = path.join(dir, '.claude', rel);
      if (fs.existsSync(a) && (!fs.existsSync(b) || fs.readFileSync(a, 'utf8') !== fs.readFileSync(b, 'utf8'))) { fs.mkdirSync(path.dirname(b), {recursive: true}); fs.copyFileSync(a, b); }
    }
    ensureSnapshotHook(dir);
  } catch {}
};
// Claude Code hook: snapshot the project BEFORE every chat turn (version history). Merges into .claude/settings.json, keeps user settings.
const HOOK_MARK = 'cli-snapshot.mjs';
const ensureSnapshotHook = (dir) => {
  const f = path.join(dir, '.claude', 'settings.json');
  let s = {}; try { s = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { if (fs.existsSync(f)) return; } // unreadable user file → leave it alone
  const cmd = `node "${path.join(ROOT, 'server', 'cli-snapshot.mjs').replace(/\\/g, '/')}" --hook`;
  const groups = (s.hooks ||= {}).UserPromptSubmit ||= [];
  const ours = groups.flatMap((g) => g.hooks || []).find((x) => String(x.command || '').includes(HOOK_MARK));
  if (ours && ours.command === cmd) return;
  if (ours) ours.command = cmd; else groups.push({hooks: [{type: 'command', command: cmd, timeout: 60}]});
  fs.mkdirSync(path.dirname(f), {recursive: true}); fs.writeFileSync(f, JSON.stringify(s, null, 2));
};
// ── team: project lock <project>/.studio-lock {user, host, pid, since, beat} — warns a 2nd person opening the same project ──
const ME = {host: os.hostname(), pid: process.pid};
const openSet = new Set();
const lockFile = (dir) => path.join(dir, '.studio-lock');
const readLock = (dir) => { try { return JSON.parse(fs.readFileSync(lockFile(dir), 'utf8')); } catch { return null; } };
const isMine = (l) => !!l && l.host === ME.host && l.pid === ME.pid;
const lockAlive = (l) => !!l && Date.now() - Date.parse(l.beat) < 180000; // no heartbeat for 3 min = Studio closed / crashed
const writeLock = (dir) => { const l = readLock(dir); if (l && !isMine(l) && lockAlive(l)) return; /* someone else holds it — take over only after they close / go stale */ const now = new Date().toISOString(); try { fs.writeFileSync(lockFile(dir), JSON.stringify({user: userName(), host: ME.host, pid: ME.pid, since: isMine(l) ? l.since : now, beat: now})); } catch {} };
const dropLock = (dir) => { openSet.delete(dir); try { if (isMine(readLock(dir))) fs.rmSync(lockFile(dir), {force: true}); } catch {} };
setInterval(() => { for (const d of openSet) writeLock(d); }, 60000).unref();
const dropAll = () => { for (const d of [...openSet]) dropLock(d); };
process.on('exit', dropAll);
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) { try { process.on(sig, () => { dropAll(); process.exit(0); }); } catch {} }

// automatic anchors — never block a request; "save" anchors at most every 2 min per project
const lastSaveSnap = new Map();
// long Chrome jobs (review pack, compare) run in cli-review.mjs; progress → SSE "task"
const tasks = new Map(); let taskSeq = 0;
const startTask = (id, dir, kind, args) => {
  for (const t of tasks.values()) if (t.project === id && t.kind === kind && t.status === 'running') return {task: t.id, already: true};
  const t = {id: ++taskSeq, project: id, kind, status: 'running', msg: 'Đang chuẩn bị…', p: 0, result: null, error: null, started: Date.now()};
  const child = spawn(process.execPath, [path.join(ROOT, 'server', 'cli-review.mjs'), dir, ...args], {windowsHide: true, env: process.env});
  t.child = child; tasks.set(t.id, t);
  const pub = () => { const {child: _c, ...x} = t; broadcast('task', x); };
  let buf = '', log = '';
  child.stdout.on('data', (d) => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); if (!line.startsWith('@@')) continue; try { const m = JSON.parse(line.slice(2)); if (m.done) { t.result = m.done; t.status = 'done'; t.p = 1; t.msg = 'Xong'; } else if (m.error) { t.error = m.error; t.status = 'error'; } else { t.msg = m.msg; if (m.p != null) t.p = m.p; } pub(); } catch {} } });
  child.stderr.on('data', (d) => { log = (log + d).slice(-3000); });
  child.on('exit', (code) => { if (t.status === 'running') { t.status = 'error'; t.error = `Tiến trình dừng (mã ${code})\n` + log.replace(/\x1b\[[0-9;]*m/g, '').slice(-800); } t.child = null; pub(); setTimeout(() => tasks.delete(t.id), 3600e3); });
  pub(); return {task: t.id};
};
const autoSnap = (dir, kind, label = '') => history.snapshot(dir, {kind, label, source: 'Studio · ' + userName()}).catch((e) => console.error('snapshot:', e.message));

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
    if (p.startsWith('/cmp/')) { const f = path.resolve(CMP_ROOT, p.slice(5)); if (!f.startsWith(path.resolve(CMP_ROOT) + path.sep)) { res.writeHead(403); return res.end(); } return sendFile(req, res, f); }
    m = p.match(/^\/tpl\/([\w.-]+)\/(preview\/[\w.-]+)$/);
    if (m) return sendFile(req, res, path.join(tplDir(m[1]), m[2]));
    // Hyperframes scene preview: /hfp/<id>/<scene>/<16x9>/index.html (+ runtime/shim) and its assets (same paths as render staging)
    m = p.match(/^\/hfp\/([0-9a-f]{10})\/([\w.-]+)\/(\d+x\d+)\/(.*)$/);
    if (m) {
      const dir = dirs.get(m[1]); if (!dir) return json(res, {error: 'unknown project'}, 404);
      if (m[4] === '' || m[4] === 'index.html') {
        const pj = readProject(dir); const s = (pj.scenes || []).find((x) => x.id === m[2]);
        if (!s || !isHf(s)) { res.writeHead(404); return res.end('not a Hyperframes scene'); }
        let html; try { html = stageHtml(dir, pj, s, m[3].replace('x', ':'), 30, {preview: true}); }
        catch (e) { html = `<!doctype html><body style="margin:0;background:#300;color:#fff;font:28px Inter,sans-serif;padding:40px"><b>${s.id}</b><br>${String(e.message).replace(/</g, '&lt;')}<script>parent.postMessage({sami:'error',message:${JSON.stringify(String(e.message))}},'*')</script></body>`; }
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'}); return res.end(html);
      }
      const f = resolveStaged(dir, m[4]); if (!f) { res.writeHead(403); return res.end(); }
      return sendFile(req, res, f);
    }
    if (p === '/api/hf/lint' && req.method === 'POST') {
      const b = await jbody(req); const dir = dirs.get(b.id); if (!dir) return json(res, {error: 'unknown project'}, 404);
      const pj = readProject(dir); const s = pj.scenes.find((x) => x.id === b.scene); if (!s || !isHf(s)) return json(res, {error: 'Không phải cảnh Hyperframes'}, 400);
      return json(res, await lintScene(dir, pj, s, b.ratio));
    }
    // shared asset library (SAMI_Library)
    if (p === '/api/library/search') return json(res, {root: LIBRARY, items: library.search({q: u.searchParams.get('q') || '', kind: u.searchParams.get('kind') || null, limit: +(u.searchParams.get('limit') || 60)})});
    if (p === '/api/library/reindex' && req.method === 'POST') { const r = library.rebuildIndex(); return json(res, {count: r.count}); }
    if (p === '/api/library/brands') return json(res, library.listBrands().map((id) => ({id, ...library.readBrand(id)})));
    m = p.match(/^\/lib\/(.+)$/);
    if (m) { const f = library.resolveLib('lib:' + m[1]); if (!f) { res.writeHead(403); return res.end(); } return sendFile(req, res, f); }
    // ── Nguồn & AI (providers/gateway.mjs): keys never leave config.mjs, paid runs need the one-time token ──
    if (p.startsWith('/api/providers')) {
      const b = req.method === 'POST' ? await jbody(req) : {};
      const destFor = (x) => (x.to === 'project' ? dirs.get(x.id) || (() => { throw new Error('Chưa mở dự án'); })() : 'library');
      if (p === '/api/providers') return json(res, {providers: await providers.listProviders(), keys: pcfg.keyStatus(), caps: pcfg.getCaps(), opts: {kokoro: pcfg.getOpts('kokoro'), comfyui: pcfg.getOpts('comfyui')}, ledger: providers.ledgerSummary({limit: 0})});
      if (p === '/api/providers/key' && req.method === 'POST') return json(res, b.delete ? pcfg.deleteKey(b.keyId) : await pcfg.setKey(b.keyId, b.key));
      if (p === '/api/providers/caps' && req.method === 'POST') return json(res, pcfg.setCaps(b));
      if (p === '/api/providers/opts' && req.method === 'POST') { if (!['kokoro', 'comfyui'].includes(b.id)) return json(res, {error: 'không đổi được'}, 400); const url = String(b.opts?.url || ''); if (url && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(url)) return json(res, {error: 'Chỉ nhận địa chỉ cục bộ http://127.0.0.1:<cổng>'}, 400); return json(res, pcfg.setOpts(b.id, {url: url || undefined})); }
      if (p === '/api/providers/stock') return json(res, await providers.searchStock({provider: u.searchParams.get('provider') || 'auto', q: u.searchParams.get('q'), kind: u.searchParams.get('kind') || 'img', orientation: u.searchParams.get('orientation') || undefined, page: +(u.searchParams.get('page') || 1), perPage: 24}));
      if (p === '/api/providers/stock/fetch' && req.method === 'POST') { const r = await providers.fetchStock(b.item, {dest: destFor(b), confirmedBy: 'Studio · ' + userName()}); return json(res, {uri: r.uri, rel: r.rel, path: r.path, duplicate: r.duplicate, licence: r.meta.licence}); }
      if (p === '/api/providers/estimate' && req.method === 'POST') return json(res, await providers.estimate({...b.req, dest: destFor(b)}));
      if (p === '/api/providers/generate' && req.method === 'POST') {
        const r = await providers.generate({...b.req, dest: destFor(b)}, {token: b.token, confirmedBy: 'Studio · ' + userName(), onProgress: (x) => broadcast('provider', {id: b.id, ...x})});
        return json(res, {usd: r.usd, files: r.files.map((f) => ({uri: f.uri, rel: f.rel, path: f.path, duplicate: f.duplicate}))});
      }
      if (p === '/api/providers/ledger') return json(res, providers.ledgerSummary({limit: +(u.searchParams.get('limit') || 30)}));
    }
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
      const recent = settings.recent.filter((r) => fs.existsSync(path.join(r.dir, 'project.json'))).map((r) => { let status = 'draft'; try { status = readProject(r.dir).status || 'draft'; } catch {} const l = readLock(r.dir); return {...r, id: register(r.dir), status, lockedBy: l && !isMine(l) && lockAlive(l) ? l : null}; });
      const templates = listTemplates();
      return json(res, {recent, templates, categories: CATEGORIES, goals: GOALS, render: {...DEFAULT_RENDER, ...settings.render}, cpus: os.cpus().length, cpuModel: os.cpus()[0]?.model, platform: process.platform, gpu: gpuEncoders(), caps: caps(), ffmpeg: !!FFMPEG, hyperframes: HF_VERSION, library: LIBRARY, cache: CACHE, projectsRoot: settings.projectsRoot, sharedTemplates: settings.sharedTemplates || [], userName: userName(), host: os.hostname(), version: JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version});
    }
    if (p === '/api/settings' && req.method === 'POST') { const b = await jbody(req); settings = {...settings, ...b, render: {...settings.render, ...(b.render || {})}}; saveSettings(settings); setSharedRoots(settings.sharedTemplates); return json(res, {ok: true}); }
    if (p === '/api/pick-folder') { const d = await pickFolder(); return json(res, {dir: d, supported: process.platform === 'win32'}); }
    if (p === '/api/open' && req.method === 'POST') { const b = await jbody(req); if (b.path && fs.existsSync(b.path)) openPath(b.path); return json(res, {ok: true}); }
    if (p === '/api/project/open' && req.method === 'POST') {
      const b = await jbody(req);
      const dir = b.id ? dirs.get(b.id) : b.dir;
      if (!dir || !fs.existsSync(path.join(dir, 'project.json'))) return json(res, {error: 'Thư mục này không có project.json'}, 400);
      const id = register(dir); const pj = readProject(dir); syncEngineAssets(dir); ensureClaude(dir, pj); touchRecent(dir, pj.name); watch(id);
      const other = readLock(dir); const lockedBy = other && !isMine(other) && lockAlive(other) ? other : null;
      if (!b.reload) autoSnap(dir, 'open', 'Mở dự án'); openSet.add(dir); writeLock(dir);
      return json(res, {id, dir, project: pj, assets: listAssets(dir), lockedBy});
    }
    if (p === '/api/project/save' && req.method === 'POST') {
      const b = await jbody(req); const dir = dirs.get(b.id); if (!dir) return json(res, {error: 'unknown'}, 404);
      writeProject(dir, b.project); touchRecent(dir, b.project.name);
      if (Date.now() - (lastSaveSnap.get(dir) || 0) > 120000) { lastSaveSnap.set(dir, Date.now()); autoSnap(dir, 'save', 'Lưu trong Studio'); }
      return json(res, {ok: true, validation: validateProject(dir)});
    }
    if (p === '/api/project/close' && req.method === 'POST') { const b = await jbody(req); const dir = dirs.get(b.id); if (dir) dropLock(dir); return json(res, {ok: true}); }
    if (p === '/api/project/validate') { const dir = dirs.get(u.searchParams.get('id')); return json(res, validateProject(dir)); }
    if (p === '/api/project/assets') { const dir = dirs.get(u.searchParams.get('id')); return json(res, listAssets(dir)); }
    if (p === '/api/project/new' && req.method === 'POST') {
      const b = await jbody(req);
      const tpl = tplDir(b.template || 'agency-promo');
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
    if (p === '/api/project/import-assets' && req.method === 'POST') { const b = await jbody(req); const dir = dirs.get(b.id); await autoSnap(dir, 'before-upload', 'Trước khi nhập tài nguyên'); return json(res, importAssets(b.from, dir)); }
    if (p === '/api/upload' && req.method === 'POST') { // raw body, ?id=&sub=audio&name=file.mp3
      const dir = dirs.get(u.searchParams.get('id')); const sub = (u.searchParams.get('sub') || 'img').replace(/[^a-z]/g, '');
      const name = path.basename(u.searchParams.get('name') || 'file').replace(/[^\p{L}\p{N}._-]+/gu, '_');
      const dst = path.join(dir, 'public', sub, name); fs.mkdirSync(path.dirname(dst), {recursive: true});
      const data = await body(req);
      if (fs.existsSync(dst)) await autoSnap(dir, 'before-upload', `Trước khi thay ${sub}/${name}`); // same name → keep the old file in history
      fs.writeFileSync(dst, data); return json(res, {path: `${sub}/${name}`});
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
    if (p === '/api/template/check' && req.method === 'POST') { const b = await jbody(req); return json(res, checkTemplate(tplDir(b.tpl))); }
    if (p === '/api/template/thumbs' && req.method === 'POST') {
      const b = await jbody(req); const dir = tplDir(b.tpl);
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
    if (p === '/api/template/import' && req.method === 'POST') { const b = await jbody(req); return json(res, importTemplate(b.from, {shared: !!b.shared})); }
    if (p === '/api/template/export' && req.method === 'POST') { const b = await jbody(req); const r = exportTemplate(b.tpl); openPath(path.dirname(r.out)); return json(res, r); }
    if (p === '/api/pick-file') { const d = await pickFile(u.searchParams.get('filter') || 'Zip|*.zip'); return json(res, {file: d, supported: process.platform === 'win32'}); }
    if (p === '/api/gpu/diagnose') return json(res, await gpuDiagnose());
    if (p === '/api/render/stop-all' && req.method === 'POST') { stopAll(); return json(res, {ok: true}); }
    if (p === '/api/jobs') return json(res, publicJobs());
    // ── batch variants (CSV in brief/variants.csv) ──
    if (p === '/api/variants') { const dir = dirs.get(u.searchParams.get('id')); const f = path.join(dir || '', 'brief', 'variants.csv'); return json(res, {csv: fs.existsSync(f) ? fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '') : ''}); }
    if (p === '/api/variants/save' && req.method === 'POST') {
      const b = await jbody(req); const dir = dirs.get(b.id); if (!dir) return json(res, {error: 'unknown project'}, 404);
      const f = path.join(dir, 'brief', 'variants.csv'); fs.mkdirSync(path.dirname(f), {recursive: true});
      if (fs.existsSync(f)) await autoSnap(dir, 'before-upload', 'Trước khi thay bảng biến thể');
      fs.writeFileSync(f, '\uFEFF' + String(b.csv || '').replace(/^\uFEFF+/, '')); // one BOM \u2192 Excel reads UTF-8 (VI/DE accents)
      return json(res, {ok: true}); // 0.5.0 had this return inside the comment above \u2192 route fell through to 404
    }
    // ── review pack + compare (Chrome → child process) ──
    if (p === '/api/review' && req.method === 'POST') {
      const b = await jbody(req); const dir = dirs.get(b.id); if (!dir) return json(res, {error: 'unknown project'}, 404);
      return json(res, startTask(b.id, dir, 'review', ['review']));
    }
    if (p === '/api/history/compare' && req.method === 'POST') {
      const b = await jbody(req); const dir = dirs.get(b.id); if (!dir) return json(res, {error: 'unknown project'}, 404);
      return json(res, startTask(b.id, dir, 'compare', ['compare', path.basename(b.a), b.b ? path.basename(b.b) : 'current', ...(b.ratio ? [b.ratio] : [])]));
    }
    if (p === '/api/tasks') return json(res, [...tasks.values()].map(({child, ...t}) => t));
    if (p === '/api/review/feedback' && req.method === 'POST') {
      const b = await jbody(req); const dir = dirs.get(b.id); if (!dir) return json(res, {error: 'unknown project'}, 404);
      const text = String(b.text || '').trim(); if (!text) return json(res, {error: 'Chưa có nội dung góp ý'}, 400);
      const f = path.join(dir, 'brief', 'GOP_Y.md'); fs.mkdirSync(path.dirname(f), {recursive: true});
      if (!fs.existsSync(f)) fs.writeFileSync(f, `# GÓP Ý KHÁCH — ${readProject(dir).name}\n\nMới nhất ở cuối. Claude Code: đọc file này khi được yêu cầu "sửa theo góp ý", rồi đánh dấu [x] mục đã xử lý.\n`);
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => (/^- \[/.test(l) ? l : '- [ ] ' + l.replace(/^[-•*]\s*/, '')));
      fs.appendFileSync(f, `\n## ${new Date().toLocaleString('vi-VN')}${b.who ? ' — ' + String(b.who).slice(0, 60) : ''}\n${lines.join('\n')}\n`);
      return json(res, {ok: true, file: f, items: lines.length});
    }
    if (p === '/api/review/list') {
      const dir = dirs.get(u.searchParams.get('id')); const rd = path.join(dir || '', 'out', 'review');
      const items = fs.existsSync(rd) ? fs.readdirSync(rd).filter((d) => fs.existsSync(path.join(rd, d, 'review.html'))).sort().reverse().slice(0, 10).map((d) => ({stamp: d, html: `out/review/${d}/review.html`, sheets: fs.readdirSync(path.join(rd, d)).filter((f) => /^contact_.*\.jpg$/.test(f)).map((f) => `out/review/${d}/${f}`), path: path.join(rd, d)})) : [];
      return json(res, items);
    }
    // ── version history (điểm neo) ──
    if (p.startsWith('/api/history')) {
      const b = req.method === 'POST' ? await jbody(req) : {}; const dir = dirs.get(b.id || u.searchParams.get('id')); if (!dir) return json(res, {error: 'unknown project'}, 404);
      if (p === '/api/history') return json(res, {items: await history.list(dir), bytes: await history.usage(dir)});
      if (p === '/api/history/preview') return json(res, await history.preview(dir, u.searchParams.get('snap')));
      if (p === '/api/history/snapshot') return json(res, await history.snapshot(dir, {kind: 'manual', label: b.label || '', starred: !!b.starred, source: b.source || 'Studio', force: true}));
      if (p === '/api/history/star') return json(res, await history.star(dir, b.snap, {label: b.label, starred: b.starred}));
      if (p === '/api/history/prune') return json(res, await history.prune(dir));
      if (p === '/api/history/restore') {
        const r = await history.restore(dir, b.snap, {paths: b.paths?.length ? b.paths : null});
        const id = register(dir); const pb = await previewBundle(dir); broadcast('restored', {id, hash: pb.hash});
        return json(res, r);
      }
    }
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
