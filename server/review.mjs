// Review pack (gói duyệt) + snapshot compare. Runs Chrome → only call from a child process (cli-review.mjs).
//   buildReview(dir)          → out/review/<stamp>/review.html (self-contained: stills embedded, comment box per scene)
//                               + contact_<ratio>.jpg (grid of every scene) + stills/<ratio>/<scene>.jpg
//   compareSnapshots(dir,a,b) → stills of every scene in two versions (snapshot id or 'current') + which ones differ
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {spawn} from 'child_process';
import {renderBundle, readProject} from './project.mjs';
import {DATA, NODE_MODULES} from './paths.mjs';
import {materialize, get as getSnap} from './history.mjs';
import {ff} from './ffmpeg.mjs';

// GPU rendering is not bit-exact (tiny anti-aliasing noise) → compare 64×36 grey thumbnails with a tolerance.
// Measured: unchanged scenes max Δ 0, changed text max Δ ≈ 170 (of 255).
const thumb = (f) => ff(['-v', 'error', '-i', f, '-vf', 'scale=64:36:flags=area,format=gray', '-f', 'image2pipe', '-c:v', 'rawvideo', '-'], {windowsHide: true}).stdout;
export const looksSame = (a, b, tol = 12) => {
  if (sha(a) === sha(b)) return true;
  const x = thumb(a), y = thumb(b); if (!x?.length || x.length !== y?.length) return false;
  for (let i = 0; i < x.length; i++) if (Math.abs(x[i] - y[i]) >= tol) return false;
  return true;
};

const BASE = 30;
const pad = (n) => String(n).padStart(2, '0');
const tc = (f) => { const s = f / BASE; return `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`; };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]);
const sha = (f) => crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex');
const browserOpts = () => ({browserExecutable: process.env.REMOTION_BROWSER || null, chromiumOptions: {gl: process.env.REMOTION_GL || 'angle'}});

/** one still per scene (middle frame) for each ratio → [{ratio, scene, label, frame, file}] */
export const sceneStills = async (dir, {ratios, outDir, scale = 0.5, quality = 82, onLog = () => {}} = {}) => {
  const {renderStill, selectComposition} = await import('@remotion/renderer');
  const p = readProject(dir); ratios = ratios || p.formats;
  onLog('Đóng gói dự án…');
  const serveUrl = await renderBundle(dir);
  const out = []; const total = ratios.length * p.scenes.length; let n = 0;
  for (const ratio of ratios) {
    const inputProps = {project: p, ratio, fps: BASE, titles: true, subtitles: true, audio: false};
    const comp = await selectComposition({serveUrl, id: 'Main', inputProps, ...browserOpts()});
    const d = path.join(outDir, ratio.replace(':', 'x')); fs.mkdirSync(d, {recursive: true});
    for (const s of p.scenes) {
      const frame = Math.min(comp.durationInFrames - 1, Math.round((s.start + s.end) / 2));
      const file = path.join(d, s.id + '.jpg');
      await renderStill({composition: comp, serveUrl, inputProps, frame, output: file, imageFormat: 'jpeg', jpegQuality: quality, scale, ...browserOpts()});
      out.push({ratio, scene: s.id, label: s.label || '', start: s.start, end: s.end, frame, file});
      onLog(`Ảnh ${++n}/${total} · ${ratio} · ${s.id}`, n / total);
    }
  }
  return out;
};

