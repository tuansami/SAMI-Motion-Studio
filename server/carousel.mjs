// Live carousel export: project.json type "carousel" → one seamless-loop MP4 per slide (1080×1350, 30 fps, own sound),
// plus QA (cover frames, loop seams, contact sheet, audio check) and a swipe preview page.
//   slides = project.json scenes (Hyperframes HTML, slides/<ID>.html), each a whole number of 120 BPM bars (4/6/8 s)
//   carousel = {series, handle, caption, theme, swipe, audio: {mode: 'groove'|'music'|'sfx'|'none', groove:{intensity,style},
//               music:{src, start, gain}, gain}}
//   scene.cues = [{t, fx:'pop'|…, gain, pan, pitch} | {t, src:'lib:sfx/…'|'audio/x.mp3', gain}]  (seconds in the slide)
import fs from 'fs';
import path from 'path';
import {spawn} from 'child_process';
import {LIB} from './paths.mjs';
import {childEnv} from './env.mjs';
import {ffAsync, fprobeAsync, capsReady, normalizeLoudness} from './ffmpeg.mjs';
import {stageDir, runHf, sceneSpan, isHf} from './hf.mjs';
import {isLib, resolveLib} from './library.mjs';
import {readProject} from './project.mjs';

export const isCarousel = (p) => p?.type === 'carousel';
const PY = process.env.SAMI_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const AUDIO_PY = path.join(LIB, 'py', 'sami_audio.py');
const W = 1080, H = 1350;

const runPy = (args, cwd) => new Promise((ok) => {
  const c = spawn(PY, [AUDIO_PY, ...args], {cwd, env: childEnv(), windowsHide: true});
  let log = ''; c.stdout.on('data', (d) => (log += d)); c.stderr.on('data', (d) => (log += d));
  c.on('exit', (code) => ok({code, log})); c.on('error', (e) => ok({code: -1, log: String(e)}));
});
const mediaPath = (dir, src) => (isLib(src) ? resolveLib(src) : path.join(dir, 'public', src));
const toWav = async (src, dst, {ss = 0, t = null} = {}) => {
  const r = await ffAsync(['-hide_banner', '-v', 'error', '-y', ...(ss ? ['-ss', String(ss)] : []), '-i', src, ...(t ? ['-t', String(t)] : []), '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', dst]);
  if (r.code !== 0) throw new Error(`Không đọc được âm thanh ${src}: ${r.stderr.slice(-300)}`);
  return dst;
};

/** per-slide seamless mix → <work>/<ID>.wav (null when audio mode is none) */
export const slideAudio = async (dir, p, s, work) => {
  const a = p.carousel?.audio || {mode: 'groove'};
  if (a.mode === 'none') return null;
  const dur = sceneSpan(p, s).dur;
  const spec = {dur, bpm: 120, wrap: true, out: `${s.id}.wav`, rms_db: -16, events: []};
  if (a.mode === 'groove' || !a.mode) spec.groove = {intensity: a.groove?.intensity ?? 0.75, style: a.groove?.style || 'house'};
  if (a.mode === 'music' && a.music?.src) {
    // the song carries on across swipes: slide n plays [start + slide.start, + dur]
    const f = mediaPath(dir, a.music.src); if (!f || !fs.existsSync(f)) throw new Error('Không thấy nhạc ' + a.music.src);
    await toWav(f, path.join(work, `${s.id}_bed.wav`), {ss: (a.music.start || 0) + s.start / 30, t: dur});
    spec.bed = {path: `${s.id}_bed.wav`, gain: a.music.gain ?? -4};
  }
  for (const [k, c] of (s.cues || []).entries()) {
    if (c.src) {
      const f = mediaPath(dir, c.src); if (!f || !fs.existsSync(f)) throw new Error(`${s.id}: không thấy SFX ${c.src}`);
      const w = await toWav(f, path.join(work, `${s.id}_cue${k}.wav`));
      spec.events.push({t: c.t, file: path.basename(w), gain: c.gain ?? -6});
    } else spec.events.push({t: c.t, fx: c.fx || 'pop', gain: c.gain ?? -6, pan: c.pan ?? 0, pitch: c.pitch ?? 1, ...(c.dur ? {dur: c.dur} : {})});
  }
  fs.writeFileSync(path.join(work, `${s.id}.json`), JSON.stringify(spec, null, 1));
  const r = await runPy(['mix', path.join(work, `${s.id}.json`)], work);
  if (r.code !== 0) throw new Error(`Âm thanh slide ${s.id} lỗi (cần Python + numpy):\n` + r.log.slice(-800));
  // same loudness on every slide (−14 LUFS / −1 dBTP, linear gain → the loop stays seamless) so swiping never jumps in volume
  const raw = path.join(work, `${s.id}.wav`), norm = path.join(work, `${s.id}_n.wav`);
  const n = await normalizeLoudness(raw, norm, p.carousel?.audio?.lufs ?? -14).catch(() => ({skipped: true}));
  return n.skipped ? raw : norm;
};

