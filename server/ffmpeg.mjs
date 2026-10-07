// Locate ffmpeg/ffprobe: $FFMPEG → vendor/ffmpeg/bin (full build: tools/get-ffmpeg.mjs) → Remotion's bundled binary → PATH.
// Remotion always encodes with ITS OWN bundled ffmpeg (pinned CLI args); the full build is used for Hyperframes, joining,
// loudness, presets, footage. Capabilities (NVENC/QSV/AMF, filters) are probed ONCE, asynchronously, and cached in
// .studio/caps.json → the Studio server never blocks on ffmpeg.
import fs from 'fs';
import path from 'path';
import {spawn, spawnSync} from 'child_process';
import {NODE_MODULES, VENDOR, DATA, ENGINE, cacheDir} from './paths.mjs';
const ENGINE_PUBLIC = path.join(ENGINE, 'public');
const exe = process.platform === 'win32' ? '.exe' : '';
const bundled = (name) => {
  const d = path.join(NODE_MODULES, '@remotion');
  if (!fs.existsSync(d)) return null;
  for (const e of fs.readdirSync(d)) if (e.startsWith('compositor-')) { const p = path.join(d, e, name + exe); if (fs.existsSync(p)) return p; }
  return null;
};
const vendored = (name) => { const p = path.join(VENDOR, 'ffmpeg', 'bin', name + exe); return fs.existsSync(p) ? p : null; };
const onPath = (name) => spawnSync(name, ['-version'], {shell: false, windowsHide: true}).status === 0 ? name : null;
export const FFMPEG = process.env.FFMPEG || vendored('ffmpeg') || bundled('ffmpeg') || onPath('ffmpeg');
export const FFPROBE = process.env.FFPROBE || vendored('ffprobe') || bundled('ffprobe') || onPath('ffprobe');
/** the binary Remotion's renderer uses (NVENC capability of THIS one decides GPU export of Remotion scenes) */
export const FFMPEG_REMOTION = bundled('ffmpeg') || FFMPEG;
export const isFullBuild = !!FFMPEG && FFMPEG !== bundled('ffmpeg');
const envFor = (bin) => ({...process.env, LD_LIBRARY_PATH: [path.dirname(bin || ''), process.env.LD_LIBRARY_PATH || ''].join(':')});
export const ff = (args, opts = {}) => spawnSync(FFMPEG, args, {maxBuffer: 1 << 30, env: envFor(FFMPEG), windowsHide: true, ...opts});
export const fprobe = (args, opts = {}) => spawnSync(FFPROBE, args, {maxBuffer: 1 << 26, env: envFor(FFPROBE), windowsHide: true, ...opts});
export const duration = (file) => { const r = fprobe(['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]); return parseFloat(String(r.stdout)); };

/** async spawn → {code, stdout, stderr} (never blocks the server) */
const run = (bin, args, {timeout = 0} = {}) => new Promise((ok) => {
  const c = spawn(bin, args, {env: envFor(bin), windowsHide: true}); let out = '', err = '', t = null;
  if (timeout) t = setTimeout(() => { try { c.kill('SIGKILL'); } catch {} }, timeout);
  c.stdout.on('data', (d) => { out = (out + d).slice(-200000); }); c.stderr.on('data', (d) => { err = (err + d).slice(-20000); });
  c.on('exit', (code) => { clearTimeout(t); ok({code, stdout: out, stderr: err}); }); c.on('error', (e) => { clearTimeout(t); ok({code: -1, stdout: '', stderr: String(e)}); });
});
export const ffAsync = (args) => run(FFMPEG, args);
export const fprobeAsync = (args) => run(FFPROBE, args);
export const durationAsync = async (file) => parseFloat((await fprobeAsync(['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file])).stdout);

// ── capabilities (cached) ──────────────────────────────────────────
// Encoder test = encode a real still (engine/public/grain0.png) into a temp mp4 — the same path Remotion uses (image frames → encoder).
// 0.5 used `-f lavfi nullsrc … -f null -`: Remotion's stripped ffmpeg has no lavfi/rawvideo/wrapped_avframe, so that
// probe ALWAYS failed and exports never used NVENC even on working GPUs.
const PROBE_IMG = path.join(ENGINE_PUBLIC, 'grain0.png');
const probeEnc = async (bin, enc) => {
  const out = path.join(cacheDir('tmp'), `probe_${enc}_${process.pid}_${Math.random().toString(36).slice(2, 8)}.mp4`);
  const r = await run(bin, ['-hide_banner', '-v', 'error', '-y', '-loop', '1', '-framerate', '30', '-i', PROBE_IMG, '-frames:v', '15', '-vf', 'scale=640:360,format=yuv420p', '-c:v', enc, '-f', 'mp4', out], {timeout: 20000});
  const err = String(r.stderr || '').trim();
  const ok = r.code === 0 && fs.existsSync(out) && fs.statSync(out).size > 0 && !/Error|failed/i.test(err);
  try { fs.rmSync(out, {force: true}); } catch {}
  return {ok, err: err.slice(0, 1500)};
};
const CAPS_FILE = path.join(DATA, 'caps.json');
const sig = (bin) => { try { const st = fs.statSync(bin); return `${bin}|${st.size}|${st.mtimeMs}`; } catch { return String(bin); } };
let _caps = (() => { try { const c = JSON.parse(fs.readFileSync(CAPS_FILE, 'utf8')); return c.sig === sig(FFMPEG) + '#' + sig(FFMPEG_REMOTION) ? c : null; } catch { return null; } })();
let _capsP = null;
export const refreshCaps = () => (_capsP = (async () => {
  // one encoder test at a time: consumer GPUs allow only a few NVENC sessions — parallel probes fail each other
  const rn = await probeEnc(FFMPEG_REMOTION, 'h264_nvenc'), rh = await probeEnc(FFMPEG_REMOTION, 'hevc_nvenc');
  const fn = FFMPEG === FFMPEG_REMOTION ? rn : await probeEnc(FFMPEG, 'h264_nvenc'), fh = FFMPEG === FFMPEG_REMOTION ? rh : await probeEnc(FFMPEG, 'hevc_nvenc');
  const fq = await probeEnc(FFMPEG, 'h264_qsv'), fa = await probeEnc(FFMPEG, 'h264_amf');
  const [ver, filters] = await Promise.all([run(FFMPEG, ['-hide_banner', '-version']), run(FFMPEG, ['-hide_banner', '-filters'])]);
  const fl = String(filters.stdout) + String(filters.stderr);
  _caps = {
    sig: sig(FFMPEG) + '#' + sig(FFMPEG_REMOTION), probed: new Date().toISOString(),
    remotion: {bin: FFMPEG_REMOTION, nvenc: rn.ok, hevc_nvenc: rh.ok, qsv: false, amf: false},
    full: {bin: FFMPEG, full: isFullBuild, version: String(ver.stdout).split(/\r?\n/)[0], nvenc: fn.ok, hevc_nvenc: fh.ok, qsv: fq.ok, amf: fa.ok,
      filters: ['loudnorm', 'xfade', 'palettegen', 'sidechaincompress', 'drawtext', 'scale_cuda', 'zscale'].filter((n) => new RegExp('\\s' + n + '\\s').test(fl))},
  };
  try { fs.mkdirSync(DATA, {recursive: true}); fs.writeFileSync(CAPS_FILE, JSON.stringify(_caps, null, 1)); } catch {}
  _filters = fl;
  return _caps;
})());
export const capsReady = () => (_caps ? Promise.resolve(_caps) : _capsP || refreshCaps());
export const caps = () => _caps;
/** NVENC that Remotion's export can use (non-blocking: false until the first probe finished) */
export const gpuEncoders = () => _caps?.remotion || {nvenc: false, hevc_nvenc: false, qsv: false, amf: false, pending: true};

/** full diagnosis for the "Chẩn đoán GPU" button (async) */
export const gpuDiagnose = async () => {
  const c = await refreshCaps();
  const version = c.full.version;
  const encList = String((await run(FFMPEG, ['-hide_banner', '-encoders'])).stdout || '');
  const compiled = ['h264_nvenc', 'hevc_nvenc', 'h264_qsv', 'h264_amf'].filter((e) => encList.includes(e));
  const tests = {h264_nvenc: await probeEnc(FFMPEG_REMOTION, 'h264_nvenc'), hevc_nvenc: await probeEnc(FFMPEG_REMOTION, 'hevc_nvenc'), libx264: await probeEnc(FFMPEG_REMOTION, 'libx264'),
    full_h264_nvenc: await probeEnc(FFMPEG, 'h264_nvenc')};
  let smi = null;
  for (const cmd of ['nvidia-smi', process.platform === 'win32' ? 'C:\\Windows\\System32\\nvidia-smi.exe' : null].filter(Boolean)) {
    const r = await run(cmd, ['--query-gpu=name,driver_version,memory.total,utilization.gpu', '--format=csv,noheader'], {timeout: 8000});
    if (r.code === 0) { smi = r.stdout.trim(); break; }
  }
  const e = tests.h264_nvenc.err + '\n' + tests.full_h264_nvenc.err;
  let advice;
  if (c.remotion.nvenc && c.full.nvenc) advice = 'NVENC hoạt động ✓ (cả Remotion lẫn ffmpeg đầy đủ) — chọn MP4 H.264/H.265 + Tăng tốc GPU "Tự động". (ProRes luôn mã hoá bằng CPU.)';
  else if (c.remotion.nvenc) advice = 'NVENC chạy cho cảnh Remotion ✓. Bản ffmpeg đầy đủ (vendor) chưa dùng được NVENC → Hyperframes/ghép dùng CPU. Thường do bản ffmpeg quá mới so với driver: chạy lại "node tools/get-ffmpeg.mjs --force" (bản BtbN).';
  else if (!smi) advice = 'Không tìm thấy card NVIDIA / driver (nvidia-smi). Cài driver NVIDIA mới nhất (Game Ready hoặc Studio) rồi khởi động lại máy. Laptop: kiểm tra đang cắm sạc và không bật chế độ chỉ dùng GPU Intel.';
  else if (!compiled.length) advice = 'Bản ffmpeg không có NVENC. Chạy "node tools/get-ffmpeg.mjs" để cài bản đầy đủ vào vendor/ffmpeg.';
  else if (/Cannot load (nvcuda|libcuda)/i.test(e)) advice = 'Máy không nạp được thư viện CUDA của NVIDIA → cài lại driver NVIDIA mới nhất (chọn Clean install) rồi khởi động lại máy.';
  else if (/driver|API version|minimum required/i.test(e)) advice = 'Driver NVIDIA quá cũ so với bản ffmpeg → cập nhật driver; card GTX 10xx dừng ở driver 580 → dùng ffmpeg BtbN 8.1 ("node tools/get-ffmpeg.mjs --force").';
  else if (/No capable devices|OpenEncodeSessionEx|incompatible/i.test(e)) advice = 'Card không hỗ trợ NVENC hoặc đang bị app khác chiếm hết phiên mã hoá (OBS, trình ghi màn hình). Tắt các app đó rồi thử lại.';
  else advice = 'NVENC chưa chạy — xem thông báo lỗi bên dưới, gửi cho Claude nếu cần.';
  return {ffmpeg: FFMPEG, remotionFfmpeg: FFMPEG_REMOTION, version, compiled, tests, gpu: smi, caps: c, advice, platform: process.platform};
};

let _filters;
export const hasFilter = (name) => { if (_filters == null) { const r = ff(['-hide_banner', '-filters']); _filters = String(r.stdout || '') + String(r.stderr || ''); } return new RegExp('\\s' + name + '\\s').test(_filters); };
const lnJson = (s) => { const m = String(s).match(/\{[^{}]*"input_i"[^{}]*\}/); return m ? JSON.parse(m[0]) : null; };
/** measure integrated loudness (LUFS) + true peak of a file */
export const measureLoudness = async (file) => {
  const r = await ffAsync(['-hide_banner', '-nostats', '-i', file, '-vn', '-af', 'loudnorm=I=-14:TP=-1:LRA=11:print_format=json', '-f', 'null', '-']);
  const j = lnJson(r.stderr); return j ? {lufs: +j.input_i, tp: +j.input_tp, lra: +j.input_lra, thresh: +j.input_thresh} : null;
};
/** two-pass EBU R128 normalisation (default −14 LUFS / −1 dBTP, the social-media target) → {from, to} or {skipped} */
export const normalizeLoudness = async (src, dst, target = -14, tp = -1) => {
  if (!hasFilter('loudnorm')) return {skipped: 'ffmpeg không có bộ lọc loudnorm'};
  const r1 = await ffAsync(['-hide_banner', '-nostats', '-i', src, '-vn', '-af', `loudnorm=I=${target}:TP=${tp}:LRA=11:print_format=json`, '-f', 'null', '-']);
  const m = lnJson(r1.stderr);
  if (!m || !isFinite(+m.input_i) || +m.input_i < -60) return {skipped: 'âm thanh gần như im lặng'};
  const af = `loudnorm=I=${target}:TP=${tp}:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true:print_format=json`;
  const r2 = await ffAsync(['-hide_banner', '-nostats', '-y', '-i', src, '-vn', '-af', af, '-ar', '48000', '-c:a', 'pcm_s16le', dst]);
  if (r2.code !== 0) throw new Error('Chuẩn âm lượng lỗi: ' + r2.stderr.slice(-600));
  const o = lnJson(r2.stderr);
  return {from: +m.input_i, to: o ? +o.output_i : target, tp: o ? +o.output_tp : null};
};
