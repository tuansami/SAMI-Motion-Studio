// Music beat-grid analysis (same algorithm as the kit's tools/music-grid.mjs; idea from HyperFrames student kit, MIT).
import fs from 'fs';
import {Worker, isMainThread, parentPort, workerData} from 'worker_threads';
import {ff} from './ffmpeg.mjs';
export const analyzeMusic = (file, FPS = 30) => {
  const SR = 11025;
  // Remotion's bundled ffmpeg has no raw f32le muxer → decode to 16-bit WAV on stdout and parse it
  const r = ff(['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-c:a', 'pcm_s16le', '-f', 'wav', '-']);
  if (r.status !== 0) throw new Error('ffmpeg: ' + String(r.stderr).slice(0, 400));
  const buf = r.stdout;
  let p = 12, dataOff = 44, dataLen = buf.length - 44;
  while (p + 8 <= buf.length) { const id = buf.toString('ascii', p, p + 4); const len = buf.readUInt32LE(p + 4); if (id === 'data') { dataOff = p + 8; dataLen = Math.min(len === 0xffffffff || len === 0 ? buf.length - p - 8 : len, buf.length - p - 8); break; } p += 8 + len + (len % 2); }
  const n = Math.floor(dataLen / 2); const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = buf.readInt16LE(dataOff + i * 2) / 32768;
  const dur = x.length / SR;
  const a = Math.exp((-2 * Math.PI * 150) / SR);
  let l1 = 0, l2 = 0; const low = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) { l1 = a * l1 + (1 - a) * x[i]; l2 = a * l2 + (1 - a) * l1; low[i] = l2; }
  const HOP = 64, hopT = HOP / SR, nF = Math.floor(x.length / HOP);
  const eLow = new Float32Array(nF), eAll = new Float32Array(nF);
  for (let f = 0; f < nF; f++) { let s = 0, t = 0; for (let i = f * HOP; i < f * HOP + HOP; i++) { s += low[i] * low[i]; t += x[i] * x[i]; } eLow[f] = Math.sqrt(s / HOP); eAll[f] = Math.sqrt(t / HOP); }
  const on = new Float32Array(nF); for (let f = 2; f < nF; f++) on[f] = Math.max(0, eLow[f] - eLow[f - 2]);
  let best = {bpm: 120, v: -1};
  for (let bpm = 70; bpm <= 170; bpm += 0.05) { const lag = 60 / bpm / hopT; let v = 0; for (let f = 0; f + lag * 4 < nF; f++) v += on[f] * (on[Math.round(f + lag)] + 0.5 * on[Math.round(f + 2 * lag)]); if (v > best.v) best = {bpm, v}; }
  const bpm = Math.abs(best.bpm - Math.round(best.bpm)) < 0.35 ? Math.round(best.bpm) : +best.bpm.toFixed(2);
  const period = 60 / bpm;
  let ph = {o: 0, v: -1};
  for (let o = 0; o < period; o += 0.002) { let v = 0; for (let tt = o; tt < dur; tt += period) { const f = Math.round(tt / hopT); for (let k = -2; k <= 2; k++) v += on[f + k] || 0; } if (v > ph.v) ph = {o, v}; }
  const off = +ph.o.toFixed(3);
  const beats = [];
  for (let n = 0; off + n * period < dur; n++) {
    const s = Math.round((off + n * period) / hopT), e = Math.min(nF, Math.round((off + (n + 1) * period) / hopT));
    let L = 0, A = 0; for (let f = s; f < e; f++) { L += eLow[f]; A += eAll[f]; }
    const w = Math.round(0.04 / hopT); let k = 0; for (let f = s - w; f <= s + w; f++) k = Math.max(k, on[f] || 0);
    beats.push({n, t: off + n * period, low: L / Math.max(1, e - s), all: A / Math.max(1, e - s), kick: k});
  }
  const maxA = Math.max(...beats.map((b) => b.all));
  const med = (arr) => { const s = [...arr].sort((p, q) => p - q); return s[Math.floor(s.length / 2)] || 0; };
  const grooveKick = med(beats.filter((b) => b.all > 0.3 * maxA).map((b) => b.kick));
  const weak = (n) => beats[n].kick < 0.55 * grooveKick;
  let lastLoud = beats.length - 1; while (lastLoud > 0 && beats[lastLoud].all < 0.08 * maxA) lastLoud--;
  const runs = []; let r0 = -1;
  for (let n = 0; n <= lastLoud; n++) { const q = weak(n); if (q && r0 < 0) r0 = n; if ((!q || n === lastLoud) && r0 >= 0) { if (n - r0 >= 2) runs.push([r0, n]); r0 = -1; } }
  let finalHit = lastLoud; while (finalHit > 0 && weak(finalHit)) finalHit--;
  const inner = runs.filter(([, e]) => e <= finalHit);
  const at = (n) => ({beat: n, t: +(off + n * period).toFixed(3), frame: Math.round((off + n * period) * FPS)});
  const bars = [];
  for (let b = 0; b * 4 < beats.length; b++) { const seg = beats.slice(b * 4, b * 4 + 4); bars.push({bar: b, t: +(off + b * 4 * period).toFixed(2), energy: +(seg.reduce((s, x) => s + x.all, 0) / seg.length / maxA).toFixed(3), kick: +(seg.reduce((s, x) => s + x.kick, 0) / seg.length / (grooveKick || 1)).toFixed(2)}); }
  return {file, duration: +dur.toFixed(3), bpm, offset: off, beatFrames: +(period * FPS).toFixed(3),
    drops: inner.filter(([s, e]) => e - s >= 4).map(([, e]) => at(e)), breaks: inner.filter(([s, e]) => e - s < 4).map(([s, e]) => ({from: at(s), to: at(e)})),
    finalHit: at(finalHit), quietAt: +(off + (lastLoud + 1) * period).toFixed(2), bars};
};

/** 1.0: same analysis in a worker thread (decode + BPM sweep take seconds → never block the Studio server); cached by file + mtime */
const cache = new Map();
export const analyzeMusicAsync = (file, FPS = 30) => {
  let key; try { const st = fs.statSync(file); key = file + '|' + st.mtimeMs + '|' + st.size + '|' + FPS; } catch { key = null; }
  if (key && cache.has(key)) return Promise.resolve(cache.get(key));
  return new Promise((ok, bad) => {
    const w = new Worker(new URL(import.meta.url), {workerData: {file, FPS}});
    w.once('message', (m) => { if (m.error) return bad(new Error(m.error)); if (key) { cache.set(key, m.result); if (cache.size > 50) cache.delete(cache.keys().next().value); } ok(m.result); });
    w.once('error', bad); w.once('exit', (c) => { if (c) bad(new Error('Phân tích nhạc dừng (mã ' + c + ')')); });
  });
};
if (!isMainThread && workerData?.file) { try { parentPort.postMessage({result: analyzeMusic(workerData.file, workerData.FPS)}); } catch (e) { parentPort.postMessage({error: e.message}); } }