// ── headless screenshot of an HTML file (contact sheet) via the Chrome that Remotion already ships ──
const findChrome = () => {
  if (process.env.REMOTION_BROWSER) return process.env.REMOTION_BROWSER;
  const root = path.join(NODE_MODULES, '.remotion', 'chrome-headless-shell');
  const walk = (d, depth = 0) => { if (depth > 4 || !fs.existsSync(d)) return null; for (const e of fs.readdirSync(d, {withFileTypes: true})) { const p = path.join(d, e.name); if (e.isFile() && /^chrome-headless-shell(\.exe)?$/.test(e.name)) return p; if (e.isDirectory()) { const r = walk(p, depth + 1); if (r) return r; } } return null; };
  return walk(root);
};
export const screenshotHtml = async (htmlFile, outJpg, width = 1600) => {
  const exe = findChrome(); if (!exe) throw new Error('Không tìm thấy Chrome headless của Remotion');
  const port = 9400 + Math.floor(Math.random() * 400);
  const prof = path.join(DATA, 'chrome-shot-' + port);
  const ch = spawn(exe, [`--remote-debugging-port=${port}`, '--no-first-run', '--hide-scrollbars', `--user-data-dir=${prof}`, 'about:blank'], {stdio: 'ignore', windowsHide: true});
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  try {
    let tg; for (let i = 0; i < 60 && !tg; i++) { try { tg = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); } catch {} if (!tg) await sleep(250); }
    if (!tg) throw new Error('Chrome không khởi động');
    const ws = new WebSocket(tg.webSocketDebuggerUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let n = 0; const pend = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result || {}); pend.delete(d.id); } };
    const send = (method, params = {}) => new Promise((r) => { const id = ++n; pend.set(id, r); ws.send(JSON.stringify({id, method, params})); });
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {width, height: 900, deviceScaleFactor: 1, mobile: false});
    await send('Page.navigate', {url: 'file:///' + htmlFile.replace(/\\/g, '/')});
    await sleep(1500);
    const {result} = await send('Runtime.evaluate', {expression: 'document.documentElement.scrollHeight', returnByValue: true});
    const height = Math.min(16000, Math.ceil(result?.value || 900));
    const shot = await send('Page.captureScreenshot', {format: 'jpeg', quality: 86, captureBeyondViewport: true, clip: {x: 0, y: 0, width, height, scale: 1}});
    fs.writeFileSync(outJpg, Buffer.from(shot.data, 'base64')); ws.close();
  } finally { try { ch.kill(); } catch {} setTimeout(() => fs.rmSync(prof, {recursive: true, force: true}), 1500); }
};

const sheetHtml = (p, ratio, items, rel) => `<!doctype html><meta charset="utf-8"><style>
body{margin:0;background:#0C0628;color:#EEEBFF;font:15px/1.4 "Segoe UI",Inter,sans-serif;padding:28px}
h1{font-size:22px;margin:0 0 4px}p{margin:0 0 18px;color:#9C97C0}
.g{display:grid;grid-template-columns:repeat(${ratio === '9:16' ? 6 : ratio === '1:1' ? 5 : 4},1fr);gap:14px}
.c img{width:100%;display:block;border-radius:6px;border:1px solid rgba(255,255,255,.12)}.c b{color:#08DDA4}.c div{font-size:12.5px;margin-top:5px;color:#C9C5E6}
</style><h1>${esc(p.name)} — ${ratio}</h1><p>${esc(p.client || '')} · ${items.length} cảnh · ${new Date().toLocaleString('vi-VN')}</p>
<div class="g">${items.map((it) => `<div class="c"><img src="${rel(it.file)}"><div><b>${it.scene}</b> · ${tc(it.start)} · ${esc(it.label)}</div></div>`).join('')}</div>`;

