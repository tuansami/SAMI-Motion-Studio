// Template library: standard check (docs/TEMPLATE_STANDARD.md), thumbnails, save-as-template, import/export.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {spawnSync} from 'child_process';
import {validateProject} from './validate.mjs';
import {readProject, renderBundle} from './project.mjs';
import {TEMPLATES, ROOT} from './paths.mjs';

export const CATEGORIES = {restaurant: 'Nhà hàng', nail: 'Nail', spa: 'Spa', hotel: 'Khách sạn', 'real-estate': 'Bất động sản', education: 'Giáo dục / bài giảng', news: 'Tin tức', science: 'Khoa học / giải thích', agency: 'Agency / SAMI', style: 'Phong cách (demo)', generic: 'Chung'};
export const GOALS = {'khai-truong': 'Khai trương', 'menu-moi': 'Menu mới', 'uu-dai': 'Ưu đãi', 'tuyen-dung': 'Tuyển dụng', review: 'Review / cảm nhận', 'gioi-thieu': 'Giới thiệu dịch vụ', 'su-kien': 'Sự kiện / lễ', 'meo-hay': 'Mẹo / kiến thức (carousel)'};
const FORBIDDEN = ['out', 'brief', '.claude', 'node_modules', 'CLAUDE.md', '.project.backup.json'];
const REQUIRED = ['id', 'name', 'version', 'category', 'description', 'formats'];
const IMG_SLOT = /(_image|_logo|_img|_photo)$/i;

const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, {withFileTypes: true}).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
export const readManifest = (dir) => { try { return JSON.parse(fs.readFileSync(path.join(dir, 'template.json'), 'utf8')); } catch { return null; } };
export const thumbName = (r) => `thumb_${r.replace(':', 'x')}.jpg`;

// ── template roots: the app's own library + shared team folders (NAS / Google Drive / OneDrive) ──
// shared templates get the id "sh<hash>_<folder>" so ids stay unique and URL-safe ([\w.-]+)
let SHARED = [];
export const setSharedRoots = (list) => { SHARED = (list || []).filter((d) => d && fs.existsSync(d)).map((d) => path.resolve(d)); };
export const sharedRoots = () => SHARED;
const rootKey = (root) => 'sh' + crypto.createHash('sha1').update(root.toLowerCase()).digest('hex').slice(0, 5) + '_';
const roots = () => [{root: TEMPLATES, prefix: '', shared: false}, ...SHARED.map((r) => ({root: r, prefix: rootKey(r), shared: true}))];
/** template id → folder (library or shared) */
export const tplDir = (id) => {
  id = path.basename(String(id || ''));
  for (const r of roots()) if (r.prefix && id.startsWith(r.prefix)) return path.join(r.root, id.slice(r.prefix.length));
  return path.join(TEMPLATES, id);
};
export const isTemplateDir = (dir) => roots().some((r) => path.resolve(dir).toLowerCase().startsWith(r.root.toLowerCase() + path.sep));

/** stats derived from project.json (duration, slots) */
export const templateStats = (dir) => {
  const p = readProject(dir);
  const keys = Object.keys(p.copy || {});
  return {duration: +((p.scenes.at(-1)?.end || 0) / 30).toFixed(1), scenes: p.scenes.length, slots: {text: keys.filter((k) => !IMG_SLOT.test(k)).length, image: keys.filter((k) => /(_image|_img|_photo)$/i.test(k)).length, logo: keys.filter((k) => /_logo$/i.test(k)).length}};
};

