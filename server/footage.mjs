// Footage (v0.9): real video clips on their own layer above the scenes — main (talking head, full frame), B-roll (short
// full-frame inserts), PiP (small framed window), screen (screen recording inside a phone / laptop frame).
//   <project>/media/<file>                    originals (NEVER in public/: renderBundle copies public/ into every bundle)
//   <project>/media/<name>.cfr30.mp4          constant-frame-rate copy of a VFR screen recording (the clip uses this one)
//   <project>/media/.cache/proxy/<file>.mp4   540p proxy (GOP 15, AAC) for the live preview
//   <project>/media/.cache/thumb/<file>.jpg   poster frame
//   <project>/media/.cache/info.json          probe results
// project.json → tracks.video[] = {id, src, in, out, at, speed, role, fit, pip{x,y,w,r}, mask, volume, duck, fadeIn, fadeOut, z, label}
// Preview reads /pm/<project>/proxy/<src>; exports / stills read the originals through a tiny local HTTP server (serveMedia).
import fs from 'fs';
import path from 'path';
import http from 'http';
import {ffAsync, fprobeAsync, capsReady} from './ffmpeg.mjs';

export const MEDIA_RE = /\.(mp4|mov|m4v|webm|mkv|avi|mts)$/i;
export const ROLES = {main: 'Chính (phủ khung)', broll: 'B-roll (chèn ngắn)', pip: 'PiP (khung nhỏ)', screen: 'Màn hình (trong điện thoại / laptop)'};
export const MASKS = ['none', 'rounded', 'circle', 'phone', 'laptop'];
const cacheOf = (dir, ...p) => { const d = path.join(dir, 'media', '.cache', ...p); fs.mkdirSync(d, {recursive: true}); return d; };
export const proxyPath = (dir, rel) => path.join(dir, 'media', '.cache', 'proxy', rel.replace(/^media\//, '').replace(/[\\/]/g, '__') + '.mp4');
export const thumbPath = (dir, rel) => path.join(dir, 'media', '.cache', 'thumb', rel.replace(/^media\//, '').replace(/[\\/]/g, '__') + '.jpg');
const infoFile = (dir) => path.join(dir, 'media', '.cache', 'info.json');
const readInfo = (dir) => { try { return JSON.parse(fs.readFileSync(infoFile(dir), 'utf8')); } catch { return {}; } };
const writeInfo = (dir, I) => { cacheOf(dir); fs.writeFileSync(infoFile(dir), JSON.stringify(I, null, 1)); };
const safeName = (n) => path.basename(String(n || 'clip')).replace(/[^\p{L}\p{N}._-]+/gu, '_').slice(0, 120);

// ── timing helpers (shared idea with engine/src/core/VideoTrack.tsx) ─────────────────────
export const clipLen = (c) => Math.max(0, ((+c.out || 0) - (+c.in || 0)) / (+c.speed || 1)); // seconds on the timeline
export const clipEnd = (c) => (+c.at || 0) + clipLen(c);
export const footageEnd = (p) => Math.max(0, ...((p.tracks?.video || []).map(clipEnd)));
export const DEFAULTS = {
  main: {fit: 'cover', mask: 'none', volume: 0, duck: true, fadeIn: 0, fadeOut: 0, z: 0},
  screen: {fit: 'contain', mask: 'phone', volume: 0, duck: true, fadeIn: .25, fadeOut: .25, z: 5, pip: {x: .5, y: .5, w: .42}},
  broll: {fit: 'cover', mask: 'none', volume: null, duck: false, fadeIn: .2, fadeOut: .2, z: 10},
  pip: {fit: 'cover', mask: 'rounded', volume: 0, duck: true, fadeIn: .3, fadeOut: .3, z: 20, pip: {x: .78, y: .72, w: .32, r: .08}},
};

// ── probe ──────────────────────────────────────────────────────────────
const frac = (s) => { const [a, b] = String(s || '0/1').split('/').map(Number); return b ? a / b : a || 0; };
export const probe = async (file) => {
  const r = await fprobeAsync(['-v', 'error', '-show_entries', 'format=duration:stream=index,codec_type,codec_name,width,height,r_frame_rate,avg_frame_rate,nb_frames:stream_tags=rotate:stream_side_data=rotation', '-of', 'json', file]);
  let j = {}; try { j = JSON.parse(r.stdout); } catch { throw new Error('Không đọc được video: ' + path.basename(file) + ' ' + r.stderr.slice(0, 200)); }
  const v = (j.streams || []).find((s) => s.codec_type === 'video'); const a = (j.streams || []).find((s) => s.codec_type === 'audio');
  if (!v) throw new Error('File không có hình: ' + path.basename(file));
  const rate = frac(v.r_frame_rate), avg = frac(v.avg_frame_rate);
  const rot = Math.abs(+(v.tags?.rotate || v.side_data_list?.find((d) => d.rotation != null)?.rotation || 0)) % 180 === 90;
  // VFR: header rates disagree, or the frame spacing of the first 20 s varies (screen recorders often keep the header at 30/60)
  let vfr = !!(rate && avg && Math.abs(rate - avg) / rate > 0.01);
  if (!vfr) {
    const q = await fprobeAsync(['-v', 'error', '-select_streams', 'v:0', '-read_intervals', '%+20', '-show_entries', 'packet=pts_time', '-of', 'csv=p=0', file]);
    const t = String(q.stdout).split(/\s+/).map(parseFloat).filter(Number.isFinite).sort((x, y) => x - y);
    const d = t.slice(1).map((x, i) => x - t[i]).filter((x) => x > 1e-4);
    if (d.length > 10) { const mn = Math.min(...d), mx = Math.max(...d); vfr = mx / mn > 1.6; }
  }
  return {duration: +(+j.format?.duration || 0).toFixed(3), w: rot ? v.height : v.width, h: rot ? v.width : v.height, fps: +(avg || rate).toFixed(3),
    vfr, codec: v.codec_name, audio: !!a, audioCodec: a?.codec_name || null};
};

// ── prepare: probe → (VFR → CFR 30) → proxy 540p → poster ───────────────────────────────
let queue = Promise.resolve(); // one transcode at a time (NVENC on consumer cards has few sessions)
const encArgs = async (quality) => {
  const caps = await capsReady(); const nv = !!caps?.full?.nvenc;
  return nv ? ['-c:v', 'h264_nvenc', '-preset', 'p4', '-rc', 'vbr', '-cq', String(quality.cq), '-b:v', '0']
    : ['-c:v', 'libx264', '-preset', quality.preset, '-crf', String(quality.crf)];
};
const encode = async (args, label) => { const r = await ffAsync(['-hide_banner', '-v', 'error', '-y', ...args]); if (r.code !== 0) throw new Error(`${label} lỗi: ${r.stderr.slice(-500)}`); };
/** prepare one media file (rel = 'media/x.mp4') → info {…probe, src (what clips should use), proxy, thumb} */
export const prepare = (dir, rel, {onStage = () => {}} = {}) => (queue = queue.catch(() => {}).then(async () => {
  const f = path.join(dir, rel); if (!fs.existsSync(f)) throw new Error('Không thấy ' + rel);
  onStage('Đọc thông tin'); let info = await probe(f); let src = rel;
  if (info.vfr) { // screen recordings: variable frame rate drifts against the 30 fps timeline → constant 30 fps copy
    const cfr = rel.replace(/\.[^.]+$/, '') + '.cfr30.mp4';
    onStage('Chuyển tốc độ khung cố định 30 (bản ghi màn hình)');
    await encode(['-i', f, '-vf', 'fps=30,format=yuv420p', '-fps_mode', 'cfr', ...(await encArgs({cq: 19, crf: 17, preset: 'medium'})), '-g', '30', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', path.join(dir, cfr)], 'CFR');
    info = {...(await probe(path.join(dir, cfr))), orig: rel, vfrOrig: true}; src = cfr;
  }
  const px = proxyPath(dir, src); fs.mkdirSync(path.dirname(px), {recursive: true});
  onStage('Tạo bản xem trước 540p');
  const scale = info.w >= info.h ? 'scale=-2:540' : 'scale=540:-2';
  await encode(['-i', path.join(dir, src), '-vf', `${scale},format=yuv420p`, ...(await encArgs({cq: 28, crf: 26, preset: 'veryfast'})), '-g', '15', '-keyint_min', '15', ...(info.audio ? ['-c:a', 'aac', '-b:a', '128k'] : ['-an']), '-movflags', '+faststart', px], 'Proxy');
  const th = thumbPath(dir, src); fs.mkdirSync(path.dirname(th), {recursive: true});
  await encode(['-ss', String(Math.min(1, info.duration / 3)), '-i', path.join(dir, src), '-frames:v', '1', '-vf', 'scale=320:-2', '-q:v', '4', th], 'Ảnh đại diện');
  const I = readInfo(dir); I[src] = {...info, src, proxy: path.relative(dir, px).replace(/\\/g, '/'), thumb: path.relative(dir, th).replace(/\\/g, '/'), prepared: new Date().toISOString()};
  if (src !== rel) I[rel] = {...I[src], hidden: true};
  writeInfo(dir, I); onStage('Xong');
  return I[src];
}));

/** all footage of a project: [{src, name, duration, w, h, fps, audio, proxy?, thumb?, ready}] */
export const listMedia = (dir) => {
  const root = path.join(dir, 'media'); if (!fs.existsSync(root)) return [];
  const I = readInfo(dir); const out = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, {withFileTypes: true})) { if (e.name.startsWith('.')) continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (MEDIA_RE.test(e.name)) {
    const rel = path.relative(dir, p).replace(/\\/g, '/'); const i = I[rel];
    if (i?.hidden) continue; if (/\.cfr30\.mp4$/i.test(rel) && !i) continue;
    out.push({src: rel, name: e.name, bytes: fs.statSync(p).size, ...(i || {}), ready: !!(i && fs.existsSync(path.join(dir, i.proxy || '')))});
  } } };
  walk(root);
  return out.sort((a, b) => a.src.localeCompare(b.src));
};

/** stream an upload (raw body) into media/<name> without buffering it in memory → 'media/<name>' */
export const receive = (dir, req, name) => new Promise((ok, bad) => {
  let base = safeName(name); if (!MEDIA_RE.test(base)) return bad(new Error('Chỉ nhận video (mp4, mov, m4v, webm, mkv, avi, mts)'));
  fs.mkdirSync(path.join(dir, 'media'), {recursive: true});
  let dst = path.join(dir, 'media', base), n = 2; while (fs.existsSync(dst)) { dst = path.join(dir, 'media', base.replace(/(\.[^.]+)$/, `-${n++}$1`)); }
  const tmp = dst + '.part'; const w = fs.createWriteStream(tmp);
  req.pipe(w); req.on('error', bad); w.on('error', bad);
  w.on('finish', () => { fs.renameSync(tmp, dst); ok(path.relative(dir, dst).replace(/\\/g, '/')); });
});
/** move a file already in the project (e.g. a stock clip in public/video/…) into media/<sub>/ → 'media/…' */
export const adopt = (dir, rel, sub = 'broll') => {
  const src = path.join(dir, rel); if (!fs.existsSync(src)) throw new Error('Không thấy ' + rel);
  const dst = path.join(dir, 'media', sub, path.basename(src)); fs.mkdirSync(path.dirname(dst), {recursive: true});
  fs.renameSync(src, dst); if (fs.existsSync(src + '.meta.json')) fs.renameSync(src + '.meta.json', dst + '.meta.json');
  return path.relative(dir, dst).replace(/\\/g, '/');
};

/** new clip on the timeline with role defaults; at/in/out in seconds */
export const newClip = (p, {src, role = 'main', at = 0, in: tin = 0, out, info = {}}) => {
  const d = DEFAULTS[role] || DEFAULTS.main; const dur = +(info.duration || out || 5);
  const ids = new Set((p.tracks?.video || []).map((c) => c.id)); let k = 1, cid; do { cid = 'V' + String(k++).padStart(2, '0'); } while (ids.has(cid));
  const len = role === 'broll' ? Math.min(3, dur) : dur;
  return {id: cid, label: path.basename(src).replace(/\.[^.]+$/, ''), src, role, at: +(+at).toFixed(3), in: +tin, out: +(out ?? Math.min(dur, tin + len)).toFixed(3), speed: 1, ...JSON.parse(JSON.stringify(d))};
};

// ── tiny static server for exports / stills (originals over HTTP, Range support) ─────────
export const serveMedia = (dir) => new Promise((ok, bad) => {
  const root = path.resolve(dir);
  const srv = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '');
    const f = path.resolve(root, rel);
    if (!f.startsWith(root + path.sep) || !/^(media|public)[\\/]/.test(path.relative(root, f)) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); return res.end(); }
    const st = fs.statSync(f); const type = /\.webm$/i.test(f) ? 'video/webm' : /\.mov$/i.test(f) ? 'video/quicktime' : 'video/mp4';
    const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (m) { const s = m[1] === '' ? Math.max(0, st.size - +m[2]) : +m[1]; const e = m[1] !== '' && m[2] ? Math.min(+m[2], st.size - 1) : st.size - 1;
      res.writeHead(206, {'Content-Type': type, 'Content-Range': `bytes ${s}-${e}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': e - s + 1}); return fs.createReadStream(f, {start: s, end: e}).pipe(res); }
    res.writeHead(200, {'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes'}); fs.createReadStream(f).pipe(res);
  });
  srv.on('error', bad);
  srv.listen(0, '127.0.0.1', () => ok({url: `http://127.0.0.1:${srv.address().port}/`, close: () => new Promise((r) => srv.close(() => r()))}));
});
/** does this project need footage served during a render? */
export const hasFootage = (p) => !!(p.tracks?.video || []).length;
