// Locate ffmpeg/ffprobe: $FFMPEG → Remotion's bundled binary (node_modules/@remotion/compositor-*) → PATH.
import fs from 'fs';
import path from 'path';
import {spawnSync} from 'child_process';
import {NODE_MODULES} from './paths.mjs';
const exe = process.platform === 'win32' ? '.exe' : '';
const bundled = (name) => {
  const d = path.join(NODE_MODULES, '@remotion');
  if (!fs.existsSync(d)) return null;
  for (const e of fs.readdirSync(d)) if (e.startsWith('compositor-')) { const p = path.join(d, e, name + exe); if (fs.existsSync(p)) return p; }
  return null;
};
const onPath = (name) => spawnSync(name, ['-version'], {shell: false}).status === 0 ? name : null;
export const FFMPEG = process.env.FFMPEG || bundled('ffmpeg') || onPath('ffmpeg');
export const FFPROBE = process.env.FFPROBE || bundled('ffprobe') || onPath('ffprobe');
const envFor = (bin) => ({...process.env, LD_LIBRARY_PATH: [path.dirname(bin || ''), process.env.LD_LIBRARY_PATH || ''].join(':')});
export const ff = (args, opts = {}) => spawnSync(FFMPEG, args, {maxBuffer: 1 << 30, env: envFor(FFMPEG), ...opts});
export const fprobe = (args, opts = {}) => spawnSync(FFPROBE, args, {maxBuffer: 1 << 26, env: envFor(FFPROBE), ...opts});
export const duration = (file) => { const r = fprobe(['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]); return parseFloat(String(r.stdout)); };

let _gpu;
// NOTE: Remotion's bundled ffmpeg has no "color"/"testsrc" filter — use nullsrc (the old test always failed → GPU never used)
const probeEnc = (enc) => {
  const r = ff(['-hide_banner', '-v', 'error', '-f', 'lavfi', '-i', 'nullsrc=s=640x360:r=30:d=0.5', '-vf', 'format=yuv420p', '-c:v', enc, '-f', 'null', '-'], {windowsHide: true, timeout: 20000});
  const err = String(r.stderr || '').trim();
  return {ok: r.status === 0 && !/Error|error|failed/i.test(err), err: err.slice(0, 1500)};
};
/** test whether NVENC / QSV / AMF encoders actually work on this machine (not just compiled in) */
export const gpuEncoders = (refresh = false) => {
  if (_gpu && !refresh) return _gpu;
  _gpu = {nvenc: probeEnc('h264_nvenc').ok, hevc_nvenc: probeEnc('hevc_nvenc').ok, qsv: false, amf: false};
  return _gpu;
};
/** full diagnosis for the "Chẩn đoán GPU" button */
export const gpuDiagnose = () => {
  const version = String(ff(['-hide_banner', '-version'], {windowsHide: true}).stdout || '').split('\n')[0];
  const encList = String(ff(['-hide_banner', '-encoders'], {windowsHide: true}).stdout || '');
  const compiled = ['h264_nvenc', 'hevc_nvenc'].filter((e) => encList.includes(e));
  const tests = {h264_nvenc: probeEnc('h264_nvenc'), hevc_nvenc: probeEnc('hevc_nvenc'), libx264: probeEnc('libx264')};
  let smi = null;
  for (const cmd of ['nvidia-smi', process.platform === 'win32' ? 'C:\\Windows\\System32\\nvidia-smi.exe' : null].filter(Boolean)) {
    const r = spawnSync(cmd, ['--query-gpu=name,driver_version,memory.total,utilization.gpu', '--format=csv,noheader'], {encoding: 'utf8', windowsHide: true, timeout: 8000});
    if (r.status === 0) { smi = r.stdout.trim(); break; }
  }
  _gpu = {nvenc: tests.h264_nvenc.ok, hevc_nvenc: tests.hevc_nvenc.ok, qsv: false, amf: false};
  let advice;
  if (_gpu.nvenc) advice = 'NVENC hoạt động ✓ — chọn MP4 H.264/H.265 + Tăng tốc GPU "Tự động". (ProRes luôn mã hoá bằng CPU.)';
  else if (!smi) advice = 'Không tìm thấy card NVIDIA / driver (nvidia-smi). Cài driver NVIDIA mới nhất (Game Ready hoặc Studio) rồi khởi động lại máy. Laptop: kiểm tra đang cắm sạc và không bật chế độ chỉ dùng GPU Intel.';
  else if (!compiled.length) advice = 'Bản ffmpeg đi kèm không có NVENC. Cài ffmpeg bản đầy đủ (gyan.dev "full") và đặt biến môi trường FFMPEG trỏ tới ffmpeg.exe.';
  else if (/Cannot load (nvcuda|libcuda)/i.test(tests.h264_nvenc.err)) advice = 'Máy không nạp được thư viện CUDA của NVIDIA → cài lại driver NVIDIA mới nhất (chọn Clean install) rồi khởi động lại máy.';
  else if (/driver|API version|minimum required/i.test(tests.h264_nvenc.err)) advice = 'Driver NVIDIA quá cũ so với ffmpeg 7.1 → cập nhật driver mới nhất rồi bấm "Kiểm tra lại".';
  else if (/No capable devices|OpenEncodeSessionEx|incompatible/i.test(tests.h264_nvenc.err)) advice = 'Card không hỗ trợ NVENC (một số GTX đời cũ / MX không có) hoặc đang bị app khác chiếm hết phiên mã hoá (OBS, trình ghi màn hình). Tắt các app đó rồi thử lại.';
  else advice = 'NVENC chưa chạy — xem thông báo lỗi bên dưới, gửi cho Claude nếu cần.';
  return {ffmpeg: FFMPEG, version, compiled, tests, gpu: smi, advice, platform: process.platform};
};