const reviewHtml = (p, items, ratios) => {
  const img = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(f).toString('base64');
  const scenes = p.scenes.map((s) => ({id: s.id, label: s.label || '', start: s.start, end: s.end, shots: ratios.map((r) => items.find((x) => x.scene === s.id && x.ratio === r)).filter(Boolean)}));
  const key = 'sami-review-' + crypto.createHash('sha1').update(p.name + Date.now()).digest('hex').slice(0, 8);
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Duyệt video — ${esc(p.name)}</title><style>
:root{--bg:#0C0628;--panel:#161039;--line:rgba(255,255,255,.12);--text:#EEEBFF;--muted:#9C97C0;--mint:#08DDA4;--purple:#7667FE}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 "Segoe UI",Inter,system-ui,sans-serif}
header{position:sticky;top:0;z-index:2;background:#0B0724ee;backdrop-filter:blur(6px);border-bottom:1px solid var(--line);padding:12px 16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
header h1{font-size:17px;margin:0;flex:1;min-width:200px}header small{color:var(--muted);font-weight:400}
button{font:inherit;border:0;border-radius:8px;padding:8px 14px;cursor:pointer;background:linear-gradient(120deg,var(--mint),var(--purple));color:#07041A;font-weight:700}
main{max-width:1200px;margin:0 auto;padding:16px}.intro{color:var(--muted);margin:4px 0 16px}
.sc{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px;margin-bottom:14px}
.sc h2{font-size:15px;margin:0 0 10px}.sc h2 b{color:var(--mint)}.sc h2 span{color:var(--muted);font-weight:400}
.shots{display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap;margin-bottom:10px}.shots figure{margin:0}.shots img{display:block;max-height:340px;max-width:100%;border-radius:8px;border:1px solid var(--line)}
.shots figcaption{font-size:11.5px;color:var(--muted)}
textarea{width:100%;min-height:58px;background:#0A0722;color:var(--text);border:1px solid var(--line);border-radius:8px;padding:8px 10px;font:inherit;resize:vertical}
.ok{color:var(--mint);font-size:13px}@media(max-width:600px){.shots img{max-height:260px}}
</style></head><body>
<header><h1>${esc(p.name)} <small>· ${esc(p.client || '')} · bản duyệt ${new Date().toLocaleDateString('vi-VN')}</small></h1><button id="copy">Sao chép góp ý</button><span class="ok" id="msg"></span></header>
<main><p class="intro">Ảnh dưới đây là khung giữa của từng cảnh. Ghi góp ý vào ô của cảnh cần sửa (để trống nếu đã ổn), rồi bấm <b>Sao chép góp ý</b> và dán vào tin nhắn gửi lại SAMI. Góp ý được tự lưu trên trình duyệt này.</p>
<div class="sc"><h2>Góp ý chung</h2><textarea data-k="_all" placeholder="Nhạc, màu, nhịp, thông điệp, CTA…"></textarea></div>
${scenes.map((s) => `<div class="sc"><h2><b>${s.id}</b> <span>${tc(s.start)}–${tc(s.end)}</span> · ${esc(s.label)}</h2><div class="shots">${s.shots.map((x) => `<figure><img loading="lazy" src="${img(x.file)}" alt="${s.id} ${x.ratio}"><figcaption>${x.ratio}</figcaption></figure>`).join('')}</div><textarea data-k="${s.id}" data-t="${tc(s.start)}" placeholder="Góp ý cho cảnh ${s.id}…"></textarea></div>`).join('\n')}
</main><script>
const K=${JSON.stringify(key)};const T=[...document.querySelectorAll('textarea')];
try{const v=JSON.parse(localStorage.getItem(K)||'{}');T.forEach(t=>t.value=v[t.dataset.k]||'')}catch(e){}
T.forEach(t=>t.oninput=()=>{try{localStorage.setItem(K,JSON.stringify(Object.fromEntries(T.map(x=>[x.dataset.k,x.value]))))}catch(e){}});
document.getElementById('copy').onclick=async()=>{const L=[${JSON.stringify('Góp ý — ' + p.name)}];for(const t of T){const v=t.value.trim();if(!v)continue;L.push(t.dataset.k==='_all'?'Chung: '+v:t.dataset.k+' ('+t.dataset.t+'): '+v)}
const txt=L.length>1?L.join('\\n'):'(chưa có góp ý)';try{await navigator.clipboard.writeText(txt)}catch(e){const a=document.createElement('textarea');a.value=txt;document.body.append(a);a.select();document.execCommand('copy');a.remove()}
document.getElementById('msg').textContent='Đã sao chép '+(L.length-1)+' góp ý ✓'};
</script></body></html>`;
};

export const buildReview = async (dir, {onLog = () => {}} = {}) => {
  const p = readProject(dir); const ratios = p.formats;
  const d = new Date(); const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  const outDir = path.join(dir, 'out', 'review', stamp); fs.mkdirSync(outDir, {recursive: true});
  const items = await sceneStills(dir, {ratios, outDir: path.join(outDir, 'stills'), scale: 0.5, onLog: (m, f) => onLog(m, f * 0.85)});
  onLog('Ghép trang duyệt…', 0.88);
  const html = path.join(outDir, 'review.html'); fs.writeFileSync(html, reviewHtml(p, items, ratios));
  const sheets = [];
  for (const r of ratios) {
    const its = items.filter((x) => x.ratio === r); const sh = path.join(outDir, `_sheet_${r.replace(':', 'x')}.html`);
    fs.writeFileSync(sh, sheetHtml(p, r, its, (f) => path.relative(outDir, f).replace(/\\/g, '/')));
    const jpg = path.join(outDir, `contact_${r.replace(':', 'x')}.jpg`);
    try { onLog('Contact sheet ' + r, 0.92); await screenshotHtml(sh, jpg); sheets.push(jpg); } catch (e) { onLog('Bỏ qua contact sheet ' + r + ': ' + e.message); }
    fs.rmSync(sh, {force: true});
  }
  return {outDir, html, sheets, scenes: p.scenes.length, ratios, sizeMB: +(fs.statSync(html).size / 1e6).toFixed(1)};
};

// ── compare two versions (snapshot ids or 'current') ──
export const CMP_ROOT = path.join(DATA, 'compare');
const cleanOld = () => { if (!fs.existsSync(CMP_ROOT)) return; for (const e of fs.readdirSync(CMP_ROOT)) { const p = path.join(CMP_ROOT, e); try { if (Date.now() - fs.statSync(p).mtimeMs > 864e5) fs.rmSync(p, {recursive: true, force: true}); } catch {} } };
export const compareSnapshots = async (dir, a, b = 'current', {ratio, onLog = () => {}} = {}) => {
  cleanOld();
  const key = crypto.createHash('sha1').update(path.resolve(dir).toLowerCase()).digest('hex').slice(0, 10);
  const root = path.join(CMP_ROOT, key); fs.mkdirSync(root, {recursive: true}); fs.utimesSync(root, new Date(), new Date());
  const side = async (id, n) => {
    if (id === 'current') return {dir, label: 'Hiện tại', id};
    const m = await getSnap(dir, id); const d = path.join(root, 'v_' + id);
    if (!fs.existsSync(path.join(d, 'project.json'))) { onLog(`Dựng lại phiên bản ${n}…`); await materialize(dir, id, d); }
    return {dir: d, label: m.label || new Date(m.time).toLocaleString('vi-VN'), id, time: m.time};
  };
  const A = await side(a, 'A'), B = await side(b, 'B');
  const pa = readProject(A.dir), pb = readProject(B.dir);
  ratio = ratio || pb.formats[0];
  const run = async (S, tag, f0) => sceneStills(S.dir, {ratios: [ratio], outDir: path.join(root, 'shots_' + tag + '_' + S.id), scale: 0.3, quality: 78, onLog: (m, f) => onLog(`${tag}: ${m}`, f0 + (f || 0) * 0.5)});
  const sa = await run(A, 'A', 0), sb = await run(B, 'B', 0.5);
  const ids = [...new Set([...pa.scenes.map((s) => s.id), ...pb.scenes.map((s) => s.id)])];
  const url = (f) => f ? '/cmp/' + path.relative(CMP_ROOT, f).replace(/\\/g, '/') : null;
  const scenes = ids.map((id) => { const x = sa.find((s) => s.scene === id), y = sb.find((s) => s.scene === id); return {id, label: (y || x).label, a: url(x?.file), b: url(y?.file), same: !!(x && y && looksSame(x.file, y.file))}; });
  return {ratio, a: {id: A.id, label: A.label, time: A.time}, b: {id: B.id, label: B.label, time: B.time}, scenes, changed: scenes.filter((s) => !s.same).length};
};
