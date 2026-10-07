// Chuyển dự án cũ sang cách lưu 0.6 — KHÔNG đổi nội dung video, chỉ bỏ bản chép trùng.
//   node tools/migrate.mjs                    → chạy thử mọi dự án trong projects/ (+ dự án gần đây ở nơi khác)
//   node tools/migrate.mjs --apply            → làm thật (chụp điểm neo .history cho từng dự án trước khi động vào)
//   node tools/migrate.mjs --project <thư mục>  → chỉ một dự án
// Việc làm:
//   1. public/_engine (bản chép 5,5 MB/dự án) → hardlink tới engine/public (0 byte thêm)
//   2. media giống hệt nhau giữa các dự án (cùng sha1) → hardlink về một bản; trùng với SAMI_Library → hardlink về thư viện
//   3. .claude/skills chép trong dự án (bản cũ, có đường dẫn D:\) → xoá; skill dùng bản chung ~/.claude/skills
//   4. Báo cáo: helper .tsx chép trùng giữa dự án (ứng viên đưa vào lib/remotion), đường dẫn D:\ còn sót
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {ROOT, DATA, DEFAULT_PROJECTS, ENGINE} from '../server/paths.mjs';
import {linkOrCopy, linkTree} from '../server/fslink.mjs';
import {ASSETS} from '../server/library.mjs';
import * as history from '../server/history.mjs';

const APPLY = process.argv.includes('--apply');
const pi = process.argv.indexOf('--project');
const only = pi > 0 ? path.resolve(process.argv[pi + 1]) : null;
const mb = (n) => (n / 1e6).toFixed(1) + ' MB';
const sha1 = (f) => crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex');
const walk = (d, skip = () => false) => { const out = []; const w = (q) => { if (!fs.existsSync(q)) return; for (const e of fs.readdirSync(q, {withFileTypes: true})) { if (skip(e.name)) continue; const p = path.join(q, e.name); if (e.isDirectory()) w(p); else out.push(p); } }; w(d); return out; };
const ino = (f) => { try { const s = fs.statSync(f); return `${s.dev}:${s.ino}`; } catch { return null; } };

// projects: projects/ + recent list (other folders)
let dirs = [];
if (only) dirs = [only];
else {
  for (const e of fs.existsSync(DEFAULT_PROJECTS) ? fs.readdirSync(DEFAULT_PROJECTS) : []) if (fs.existsSync(path.join(DEFAULT_PROJECTS, e, 'project.json'))) dirs.push(path.join(DEFAULT_PROJECTS, e));
  // recent projects elsewhere — only on the app's drive (hardlinks can't cross drives; old D:\ copies are retired)
  const drive = (p) => path.parse(path.resolve(p)).root.toLowerCase();
  try { for (const r of JSON.parse(fs.readFileSync(path.join(DATA, 'settings.json'), 'utf8')).recent || []) if (drive(r.dir) === drive(ROOT) && fs.existsSync(path.join(r.dir, 'project.json')) && !dirs.some((d) => d.toLowerCase() === path.resolve(r.dir).toLowerCase())) dirs.push(path.resolve(r.dir)); } catch {}
}
console.log(`${APPLY ? 'CHUYỂN' : 'CHẠY THỬ'} ${dirs.length} dự án\n`);

let saved = 0;
// 1 · _engine → hardlinks
const engFiles = walk(path.join(ENGINE, 'public'));
const engBytes = engFiles.reduce((s, f) => s + fs.statSync(f).size, 0);
let engCount = 0;
for (const d of dirs) {
  const e = path.join(d, 'public', '_engine'); if (!fs.existsSync(e)) continue;
  const linked = engFiles.every((f) => ino(f) === ino(path.join(e, path.relative(path.join(ENGINE, 'public'), f))));
  if (linked) continue;
  engCount++; saved += engBytes;
}
console.log(`1 · public/_engine chép riêng: ${engCount} dự án → hardlink (tiết kiệm ~${mb(engCount * engBytes)})`);