const frameAt = async (mp4, t, out, w = 360) => {
  const seek = t == null ? ['-sseof', '-0.25'] : ['-ss', Math.max(0, t).toFixed(3)];
  const r = await ffAsync(['-hide_banner', '-v', 'error', '-y', ...seek, '-i', mp4, ...(t == null ? ['-update', '1'] : ['-frames:v', '1']), '-vf', `scale=${w}:-2`, out]);
  return r.code === 0;
};
const psnr = async (a, b) => { const r = await ffAsync(['-hide_banner', '-i', a, '-i', b, '-lavfi', 'psnr', '-f', 'null', '-']); const m = String(r.stderr).match(/average:(inf|[\d.]+)/); return m ? (m[1] === 'inf' ? 99 : +m[1]) : null; };

/**
 * Render every slide (or opts.only) → {outDir, slides:[{id, mp4, dur, audio, seamPsnr}], sheet, preview}
 * onStage(msg, p) for progress; onChild(child) so the queue can kill Hyperframes.
 */
export const renderCarousel = async (dir, {only = null, gpu = true, workers = 4, onStage = () => {}, onChild, cancelled = () => false, project} = {}) => {
  dir = path.resolve(dir);
  const p = project || readProject(dir);
  if (!isCarousel(p)) throw new Error('Không phải dự án carousel (project.json → type: "carousel")');
  const slides = p.scenes.filter((s) => !only || only.includes(s.id));
  const bad = slides.filter((s) => !isHf(s)); if (bad.length) throw new Error('Slide carousel phải là HTML (Hyperframes): ' + bad.map((s) => s.id).join(', '));
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 13).replace('T', '_');
  const outDir = path.join(dir, 'out', 'carousel', stamp); const work = path.join(outDir, '.work');
  fs.mkdirSync(work, {recursive: true});
  const caps = await capsReady(); const useGpu = gpu && !!caps.full?.nvenc;
  const res = [];
  for (const [k, s] of slides.entries()) {
    if (cancelled()) break;
    const n = p.scenes.indexOf(s) + 1;
    onStage(`Slide ${n}/${p.scenes.length} · âm thanh`, k / slides.length);
    const wav = await slideAudio(dir, p, s, work);
    onStage(`Slide ${n}/${p.scenes.length} · render`, (k + 0.2) / slides.length);
    const {dir: sd} = stageDir(dir, p, s, '4:5', 30, {audio: wav});
    const mp4 = path.join(outDir, `${String(n).padStart(2, '0')}-${s.id}.mp4`);
    const args = ['render', sd, '-o', mp4, '--fps', '30', '-q', 'delivery', '-w', String(workers), '--quiet', '--format', 'mp4'];
    let r = await runHf(useGpu ? [...args, '--gpu'] : args, {onChild});
    if ((r.code !== 0 || !fs.existsSync(mp4)) && useGpu) r = await runHf(args, {onChild});
    if (r.code !== 0 || !fs.existsSync(mp4)) throw new Error(`Render slide ${s.id} lỗi:\n` + r.log.slice(-1500));
    res.push({id: s.id, n, mp4, label: s.label});
  }
  if (cancelled()) return {outDir, slides: res, cancelled: true};
  // ── QA: probe, cover (frame 0), mid, last, seam strip + PSNR(last, first)
  onStage('Kiểm tra (QA)', 0.95);
  const fr = path.join(work, 'frames'); fs.mkdirSync(fr, {recursive: true}); fs.mkdirSync(path.join(outDir, 'seams'), {recursive: true}); fs.mkdirSync(path.join(outDir, 'covers'), {recursive: true});
  for (const r of res) {
    const pr = await fprobeAsync(['-v', 'error', '-show_entries', 'stream=codec_type,width,height,nb_frames:format=duration', '-of', 'json', r.mp4]);
    const j = JSON.parse(pr.stdout || '{}');
    r.dur = +(+j.format?.duration || 0).toFixed(2); r.audio = (j.streams || []).some((x) => x.codec_type === 'audio');
    const v = (j.streams || []).find((x) => x.codec_type === 'video') || {}; r.size = `${v.width}x${v.height}`;
    const f0 = path.join(fr, `${r.id}-first.png`), fm = path.join(fr, `${r.id}-mid.png`), fl = path.join(fr, `${r.id}-last.png`);
    await frameAt(r.mp4, 0, f0); await frameAt(r.mp4, r.dur * 0.45, fm); await frameAt(r.mp4, null, fl);
    await frameAt(r.mp4, 0, path.join(outDir, 'covers', `${String(r.n).padStart(2, '0')}-${r.id}.jpg`), W);
    await ffAsync(['-hide_banner', '-v', 'error', '-y', '-i', fl, '-i', f0, '-filter_complex', '[0][1]hstack=inputs=2', '-q:v', '3', path.join(outDir, 'seams', `${r.id}.jpg`)]);
    r.seamPsnr = await psnr(fl, f0); // ≥ 25 dB ≈ the loop seam is invisible; low = a jump at the loop point
  }
  let sheet = null;
  if (res.length) {
    const ins = [...res.map((r) => path.join(fr, `${r.id}-first.png`)), ...res.map((r) => path.join(fr, `${r.id}-mid.png`))].flatMap((f) => ['-i', f]);
    const n = res.length;
    const graph = n === 1 ? '[0][1]vstack=inputs=2' : `${res.map((_, i) => `[${i}]`).join('')}hstack=inputs=${n}[t];${res.map((_, i) => `[${n + i}]`).join('')}hstack=inputs=${n}[b];[t][b]vstack=inputs=2`;
    sheet = path.join(outDir, 'contact-sheet.jpg');
    await ffAsync(['-hide_banner', '-v', 'error', '-y', ...ins, '-filter_complex', graph, '-q:v', '3', sheet]);
  }
  const preview = path.join(outDir, 'preview.html');
  fs.writeFileSync(preview, previewHtml(p, res));
  const report = {project: p.name, stamp, slides: res.map(({mp4, ...r}) => ({...r, file: path.basename(mp4)})), contactSheet: sheet && path.basename(sheet)};
  fs.writeFileSync(path.join(outDir, 'qa.json'), JSON.stringify(report, null, 1));
  fs.rmSync(path.join(work), {recursive: true, force: true});
  return {outDir, slides: res, sheet, preview, report};
};

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** self-contained Instagram-like swipe preview (open next to the MP4s) */
export const previewHtml = (p, res) => {
  const c = p.carousel || {};
  const vids = res.map((r, i) => `<video src="${esc(path.basename(r.mp4))}" playsinline loop ${i ? '' : 'autoplay'} muted preload="auto"></video>`).join('');
  const qa = res.map((r) => `<li><b>${esc(r.id)}</b> ${esc(r.label || '')} · ${r.dur}s · ${r.size} · ${r.audio ? 'có tiếng' : '<span class=bad>KHÔNG có tiếng</span>'} · nối vòng ${r.seamPsnr == null ? '?' : r.seamPsnr >= 99 ? 'trùng khít' : r.seamPsnr.toFixed(1) + ' dB'}${r.seamPsnr != null && r.seamPsnr < 22 ? ' <span class=bad>← xem seams/' + esc(r.id) + '.jpg</span>' : ''}</li>`).join('');
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.name)} · carousel</title>
<style>
:root{--bg:#0b0820;--card:#15112f;--ink:#f4f2ff;--dim:#a8a3c9;--mint:#08DDA4}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 Inter,"Segoe UI",system-ui,sans-serif;display:flex;flex-wrap:wrap;gap:32px;justify-content:center;padding:32px 16px}
.phone{width:min(420px,100%);background:#000;border-radius:28px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.5)}
.head{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#000}.av{width:32px;height:32px;border-radius:50%;background:linear-gradient(120deg,#08DDA4,#7667FE)}
.track{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}.track::-webkit-scrollbar{display:none}
.track video{flex:0 0 100%;width:100%;aspect-ratio:4/5;scroll-snap-align:start;background:#111;display:block}
.dots{display:flex;gap:5px;justify-content:center;padding:10px}.dots i{width:6px;height:6px;border-radius:50%;background:#555}.dots i.on{background:#3d9bff}
.cap{padding:0 14px 16px;color:#ddd}.cap b{color:#fff}.side{max-width:520px}.side h2{color:var(--mint);margin:0 0 8px}.side li{margin:6px 0}.bad{color:#ff7b7b;font-weight:700}
button{background:var(--mint);color:#06031a;border:0;border-radius:999px;padding:8px 16px;font-weight:700;cursor:pointer}
</style></head><body>
<div class="phone"><div class="head"><div class="av"></div><b>${esc(c.handle || 'sami.agency')}</b><span style="margin-left:auto;color:#aaa">${res.length} slide</span></div>
<div class="track" id="tr">${vids}</div><div class="dots" id="dots">${res.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>
<div class="cap"><b>${esc(c.handle || 'sami.agency')}</b> ${esc(c.caption || '')}</div></div>
<div class="side"><h2>${esc(p.name)}</h2><p>Vuốt ngang trong khung điện thoại. Mỗi slide lặp liền mạch; bấm nút để bật tiếng slide đang xem.</p>
<button id="snd">🔊 Bật tiếng</button><ul>${qa}</ul><p>Ảnh bìa (khung 0) trong <code>covers/</code> · đường nối vòng trong <code>seams/</code> · tổng quan <code>contact-sheet.jpg</code>.</p></div>
<script>
const tr=document.getElementById('tr'),vs=[...tr.querySelectorAll('video')],ds=[...document.querySelectorAll('#dots i')];let cur=0,sound=false;
const show=(i)=>{cur=i;vs.forEach((v,k)=>{if(k===i){v.currentTime=0;v.muted=!sound;v.play().catch(()=>{});}else{v.pause();v.muted=true;}});ds.forEach((d,k)=>d.className=k===i?'on':'');};
tr.addEventListener('scroll',()=>{const i=Math.round(tr.scrollLeft/tr.clientWidth);if(i!==cur)show(i);});
document.getElementById('snd').onclick=()=>{sound=!sound;vs[cur].muted=!sound;document.getElementById('snd').textContent=sound?'🔇 Tắt tiếng':'🔊 Bật tiếng';};
</script></body></html>`;
};
