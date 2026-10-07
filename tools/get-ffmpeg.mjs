// Tải ffmpeg bản đầy đủ (NVENC/QSV/AMF, libvpx, gif, prores, xfade, loudnorm…) vào vendor/ffmpeg/ — không đụng PATH hệ thống.
// Dùng: node tools/get-ffmpeg.mjs [--source btbn|gyan] [--version 8.1] [--lgpl] [--force]
// Bản shared (exe + dll, ~90 MB). Kiểm SHA-256 do GitHub công bố trước khi giải nén, rồi thử NVENC thật.
// NVENC: ffmpeg 8.1+ của gyan đòi NVENC API 13.1 = driver NVIDIA ≥ 610, mà GTX 10xx (Pascal) dừng ở nhánh 580 →
//   mặc định dùng BtbN (nv-codec-headers cũ hơn). Nếu NVENC vẫn lỗi, Studio tự dùng CPU cho bước đó.
// Giấy phép: bản GPL dùng nội bộ OK; khi đóng gói phân phối cho khách dùng --lgpl (không có x264/x265).
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {spawnSync} from 'child_process';
import {fileURLToPath} from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEST = path.join(ROOT, 'vendor', 'ffmpeg');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const SOURCE = arg('--source', 'btbn');
const VERSION = arg('--version', SOURCE === 'btbn' ? '8.1' : '8.1.2');
const LIC = process.argv.includes('--lgpl') ? 'lgpl' : 'gpl';
const FORCE = process.argv.includes('--force');
const REPO = SOURCE === 'btbn' ? 'BtbN/FFmpeg-Builds' : 'GyanD/codexffmpeg';
const TAG = SOURCE === 'btbn' ? 'latest' : VERSION;
const ASSET = SOURCE === 'btbn' ? `ffmpeg-n${VERSION}-latest-win64-${LIC}-shared-${VERSION}.zip` : `ffmpeg-${VERSION}-full_build-shared.zip`;

if (process.platform !== 'win32') { console.log('Chỉ cần trên Windows. macOS/Linux: cài ffmpeg bằng brew/apt rồi đặt FFMPEG_FULL.'); process.exit(0); }
if (fs.existsSync(path.join(DEST, 'bin', 'ffmpeg.exe')) && !FORCE) { console.log('Đã có', path.join(DEST, 'bin', 'ffmpeg.exe'), '(thêm --force để tải lại)'); process.exit(0); }

const rel = await (await fetch(`https://api.github.com/repos/${REPO}/releases/tags/${TAG}`, {headers: {'User-Agent': 'sami-motion-studio'}})).json();
const a = (rel.assets || []).find((x) => x.name === ASSET);
if (!a) { console.error('Không thấy', ASSET, 'trong release', REPO, TAG); process.exit(1); }
const want = String(a.digest || '').replace(/^sha256:/, '');
const tmp = path.join(ROOT, 'vendor', ASSET);
fs.mkdirSync(path.dirname(tmp), {recursive: true});
let buf;
if (fs.existsSync(tmp) && crypto.createHash('sha256').update(fs.readFileSync(tmp)).digest('hex') === want) buf = fs.readFileSync(tmp); // tải dở lần trước
else {
  console.log(`Tải ${ASSET} (${(a.size / 1e6).toFixed(0)} MB)…`);
  const res = await fetch(a.browser_download_url, {redirect: 'follow'});
  if (!res.ok) { console.error('Tải lỗi', res.status); process.exit(1); }
  buf = Buffer.from(await res.arrayBuffer());
}
const got = crypto.createHash('sha256').update(buf).digest('hex');
if (want && got !== want) { console.error('SHA-256 không khớp!', got, '≠', want); process.exit(1); }
fs.writeFileSync(tmp, buf);
console.log('SHA-256 ✓', got.slice(0, 16) + '…');

// giải nén bằng tar.exe có sẵn trong Windows 10+ (đọc được zip)
const work = path.join(ROOT, 'vendor', '_ffmpeg_unpack');
fs.rmSync(work, {recursive: true, force: true}); fs.mkdirSync(work, {recursive: true});
// bsdtar của Windows (System32) đọc được zip; GNU tar của Git Bash thì không → gọi đích danh, dự phòng Expand-Archive
const bsdtar = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
const r = fs.existsSync(bsdtar)
  ? spawnSync(bsdtar, ['-xf', tmp, '-C', work], {stdio: 'inherit', windowsHide: true})
  : spawnSync('powershell.exe', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${tmp}' -DestinationPath '${work}' -Force`], {stdio: 'inherit', windowsHide: true});
if (r.status !== 0) { console.error('Giải nén lỗi'); process.exit(1); }
const inner = fs.readdirSync(work).map((d) => path.join(work, d)).find((d) => fs.existsSync(path.join(d, 'bin', 'ffmpeg.exe')));
if (!inner) { console.error('Zip không có bin/ffmpeg.exe'); process.exit(1); }
fs.rmSync(DEST, {recursive: true, force: true});
// Defender quét file .exe vừa giải nén → rename có thể EPERM vài giây: thử lại rồi mới chép
for (let i = 0; ; i++) {
  try { fs.renameSync(inner, DEST); break; }
  catch (e) { if (i >= 10) { fs.cpSync(inner, DEST, {recursive: true}); break; } await new Promise((ok) => setTimeout(ok, 1000)); }
}
fs.rmSync(work, {recursive: true, force: true}); fs.rmSync(tmp, {force: true});
fs.writeFileSync(path.join(DEST, 'SOURCE.txt'), `${a.browser_download_url}\nsha256 ${got}\n${new Date().toISOString()}\n`);
const v = spawnSync(path.join(DEST, 'bin', 'ffmpeg.exe'), ['-hide_banner', '-version'], {encoding: 'utf8'});
console.log(String(v.stdout).split('\n')[0]);
const t = spawnSync(path.join(DEST, 'bin', 'ffmpeg.exe'), ['-hide_banner', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=s=640x360:r=30:d=0.5', '-c:v', 'h264_nvenc', '-f', 'null', '-'], {encoding: 'utf8'});
console.log(t.status === 0 && !/error/i.test(t.stderr) ? 'NVENC ✓' : 'NVENC ✗ (Studio sẽ mã hoá bằng CPU với bản này): ' + String(t.stderr).split(String.fromCharCode(10))[0]);
console.log('Xong →', path.join(DEST, 'bin'));