// 2 · duplicate media across projects (+ library)
const groups = new Map(); // sha1 → [files]
const SKIP = (n) => ['_engine', '_lib', '_hf', 'node_modules', '.history', 'out'].includes(n);
for (const d of dirs) for (const f of walk(path.join(d, 'public'), SKIP)) {
  const st = fs.statSync(f); if (st.size < 20000) continue;
  const k = st.size + ':' + sha1(f); (groups.get(k) || groups.set(k, []).get(k)).push(f);
}
const libBy = new Map(); for (const f of walk(ASSETS).filter((x) => !x.endsWith('.meta.json'))) { const st = fs.statSync(f); libBy.set(st.size + ':' + sha1(f), f); }
let dupBytes = 0, dupFiles = 0; const dupPlan = [];
for (const [k, files] of groups) {
  const lib = libBy.get(k);
  const master = lib || files[0];
  const todo = files.filter((f) => f !== master && ino(f) !== ino(master));
  if (!todo.length) continue;
  const size = +k.split(':')[0];
  dupBytes += size * (lib ? todo.length : todo.length); dupFiles += todo.length; dupPlan.push({master, todo});
}
saved += dupBytes;
console.log(`2 · media trùng: ${dupFiles} file → hardlink (tiết kiệm ~${mb(dupBytes)})`);
for (const g of dupPlan.slice(0, 6)) console.log(`      ${path.basename(g.master)} × ${g.todo.length + 1}${g.master.startsWith(ASSETS) ? ' (khớp thư viện)' : ''}`);
if (dupPlan.length > 6) console.log(`      … ${dupPlan.length - 6} nhóm nữa`);

// 3 · stale skill copies
const staleSkills = dirs.map((d) => path.join(d, '.claude', 'skills')).filter((p) => fs.existsSync(p));
console.log(`3 · .claude/skills chép trong dự án: ${staleSkills.length} → xoá (dùng skill chung ~/.claude/skills)`);

// 4 · reports
const tsx = new Map();
for (const d of dirs) for (const f of walk(path.join(d, 'scenes')).filter((x) => /\.tsx?$/.test(x) && !/[\\/](S|T|H)\d+\w*\.tsx$|index\.ts$/.test(x))) {
  const k = sha1(f); (tsx.get(k) || tsx.set(k, []).get(k)).push(f);
}
const dupTsx = [...tsx.values()].filter((l) => l.length > 1).sort((a, b) => b.length - a.length);
console.log(`4 · helper .tsx giống hệt nhau giữa dự án: ${dupTsx.length} nhóm (ứng viên đưa vào lib/remotion, import @lib/…)`);
for (const l of dupTsx.slice(0, 8)) console.log(`      ${path.basename(l[0])} × ${l.length}: ${l.map((f) => path.basename(path.dirname(path.dirname(f)))).slice(0, 3).join(', ')}${l.length > 3 ? '…' : ''}`);
const dPaths = [];
for (const d of dirs) for (const f of [path.join(d, 'CLAUDE.md'), ...walk(path.join(d, 'tools')).filter((x) => /\.(m?js|py|md)$/.test(x))]) {
  if (fs.existsSync(f) && /[^a-z]D:[\\/]+Downloads/i.test(fs.readFileSync(f, 'utf8'))) dPaths.push(f);
}
console.log(`   đường dẫn D:\\Downloads còn sót: ${dPaths.length} file${dPaths.length ? ' → ' + dPaths.slice(0, 4).map((f) => path.relative(path.dirname(path.dirname(f)), f)).join(', ') : ''}`);

console.log(`\nTổng tiết kiệm ước tính: ${mb(saved)}`);
if (!APPLY) { console.log('Chạy thử — thêm --apply để làm thật.'); process.exit(0); }

// ── apply ──
for (const d of dirs) {
  try { await history.snapshot(d, {kind: 'manual', label: 'Trước khi chuyển sang Studio 0.6', source: 'tools/migrate.mjs', force: true}); }
  catch (e) { console.log('  ⚠ không chụp được điểm neo', path.basename(d), e.message); }
}
for (const d of dirs) if (fs.existsSync(path.join(d, 'public', '_engine'))) linkTree(path.join(ENGINE, 'public'), path.join(d, 'public', '_engine'));
let n = 0;
for (const g of dupPlan) for (const f of g.todo) { try { const t = f + '.mig~'; fs.linkSync(g.master, t); fs.renameSync(t, f); n++; } catch (e) { console.log('  ⚠', f, e.message); } }
for (const p of staleSkills) fs.rmSync(p, {recursive: true, force: true});
console.log(`Xong: _engine hardlink · ${n} media hardlink · xoá ${staleSkills.length} bản skill cũ. Mọi dự án đã có điểm neo "Trước khi chuyển sang Studio 0.6".`);
