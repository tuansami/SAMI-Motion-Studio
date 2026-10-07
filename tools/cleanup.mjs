// Dọn bộ nhớ đệm của Studio — chỉ xoá thứ tự tạo lại được (cache, bản dựng tạm, profile Chrome bỏ quên).
//   node tools/cleanup.mjs            → chạy thử: liệt kê + tổng dung lượng sẽ giải phóng
//   node tools/cleanup.mjs --apply    → xoá thật
//   --parts   thêm: xoá đoạn render dở (out/.parts) cũ hơn 14 ngày (mất khả năng "Tiếp tục" của các lượt đó)
// KHÔNG bao giờ đụng: project.json, scenes/, hf/, public/ (trừ _hf clip cũ), brief/, out/*.mp4, .history/.
import fs from 'fs';
import os from 'os';
import path from 'path';
import {ROOT, DATA, CACHE, DEFAULT_PROJECTS} from '../server/paths.mjs';

const APPLY = process.argv.includes('--apply');
const PARTS = process.argv.includes('--parts');
const DAY = 864e5, now = Date.now();
const size = (p) => { let n = 0; const walk = (q) => { let st; try { st = fs.lstatSync(q); } catch { return; } if (st.isSymbolicLink()) return; if (st.isDirectory()) { for (const e of fs.readdirSync(q)) walk(path.join(q, e)); } else n += st.size; }; walk(p); return n; };
const age = (p) => { try { return now - fs.statSync(p).mtimeMs; } catch { return 0; } };
const gb = (n) => (n / 1e9).toFixed(2) + ' GB';
const items = [];
const seen = new Set();
const add = (p, why) => { const k = path.resolve(p).toLowerCase(); if (seen.has(k) || !fs.existsSync(p)) return; seen.add(k); items.push({p, why, bytes: size(p)}); };

// 1 · webpack cache of Remotion bundles (rebuilt automatically, first bundle after cleanup is slower)
add(path.join(ROOT, 'node_modules', '.cache', 'webpack'), 'cache webpack của Remotion (tự tạo lại)');
// 2 · 0.5 preview builds (0.6 keeps previews in the shared cache, 3 per project)
add(path.join(DATA, 'preview'), 'bản preview cũ của 0.5 (0.6 dùng .sami-cache/preview)');
// 3 · render bundles of 0.5 in %TEMP% (+ bundles.json)
const bj = path.join(DATA, 'bundles.json');
let bundles = {}; try { bundles = JSON.parse(fs.readFileSync(bj, 'utf8')); } catch {}
for (const v of new Set(Object.values(bundles))) if (!path.resolve(v).toLowerCase().startsWith(path.resolve(CACHE).toLowerCase())) add(v, 'bundle render cũ trong %TEMP%');
const tmp = os.tmpdir();
for (const e of fs.existsSync(tmp) ? fs.readdirSync(tmp) : []) {
  const p = path.join(tmp, e);
  if (/^remotion-webpack-bundle-|^remotion-v\d|^react-motion-render|^puppeteer_dev_chrome_profile-|^hyperframes-(?!extract-cache)/i.test(e) && age(p) > DAY) add(p, 'thư mục tạm Remotion/Chrome > 1 ngày trong %TEMP%');
}
// 4 · leaked Chrome profiles of the review pack
for (const e of fs.existsSync(DATA) ? fs.readdirSync(DATA) : []) if (/^chrome-shot-/.test(e)) add(path.join(DATA, e), 'profile Chrome bỏ quên (gói duyệt)');
// 5 · shared cache: tmp > 1 day, hf-stage (rebuilt per render), preview builds beyond the 3 newest per project
for (const sub of ['tmp', 'hf-stage']) { const d = path.join(CACHE, sub); for (const e of fs.existsSync(d) ? fs.readdirSync(d) : []) if (age(path.join(d, e)) > DAY) add(path.join(d, e), `.sami-cache/${sub} > 1 ngày`); }
const pv = path.join(CACHE, 'preview');
for (const proj of fs.existsSync(pv) ? fs.readdirSync(pv) : []) {
  const d = path.join(pv, proj); const builds = fs.readdirSync(d).map((b) => ({b, t: age(path.join(d, b))})).sort((a, b) => a.t - b.t);
  for (const x of builds.slice(3)) add(path.join(d, x.b), 'bản preview cũ (giữ 3 bản mới nhất)');
}
// 6 · optional: stale render parts
if (PARTS) for (const proj of fs.existsSync(DEFAULT_PROJECTS) ? fs.readdirSync(DEFAULT_PROJECTS) : []) {
  const d = path.join(DEFAULT_PROJECTS, proj, 'out', '.parts');
  for (const k of fs.existsSync(d) ? fs.readdirSync(d) : []) if (age(path.join(d, k)) > 14 * DAY) add(path.join(d, k), 'đoạn render dở > 14 ngày');
}

let total = 0; const groups = new Map(); const ALL = process.argv.includes('--all');
for (const it of items) { total += it.bytes; const g = groups.get(it.why) || groups.set(it.why, {bytes: 0, list: []}).get(it.why); g.bytes += it.bytes; g.list.push(it); }
for (const [why, g] of [...groups].sort((a, b) => b[1].bytes - a[1].bytes)) {
  console.log(`${gb(g.bytes).padStart(9)}  ${why} (${g.list.length})`);
  for (const it of g.list.sort((a, b) => b.bytes - a.bytes).slice(0, ALL ? Infinity : 3)) console.log(`           ${it.p}`);
  if (g.list.length > 3 && !ALL) console.log(`           … và ${g.list.length - 3} mục nữa (--all để xem hết)`);
}
console.log(`\nTổng: ${gb(total)} trong ${items.length} mục.`);
if (!APPLY) { console.log('Chạy thử — thêm --apply để xoá.'); process.exit(0); }
let freed = 0;
for (const it of items) { try { fs.rmSync(it.p, {recursive: true, force: true}); freed += it.bytes; } catch (e) { console.log('✗ không xoá được', it.p, e.message); } }
// bundles.json: keep only entries that still exist
for (const [k, v] of Object.entries(bundles)) if (!fs.existsSync(path.join(v, 'index.html'))) delete bundles[k];
try { fs.writeFileSync(bj, JSON.stringify(bundles)); } catch {}
console.log(`Đã giải phóng ${gb(freed)}.`);
