#!/usr/bin/env node
// Nạp ảnh thật của mẫu "SAMI Agency Intro" vào SAMI_Library (ảnh khách KHÔNG nằm trong git: repo app là public).
// Nguồn: 3 file zip trang case study trên Google Drive (draft-tuan/<case>-case/sami-case-<case>.zip) hoặc thư mục đã giải nén.
//
//   node tools/import-images.mjs <zip|thư mục> [<zip|thư mục> …] [--library "Z:\SAMI_Video\SAMI_Library"]
//
// Ảnh cần dùng lấy từ project.json → copy (giá trị "lib:img/sami-cases/<case>/<file>"), chép vào
// <library>/assets/img/sami-cases/<case>/<file>. Chạy lại an toàn (ghi đè cùng tên). Thư viện mặc định: biến SAMI_LIBRARY,
// rồi .studio/config.json → libraryRoot của Studio, rồi ../SAMI_Library cạnh thư mục app.
import fs from 'fs';
import os from 'os';
import path from 'path';
import {spawnSync} from 'child_process';
import {fileURLToPath} from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const proj = path.resolve(here, '..');
const args = process.argv.slice(2);
const li = args.indexOf('--library');
let library = li >= 0 ? args.splice(li, 2)[1] : process.env.SAMI_LIBRARY;
if (!library) {
  const app = path.resolve(proj, '..', '..');
  try { library = JSON.parse(fs.readFileSync(path.join(app, '.studio', 'config.json'), 'utf8')).libraryRoot; } catch {}
  library = library || path.join(app, '..', 'SAMI_Library');
}
if (!args.length) { console.log('Cách dùng: node tools/import-images.mjs <sami-case-84kitchen.zip> <sami-case-mizuki.zip> <sami-case-vi.zip> [--library <SAMI_Library>]'); process.exit(1); }

const p = JSON.parse(fs.readFileSync(path.join(proj, 'project.json'), 'utf8'));
const need = new Set(Object.values(p.copy || {}).map((c) => String(c.value || '')).filter((v) => v.startsWith('lib:img/sami-cases/')).map((v) => v.slice(4)));
// giải nén zip vào thư mục tạm
const roots = args.map((a) => {
  if (fs.statSync(a).isDirectory()) return a;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sami-case-'));
  // Windows: tar (bsdtar) hoặc PowerShell; macOS/Linux: unzip hoặc tar
  const tries = process.platform === 'win32'
    ? [['tar', ['-xf', a, '-C', tmp]], ['powershell', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${a}' -DestinationPath '${tmp}' -Force`]]]
    : [['unzip', ['-q', '-o', a, '-d', tmp]], ['tar', ['-xf', a, '-C', tmp]]];
  if (!tries.some(([cmd, ar]) => spawnSync(cmd, ar, {stdio: 'ignore'}).status === 0)) { console.error('Không giải nén được ' + a + ' (giải nén tay rồi đưa thư mục vào).'); process.exit(1); }
  return tmp;
});
// tìm …/sami-case-<case>/assets/img/<file>
const index = new Map();
const walk = (d) => { for (const e of fs.readdirSync(d, {withFileTypes: true})) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else { const m = f.replace(/\\/g, '/').match(/sami-case-([a-z0-9-]+)\/assets\/img\/([^/]+)$/i); if (m) index.set(`img/sami-cases/${m[1]}/${m[2]}`, f); } } };
roots.forEach(walk);
let ok = 0; const miss = [];
for (const rel of need) {
  const src = index.get(rel);
  if (!src) { miss.push(rel); continue; }
  const dst = path.join(library, 'assets', ...rel.split('/'));
  fs.mkdirSync(path.dirname(dst), {recursive: true});
  fs.copyFileSync(src, dst); ok++;
}
console.log(`Đã chép ${ok}/${need.size} ảnh vào ${path.join(library, 'assets', 'img', 'sami-cases')}`);
if (miss.length) { console.log('Thiếu (chưa có trong các nguồn đã đưa):\n  ' + miss.join('\n  ')); process.exit(2); }