/** check a template folder against TEMPLATE_STANDARD v1 → {ok, warn, fail, stats} */
export const checkTemplate = (dir) => {
  const ok = [], warn = [], fail = [];
  const m = readManifest(dir);
  if (!m) fail.push('Thiếu template.json');
  else { const miss = REQUIRED.filter((k) => !m[k] || (Array.isArray(m[k]) && !m[k].length)); miss.length ? fail.push('template.json thiếu: ' + miss.join(', ')) : ok.push('template.json đủ thông tin.'); if (m.category && !CATEGORIES[m.category]) warn.push(`Nhóm "${m.category}" không chuẩn (${Object.keys(CATEGORIES).join(' | ')})`); }
  for (const f of FORBIDDEN) if (fs.existsSync(path.join(dir, f))) fail.push(`Không được chứa "${f}" trong mẫu (xoá đi).`);
  if (fs.existsSync(path.join(dir, 'public', '_engine'))) warn.push('Có public/_engine (Studio tự tạo) — nên xoá khỏi mẫu cho nhẹ.');
  let p; try { p = readProject(dir); } catch (e) { fail.push('project.json lỗi: ' + e.message); return {ok, warn, fail}; }
  // 1 · general validation
  const v = validateProject(dir); fail.push(...v.fail); warn.push(...v.warn); if (!v.fail.length) ok.push('Kiểm tra dự án: đạt.');
  // 2 · labelled copy
  const badLabel = Object.entries(p.copy || {}).filter(([k, c]) => !c.label || c.label === k || c.label.length < 4);
  badLabel.length ? fail.push('Ô chữ thiếu tên tiếng Việt rõ ràng: ' + badLabel.map(([k]) => k).join(', ')) : ok.push(`${Object.keys(p.copy || {}).length} ô chữ đều có tên rõ ràng.`);
  // scene code scans
  const files = walk(path.join(dir, 'scenes')).filter((f) => /\.tsx?$/.test(f));
  const hard = [], hex = [], cf = [], spr = [], img = [];
  for (const f of files) {
    const t = fs.readFileSync(f, 'utf8'); const n = path.basename(f);
    if (/useCurrentFrame\s*\(/.test(t)) cf.push(n);
    if (/\bspring\s*\(|transition\s*:/.test(t)) spr.push(n);
    for (const mm of t.matchAll(/staticFile\(\s*['"`](img\/[^'"`$]+)['"`]/g)) img.push(`${n}: ${mm[1]}`);
    const hx = (t.match(/#[0-9a-fA-F]{6}\b/g) || []).filter((c) => !/^#(ffffff|000000)$/i.test(c)); if (hx.length > 3) hex.push(`${n} (${hx.length})`);
    for (const mm of t.matchAll(/>\s*([A-Za-zÀ-ỹĐđ][^<>{}\n]{6,})\s*</g)) if (/[\p{L}]{3}/u.test(mm[1]) && !/^\s*(className|style)/.test(mm[1])) hard.push(`${n}: "${mm[1].trim().slice(0, 30)}"`);
  }
  if (cf.length) fail.push('Dùng useCurrentFrame() trong cảnh (sai ở 24/60 fps) → đổi sang useT(): ' + cf.join(', '));
  if (spr.length) fail.push('Dùng spring/transition (không đúng easing chuẩn): ' + spr.join(', '));
  if (img.length) fail.push('Ảnh gắn cứng trong code (phải là ô ảnh trong copy): ' + img.slice(0, 5).join('; '));
  if (hard.length) warn.push('Có thể có chữ viết cứng trong code (nên chuyển vào copy): ' + hard.slice(0, 4).join('; '));
  if (hex.length) warn.push('Nhiều mã màu cứng — nên dùng màu theme (C.*, GRAD): ' + hex.join(', '));
  if (!cf.length && !spr.length && !img.length) ok.push('Code cảnh theo chuẩn engine (useT, easing, ô ảnh).');
  // 4 · per-ratio layouts
  const fm = m?.formats || p.formats;
  if (fm.some((r) => !p.formats.includes(r))) fail.push('template.json khai tỉ lệ mà project.json chưa có: ' + fm.filter((r) => !p.formats.includes(r)).join(', '));
  const hfFiles = walk(path.join(dir, 'hf')).filter((f) => /\.html?$/.test(f));
  if (p.formats.length > 1 && !files.some((f) => /useFormat|usePick/.test(fs.readFileSync(f, 'utf8'))) && !hfFiles.some((f) => /data-ratio|SAMI\.pick|SAMI\.portrait|SAMI\.landscape/.test(fs.readFileSync(f, 'utf8')))) fail.push('Khai nhiều tỉ lệ nhưng không cảnh nào dùng useFormat/usePick (chưa có bố cục riêng).');
  else if (p.formats.length > 1) ok.push('Có bố cục riêng: ' + p.formats.join(' · '));
  // 8 · beat grid · 9 · reading time
  const off = p.scenes.filter((s, i) => i > 0 && (s.start - 1) % 15 !== 0 && s.start % 15 !== 0);
  if (off.length) warn.push('Điểm cắt lệch nhịp: ' + off.map((s) => s.id).join(', ') + ' (bấm "Khớp nhịp")');
  const slow = [];
  for (const [k, c] of Object.entries(p.copy || {})) {
    if (IMG_SLOT.test(k) || typeof c.value !== 'string') continue; const s = p.scenes.find((x) => x.id === c.scene); if (!s) continue;
    const words = c.value.replace(/[*\/]/g, ' ').trim().split(/\s+/).filter(Boolean).length; const sec = (s.end - s.start) / 30;
    if (words >= 6 && sec < words * 0.22) slow.push(`${c.label} (${words} chữ / ${sec.toFixed(1)}s)`);
  }
  if (slow.length) warn.push('Có thể không kịp đọc: ' + slow.slice(0, 4).join('; '));
  // 10 · audio licence
  const aud = walk(path.join(dir, 'public', 'audio'));
  if (aud.length && !m?.audioLicense) warn.push('Có nhạc trong mẫu nhưng template.json chưa ghi "audioLicense" (nguồn + giấy phép).');
  // client assets
  const imgs = walk(path.join(dir, 'public', 'img')).map((f) => path.basename(f)).filter((f) => !/^placeholder|^demo|^sample|^mau/i.test(f));
  if (imgs.length) warn.push(`Có ${imgs.length} ảnh không phải ảnh minh hoạ (${imgs.slice(0, 4).join(', ')}${imgs.length > 4 ? '…' : ''}) — chắc chắn không phải ảnh thật của khách? (đặt tên placeholder_*.jpg nếu là ảnh mẫu)`);
  const size = walk(path.join(dir, 'public')).filter((f) => !f.includes('_engine')).reduce((s, f) => s + fs.statSync(f).size, 0);
  if (size > 60e6) warn.push(`Mẫu nặng ${(size / 1e6).toFixed(0)} MB — nén ảnh/nhạc để dễ chia sẻ.`);
  // 13 · thumbs + readme
  const missingThumbs = (fm || []).filter((r) => !fs.existsSync(path.join(dir, 'preview', thumbName(r))));
  if (missingThumbs.length) warn.push('Chưa có ảnh bìa: ' + missingThumbs.join(', ') + ' → bấm "Tạo ảnh bìa"');
  if (!fs.existsSync(path.join(dir, 'README.md'))) warn.push('Chưa có README.md (khi nào dùng mẫu, lưu ý).');
  warn.push('Tự kiểm tay: không số liệu/giá/review bịa · không logo nền tảng · render thử 24/60 fps · chữ tiếng Việt không mất dấu.');
  return {ok, warn, fail, stats: templateStats(dir)};
};

/** render small cover images for each format (runs Chrome — call from a child process / CLI) */
export const makeThumbs = async (dir, onLog = () => {}) => {
  const {stills} = await import('./still.mjs'); // Remotion scenes → renderStill, Hyperframes scenes → snapshot
  const m = readManifest(dir) || {}; const p = readProject(dir);
  const hadEngine = fs.existsSync(path.join(dir, 'public', '_engine'));
  fs.mkdirSync(path.join(dir, 'preview'), {recursive: true});
  const total = p.scenes.at(-1)?.end || 30;
  const frame = Math.min(total - 1, Math.max(0, m.thumbFrame ?? Math.round(total * 0.35)));
  for (const ratio of m.formats || p.formats) {
    await stills(dir, [frame], () => path.join(dir, 'preview', thumbName(ratio)), {ratio, fps: 30, project: p, titles: true, subtitles: false, jpegQuality: 82, scale: ratio === '16:9' ? 0.34 : 0.36});
    onLog('ok ' + ratio);
  }
  if (!hadEngine && isTemplateDir(dir)) fs.rmSync(path.join(dir, 'public', '_engine'), {recursive: true, force: true});
};

const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 48) || 'mau';
const copyDir = (s, d, skip) => {
  fs.mkdirSync(d, {recursive: true});
  for (const e of fs.readdirSync(s, {withFileTypes: true})) {
    if (skip(e.name)) continue;
    const a = path.join(s, e.name), b = path.join(d, e.name);
    e.isDirectory() ? copyDir(a, b, skip) : fs.copyFileSync(a, b);
  }
};
const freeId = (id, root = TEMPLATES) => { let x = id, n = 2; while (fs.existsSync(path.join(root, x))) x = `${id}-${n++}`; return x; };
const SKIP = (n) => FORBIDDEN.includes(n) || n === '_engine' || n === '.parts' || n === 'preview_tmp';

/** turn a project into a library template */
export const saveAsTemplate = (projDir, meta) => {
  const root = meta.shared && SHARED[0] ? SHARED[0] : TEMPLATES;
  const id = freeId(slug(meta.tplId || meta.name || 'mau'), root);
  const dir = path.join(root, id);
  copyDir(projDir, dir, SKIP);
  const p = readProject(dir);
  if (meta.name) { p.name = meta.name; fs.writeFileSync(path.join(dir, 'project.json'), JSON.stringify(p, null, 1)); }
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const man = {id, name: meta.name || p.name, version: '1.0.0', studio: '>=' + pkg.version, category: meta.category || 'generic', goal: meta.goal || [], description: meta.description || '', formats: p.formats, ...templateStats(dir), bpm: 120, languages: ['vi'], thumbFrame: meta.thumbFrame ?? Math.round((p.scenes.at(-1)?.end || 30) * 0.35), author: meta.author || 'SAMI Marketing Agency', license: meta.license || 'internal', tags: meta.tags || []};
  fs.writeFileSync(path.join(dir, 'template.json'), JSON.stringify(man, null, 2));
  if (!fs.existsSync(path.join(dir, 'README.md'))) fs.writeFileSync(path.join(dir, 'README.md'), `# ${man.name}\n\n${man.description}\n\n- Nhóm: ${CATEGORIES[man.category] || man.category}\n- Tỉ lệ: ${man.formats.join(' · ')} · ${man.duration}s\n- Khi nào dùng:\n- Lưu ý khi thay nội dung:\n`);
  return {id: (root === TEMPLATES ? '' : rootKey(root)) + id, dir};
};

/** list templates for the gallery */
export const listTemplates = () => roots().flatMap(({root, prefix, shared}) => { try { return fs.readdirSync(root).filter((t) => fs.existsSync(path.join(root, t, 'project.json'))).map((f) => {
  const t = prefix + f; const dir = path.join(root, f);
  try { const pj = readProject(dir); const m = readManifest(dir) || {};
  return {id: t, shared, root: shared ? root : null, name: m.name || pj.name, description: m.description || '', category: m.category || 'generic', style: m.style || null, engine: m.engine || null, goal: m.goal || [], tags: m.tags || [], version: m.version || '0', license: m.license || '', author: m.author || '',
    formats: pj.formats, scenes: pj.scenes.length, khuonScenes: pj.scenes.filter((s) => s.khuon).length, theme: pj.look?.theme || null, seconds: +(pj.scenes.at(-1).end / 30).toFixed(1), hasManifest: !!readManifest(dir),
    thumbs: Object.fromEntries(pj.formats.filter((r) => fs.existsSync(path.join(dir, 'preview', thumbName(r)))).map((r) => [r, `/tpl/${t}/preview/${thumbName(r)}`]))};
  } catch { return null; } }).filter(Boolean); } catch { return []; } }); // an offline NAS / broken template never breaks the gallery

/** import a template folder or .zip into the library */
export const importTemplate = (from, {shared = false} = {}) => {
  const root = shared && SHARED[0] ? SHARED[0] : TEMPLATES;
  let src = from; let tmp = null;
  if (/\.zip$/i.test(from)) {
    tmp = path.join(TEMPLATES, '..', '.studio', 'import_' + Date.now()); fs.mkdirSync(tmp, {recursive: true});
    const r = process.platform === 'win32'
      ? spawnSync('powershell.exe', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${from.replace(/'/g, "''")}' -DestinationPath '${tmp.replace(/'/g, "''")}' -Force`], {windowsHide: true})
      : spawnSync('unzip', ['-q', from, '-d', tmp]);
    if (r.status !== 0) throw new Error('Không giải nén được file zip');
    const found = walk(tmp).find((f) => path.basename(f) === 'project.json'); if (!found) throw new Error('Trong zip không có project.json');
    src = path.dirname(found);
  }
  if (!fs.existsSync(path.join(src, 'project.json'))) throw new Error('Thư mục này không phải mẫu (thiếu project.json)');
  const m = readManifest(src);
  const id = freeId(slug(m?.id || path.basename(src)), root);
  copyDir(src, path.join(root, id), SKIP);
  if (tmp) fs.rmSync(tmp, {recursive: true, force: true});
  return {id: (root === TEMPLATES ? '' : rootKey(root)) + id, check: checkTemplate(path.join(root, id))};
};

/** zip a template for sharing → <app>/exports/<id>-<version>.zip */
export const exportTemplate = (id) => {
  const dir = tplDir(id); const m = readManifest(dir) || {}; id = path.basename(dir);
  const outDir = path.join(ROOT, 'exports'); fs.mkdirSync(outDir, {recursive: true});
  const out = path.join(outDir, `${id}-${m.version || '1.0.0'}.zip`); if (fs.existsSync(out)) fs.rmSync(out);
  const r = process.platform === 'win32'
    ? spawnSync('powershell.exe', ['-NoProfile', '-Command', `Compress-Archive -Path '${dir.replace(/'/g, "''")}' -DestinationPath '${out.replace(/'/g, "''")}' -Force`], {windowsHide: true})
    : spawnSync('zip', ['-qr', out, id, '-x', `${id}/public/_engine/*`], {cwd: path.dirname(dir)});
  if (r.status !== 0) throw new Error('Không nén được mẫu: ' + String(r.stderr || '').slice(0, 300));
  return {out};
};
