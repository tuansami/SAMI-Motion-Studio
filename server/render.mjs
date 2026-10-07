// Render queue — crash/hang-proof:
//  • every part renders in its own child process (render-worker.mjs) → the Studio server never freezes
//  • the film is cut into parts (default 900 frames); finished parts are kept on disk → "Tiếp tục" resumes
//  • watchdog: no progress for STALL_S seconds → kill the whole process tree (Chrome + ffmpeg) and retry
//    that part with fewer threads (max 3 tries)
//  • Huỷ / Dừng tất cả = hard kill (taskkill /T /F on Windows), always works
//  • audio is rendered once, then parts are joined (no re-encode) and muxed with ffmpeg
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import {fork, spawnSync} from 'child_process';
import {hfScenes, ensureClip} from './hf.mjs';
import {isCarousel, renderCarousel} from './carousel.mjs';
import {childEnv} from './env.mjs';
import {fileURLToPath} from 'url';
import {readProject, codeHash} from './project.mjs';
import {gpuEncoders, capsReady, ffAsync, fprobeAsync, normalizeLoudness} from './ffmpeg.mjs';
import {DATA} from './paths.mjs';

export const SCALE = {'540p': 0.5, FHD: 1, '2K': 4 / 3, '4K': 2};
const BITRATE = {'540p': '4M', FHD: '16M', '2K': '28M', '4K': '55M'}; // GPU (NVENC ignores CRF)
const PRIORITY = {low: os.constants.priority.PRIORITY_BELOW_NORMAL, normal: os.constants.priority.PRIORITY_NORMAL, high: os.constants.priority.PRIORITY_ABOVE_NORMAL};
const WIN = process.platform === 'win32';
const STALL_S = +(process.env.STUDIO_STALL_S || 150); // seconds without progress = hung
const FIRST_S = 240;                                 // allowance for browser start + first frame
const PART_S = +(process.env.STUDIO_PART_S || 15);   // seconds of film per part
const MAX_TRIES = 3;
const WORKER = path.join(path.dirname(fileURLToPath(import.meta.url)), 'render-worker.mjs');
const BUNDLER = path.join(path.dirname(fileURLToPath(import.meta.url)), 'bundle-worker.mjs');
const JOBS_FILE = path.join(DATA, 'jobs.json');

let seq = 0;
export const jobs = [];
const listeners = new Set();
export const onJobs = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const pub = (j) => ({id: j.id, name: j.name, status: j.status, progress: j.progress, stage: j.stage, out: j.out, error: j.error, opts: j.opts, started: j.started, finished: j.finished, eta: j.eta, encoder: j.encoder, parts: j.parts, partsDone: j.partsDone, attempt: j.attempt, note: j.note, canResume: ['error', 'cancelled', 'interrupted'].includes(j.status) && !!j.partsDir});
export const publicJobs = () => jobs.map(pub);
let lastSave = 0;
const persist = () => {
  const now = Date.now(); if (now - lastSave < 2000) return; lastSave = now;
  try { fs.mkdirSync(DATA, {recursive: true}); fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs.filter((j) => j.status !== 'done').map(({child, watchdog, ...r}) => r))); } catch {}
};
const emit = () => { const s = JSON.stringify(jobs.map(pub)); for (const l of listeners) l(s); persist(); };

// jobs interrupted by closing the Studio window → can be resumed
try {
  for (const j of JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'))) {
    if (['running', 'queued'].includes(j.status)) { j.status = 'interrupted'; j.stage = 'Bị ngắt (Studio đã tắt) — bấm Tiếp tục'; }
    j.id = ++seq; jobs.push(j);
  }
} catch {}

// ── process helpers ───────────────────────────────────────────────
export const killTree = (child) => {
  if (!child || child.exitCode !== null || child.killed) return;
  try {
    if (WIN) spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {windowsHide: true});
    else process.kill(-child.pid, 'SIGKILL');
  } catch { try { child.kill('SIGKILL'); } catch {} }
};
/** remove Chrome headless shells left over from a crashed session (only Remotion's, never the user's Chrome) */
export const killOrphans = () => {
  if (WIN) spawnSync('taskkill', ['/IM', 'chrome-headless-shell.exe', '/T', '/F'], {windowsHide: true});
};

export const addJob = (opts) => {
  const j = {id: ++seq, name: opts.name, opts, status: 'queued', progress: 0, stage: 'Đang chờ', out: null, error: null};
  jobs.push(j); emit(); pump();
  return pub(j);
};
export const cancelJob = (id) => {
  const j = jobs.find((x) => x.id === +id); if (!j) return;
  if (['queued', 'running'].includes(j.status)) {
    j.status = 'cancelled'; j.stage = 'Đã huỷ' + (j.partsDone ? ` — giữ ${j.partsDone}/${j.parts} đoạn, bấm Tiếp tục để làm nốt` : ''); j.finished = Date.now();
    killTree(j.child); clearInterval(j.watchdog); emit();
  }
};
export const resumeJob = (id) => {
  const j = jobs.find((x) => x.id === +id); if (!j || !['error', 'cancelled', 'interrupted'].includes(j.status)) return null;
  j.status = 'queued'; j.error = null; j.stage = 'Đang chờ (tiếp tục)'; j.progress = j.parts ? (j.partsDone || 0) / j.parts * 0.9 : 0;
  emit(); pump(); return pub(j);
};
export const stopAll = () => {
  for (const j of jobs) if (['queued', 'running'].includes(j.status)) cancelJob(j.id);
  killOrphans(); emit();
};
export const clearDone = () => { for (let i = jobs.length - 1; i >= 0; i--) if (['done', 'error', 'cancelled', 'interrupted'].includes(jobs[i].status)) jobs.splice(i, 1); lastSave = 0; emit(); };

let running = null;
const pump = async () => {
  if (running) return;
  const j = jobs.find((x) => x.status === 'queued');
  if (!j) return;
  running = j;
  try { await run(j); }
  catch (e) {
    if (j.status !== 'cancelled') { j.status = 'error'; j.error = humanError(String(e?.message || e)); j.stage = 'Lỗi' + (j.partsDone ? ` — đã xong ${j.partsDone}/${j.parts} đoạn, sửa xong bấm Tiếp tục` : ''); }
  }
  j.finished = Date.now(); running = null; j.child = null; lastSave = 0; emit(); setTimeout(pump, 50);
};

const humanError = (m) => {
  if (/ENOSPC|no space/i.test(m)) return 'Ổ đĩa đầy. Giải phóng dung lượng (ProRes/4K rất nặng) rồi bấm Tiếp tục.\n\n' + m.slice(0, 600);
  if (/nvenc|OpenEncodeSessionEx|No capable devices|CUDA/i.test(m)) return 'GPU NVENC lỗi — Studio đã thử lại bằng CPU. Nếu vẫn lỗi: tab Xuất → Tăng tốc GPU = Tắt.\n\n' + m.slice(0, 600);
  if (/treo/i.test(m)) return m;
  return m.slice(0, 1500);
};

/** run one part in a child process with a watchdog */
const runPart = (j, payload, label, onProg) => new Promise((resolve, reject) => {
  const child = fork(WORKER, [], {stdio: ['ignore', 'pipe', 'pipe', 'ipc'], detached: !WIN, windowsHide: true, env: childEnv()});
  j.child = child;
  try { os.setPriority(child.pid, PRIORITY[j.opts.priority || 'normal']); } catch {}
  let log = '';
  child.stderr.on('data', (d) => { log = (log + d).slice(-3000); });
  child.stdout.on('data', () => {});
  const t0 = Date.now(); let lastTick = t0, gotFrame = false, finished = false;
  const end = (err) => { if (finished) return; finished = true; clearInterval(j.watchdog); if (err) killTree(child); err ? reject(err) : resolve(); };
  j.watchdog = setInterval(() => {
    if (j.status === 'cancelled') return end(new Error('cancelled'));
    const idle = (Date.now() - lastTick) / 1000;
    if (idle > (gotFrame ? STALL_S : FIRST_S)) end(Object.assign(new Error(`${label}: treo ${Math.round(idle)} giây không có khung hình mới — đã tự dừng tiến trình`), {stall: true}));
  }, 3000);
  child.on('message', (m) => {
    if (m.type === 'ready') child.send({type: 'run', ...payload});
    else if (m.type === 'progress') { lastTick = Date.now(); if (m.renderedFrames > 0) gotFrame = true; onProg(m); }
    else if (m.type === 'meta') { lastTick = Date.now(); }
    else if (m.type === 'done') end();
    else if (m.type === 'error') end(new Error(m.message + (log ? '\n' + log.slice(-800) : '')));
  });
  child.on('exit', (code) => { if (!finished) end(new Error(`${label}: tiến trình render thoát (mã ${code})` + (log ? '\n' + log.slice(-800) : ''))); });
});

/** webpack bundle in a child process (can be killed by Huỷ; never blocks the server) */
const bundleInChild = (j, dir, onProg) => new Promise((resolve, reject) => {
  const child = fork(BUNDLER, [dir], {stdio: ['ignore', 'ignore', 'pipe', 'ipc'], detached: !WIN, windowsHide: true, env: childEnv()});
  j.child = child; let log = '', done = false;
  child.stderr.on('data', (d) => { log = (log + d).slice(-2000); });
  child.on('message', (m) => { if (m.type === 'progress') onProg(m.p); else if (m.type === 'done') { done = true; resolve(m.out); } else if (m.type === 'error') { done = true; reject(new Error('Đóng gói lỗi (code cảnh?):\n' + m.message)); } });
  child.on('exit', (code) => { if (!done) reject(new Error(j.status === 'cancelled' ? 'cancelled' : `Đóng gói dừng (mã ${code})\n${log}`)); });
});

const totalFrames = (project, scene, fps) => {
  const toReal = (b) => Math.round((b * fps) / 30);
  if (scene) { const s = project.scenes.find((x) => x.id === scene) || project.scenes[0]; return Math.max(1, toReal(s.end - s.start + 16)); }
  return Math.max(1, toReal(project.scenes.at(-1)?.end || 30));
};

/** batch variants: replace copy values (CSV row) without touching project.json */
export const applyCopy = (project, over) => {
  if (!over || typeof over !== 'object') return project;
  const p = JSON.parse(JSON.stringify(project));
  for (const [k, v] of Object.entries(over)) if (p.copy?.[k] && v !== undefined && v !== null && String(v) !== '') p.copy[k].value = String(v);
  return p;
};

/** Hyperframes scenes → clips (cached by content hash) BEFORE bundling, so Remotion composites them like any scene */
const renderHfClips = async (j, project, {ratio, fps, scene}) => {
  const all = hfScenes(project); if (!all.length) return {};
  const o = j.opts; const S = project.scenes;
  const layout = project.formats.includes(ratio) ? ratio : project.formats[0]; // fit mode lays out the primary ratio
  let want = all;
  if (scene) { const i = S.findIndex((x) => x.id === scene); const near = new Set([S[i - 1]?.id, S[i]?.id, S[i + 1]?.id]); want = all.filter((s) => near.has(s.id)); }
  const caps = await capsReady();
  const gpu = o.gpu !== 'off' && !!caps.full?.nvenc;
  const threads = Math.max(1, Math.min(+o.threads || 8, os.cpus().length));
  const clips = {};
  for (const [k, s] of want.entries()) {
    if (j.status === 'cancelled') return clips;
    j.stage = `Cảnh HTML ${s.id} (Hyperframes) ${k + 1}/${want.length}`; j.progress = 0.01; emit();
    const r = await ensureClip(o.dir, project, s, {ratio: layout, fps, scale: SCALE[o.res] || 1, gpu, workers: Math.max(1, Math.min(4, Math.floor(threads / 2))),
      onChild: (c) => { j.child = c; }, onProgress: (p) => { j.stage = `Cảnh HTML ${s.id} (Hyperframes) ${k + 1}/${want.length} · ${Math.round(p * 100)}%`; emit(); }});
    clips[s.id] = r.rel;
  }
  return clips;
};

/** carousel project: one seamless-loop MP4 per slide + QA + swipe preview (out/carousel/<stamp>/) */
const runCarouselJob = async (j, project) => {
  const o = j.opts;
  const threads = Math.max(1, Math.min(+o.threads || 8, os.cpus().length));
  const r = await renderCarousel(o.dir, {project: applyCopy(project, o.copyOverride), only: o.scope && o.scope !== 'all' ? [o.scope] : null, gpu: o.gpu !== 'off',
    workers: Math.max(1, Math.min(4, Math.floor(threads / 2))), onChild: (c) => { j.child = c; }, cancelled: () => j.status === 'cancelled',
    onStage: (msg, p) => { j.stage = msg; j.progress = Math.min(0.99, p); emit(); }});
  if (j.status === 'cancelled') return;
  j.out = r.preview; j.encoder = 'Hyperframes (carousel)';
  const bad = r.slides.filter((s) => !s.audio || (s.seamPsnr != null && s.seamPsnr < 22));
  j.note = `${r.slides.length} slide MP4 · ${path.basename(r.outDir)}` + (bad.length ? ` · cần xem: ${bad.map((s) => s.id + (!s.audio ? ' (không tiếng)' : ' (nối vòng)')).join(', ')}` : ' · QA đạt');
  j.status = 'done'; j.progress = 1; j.stage = 'Hoàn tất'; j.eta = null;
};

const run = async (j) => {
  const o = j.opts;
  j.status = 'running'; j.started = Date.now(); j.stage = 'Chuẩn bị'; j.note = null; emit();
  { const pj = readProject(o.dir); if (isCarousel(pj)) return runCarouselJob(j, pj); }
  const scene = o.scope && o.scope !== 'all' ? o.scope : null;
  const fps = +o.fps;
  const hfClips = await renderHfClips(j, applyCopy(readProject(o.dir), o.copyOverride), {ratio: o.ratio, fps, scene});
  if (j.status === 'cancelled') return;
  j.stage = 'Đóng gói dự án'; emit();
  const serveUrl = await bundleInChild(j, o.dir, (p) => { j.progress = p / 100 * 0.03; j.stage = `Đóng gói dự án ${p}%`; emit(); });
  if (j.status === 'cancelled') return;
  const project = applyCopy(readProject(o.dir), o.copyOverride);
  const inputProps = {project, ratio: o.ratio, fps, titles: o.titles !== false, subtitles: o.subtitles !== false, audio: o.audio !== false, hfClips, ...(scene ? {sceneId: scene} : {})};
  const browserExecutable = process.env.REMOTION_BROWSER || null;
  const wantGpu = o.gpu !== 'off';
  const chromiumOptions = {gl: process.env.REMOTION_GL || (wantGpu ? 'angle' : 'swangle')};
  const compId = scene ? 'Scene' : 'Main';
  const N = totalFrames(project, scene, fps);
  const prores = o.codec === 'prores';
  const ext = prores ? 'mov' : 'mp4';

  // parts live next to the output; the key changes when anything that affects pixels changes
  const key = crypto.createHash('sha1').update(JSON.stringify({p: project, r: o.ratio, res: o.res, fps, c: o.codec, crf: o.crf, t: o.titles, s: o.subtitles, sc: scene, code: codeHash(o.dir)})).digest('hex').slice(0, 12);
  const outDir = path.join(o.dir, 'out'); const partsDir = path.join(outDir, '.parts', key);
  fs.mkdirSync(partsDir, {recursive: true}); j.partsDir = partsDir;
  if (!j.out) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 13).replace('T', '_');
    const safe = (o.name || project.name || 'video').replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 60);
    const dest = o.copyOverride ? path.join(outDir, 'variants') : outDir; fs.mkdirSync(dest, {recursive: true});
    j.out = path.join(dest, `${safe}_${o.ratio.replace(':', 'x')}_${o.res}_${fps}fps${scene ? '_' + scene : ''}_${stamp}.${ext}`);
  }

  await capsReady();
  const enc = gpuEncoders();
  let useNvenc = wantGpu && (o.codec === 'h264' ? enc.nvenc : o.codec === 'h265' ? enc.hevc_nvenc : false);
  if (fs.existsSync(path.join(partsDir, 'encoder.txt'))) useNvenc = fs.readFileSync(path.join(partsDir, 'encoder.txt'), 'utf8') === 'nvenc'; // keep parts consistent
  const setEnc = () => { j.encoder = useNvenc ? 'GPU NVENC' : prores ? 'ProRes (CPU — GPU không mã hoá ProRes)' : 'CPU x264/x265'; };
  setEnc();

  const chunk = Math.max(60, Math.round(PART_S * fps)); // ~15 s of film per part (450 f @30, 900 f @60)
  const ranges = []; for (let a = 0; a < N; a += chunk) ranges.push([a, Math.min(N - 1, a + chunk - 1)]);
  j.parts = ranges.length;
  const partFile = (i) => path.join(partsDir, `part_${String(i).padStart(3, '0')}.${ext}`);
  const isDone = (i) => fs.existsSync(partFile(i) + '.ok') && fs.existsSync(partFile(i));
  const baseThreads = Math.max(1, Math.min(+o.threads || 8, os.cpus().length));
  const t0 = Date.now(); let framesThisRun = 0;
  const doneFrames = () => ranges.reduce((s, [a, b], i) => s + (isDone(i) ? b - a + 1 : 0), 0);
  j.partsDone = ranges.filter((_, i) => isDone(i)).length;

  const media = (threads, extra) => ({
    codec: o.codec || 'h264', scale: SCALE[o.res] || 1, concurrency: threads,
    imageFormat: 'jpeg', jpegQuality: 92, pixelFormat: prores ? 'yuv422p10le' : 'yuv420p', timeoutInMilliseconds: 60000,
    ...(prores ? {proResProfile: 'hq'} : useNvenc ? {hardwareAcceleration: 'if-possible', videoBitrate: BITRATE[o.res] || '16M'} : {crf: +o.crf || 18, ...(o.codec === 'h264' ? {x264Preset: 'medium'} : {})}),
    muted: true, enforceAudioTrack: false, ...extra,
  });

  for (let i = 0; i < ranges.length; i++) {
    if (j.status === 'cancelled') return;
    if (isDone(i)) continue;
    const [a, b] = ranges[i]; const len = b - a + 1; const before = doneFrames();
    let threads = baseThreads;
    for (let attempt = 1; ; attempt++) {
      j.attempt = attempt;
      try {
        await runPart(j, {serveUrl, compId, inputProps, browserExecutable, chromiumOptions, media: media(threads, {frameRange: [a, b], outputLocation: partFile(i), overwrite: true})}, `Đoạn ${i + 1}/${ranges.length}`, (m) => {
          const cur = before + Math.min(len, m.renderedFrames || 0);
          const runFrames = framesThisRun + Math.min(len, m.renderedFrames || 0);
          j.progress = 0.03 + 0.9 * cur / N;
          const el = (Date.now() - t0) / 1000; const rate = runFrames / Math.max(1, el);
          j.eta = runFrames > 20 ? Math.round((N - cur) / rate + 8) : null;
          j.stage = `Đoạn ${i + 1}/${ranges.length} · khung ${cur}/${N}${attempt > 1 ? ` · thử lại lần ${attempt} (${threads} luồng)` : ''}`;
          emit();
        });
        fs.writeFileSync(partFile(i) + '.ok', String(len));
        if (!fs.existsSync(path.join(partsDir, 'encoder.txt'))) fs.writeFileSync(path.join(partsDir, 'encoder.txt'), useNvenc ? 'nvenc' : 'cpu');
        framesThisRun += len; j.partsDone = ranges.filter((_, k) => isDone(k)).length; j.note = null; emit();
        break;
      } catch (e) {
        if (j.status === 'cancelled') return;
        const msg = String(e.message || e);
        if (useNvenc && /nvenc|OpenEncodeSession|No capable devices|CUDA|Cannot load/i.test(msg) && j.partsDone === 0) {
          useNvenc = false; setEnc(); j.note = 'GPU NVENC không chạy được trên máy này → chuyển sang CPU'; emit(); attempt--; continue;
        }
        if (attempt >= MAX_TRIES) throw e;
        threads = Math.max(1, Math.floor(threads / 2));
        j.note = (e.stall ? 'Phát hiện treo' : 'Lỗi đoạn ' + (i + 1)) + ` → tự thử lại với ${threads} luồng`; emit();
      }
    }
  }
  if (j.status === 'cancelled') return;

  // audio (once for the whole film) — skipped when the project/job has no sound
  const wantAudio = o.audio !== false && (project.audio?.mode || 'premix') !== 'none';
  const audioFile = path.join(partsDir, 'audio.wav');
  if (wantAudio && !fs.existsSync(audioFile + '.ok')) {
    j.stage = 'Âm thanh'; j.progress = 0.94; emit();
    for (let attempt = 1; ; attempt++) {
      try {
        await runPart(j, {serveUrl, compId, inputProps: {...inputProps, audioOnly: true}, browserExecutable, chromiumOptions, media: {codec: 'wav', imageFormat: 'none', outputLocation: audioFile, overwrite: true, concurrency: baseThreads, enforceAudioTrack: true}}, 'Âm thanh', () => { j.progress = 0.95; emit(); });
        fs.writeFileSync(audioFile + '.ok', '1'); break;
      } catch (e) { if (j.status === 'cancelled') return; if (attempt >= 2) throw e; }
    }
  }

  // loudness normalisation (EBU R128, default −14 LUFS / −1 dBTP — what Reels/TikTok/YouTube play back at)
  let muxAudio = audioFile;
  const lufs = o.loudness ?? -14;
  if (wantAudio && lufs !== 'off' && isFinite(+lufs)) {
    const norm = path.join(partsDir, `audio_norm_${-lufs}.wav`);
    if (!fs.existsSync(norm + '.ok')) {
      j.stage = `Chuẩn âm lượng ${lufs} LUFS`; j.progress = 0.96; emit();
      const r = await normalizeLoudness(audioFile, norm, +lufs);
      if (r.skipped) { j.loudNote = 'Không chuẩn âm lượng: ' + r.skipped; fs.rmSync(norm, {force: true}); }
      else fs.writeFileSync(norm + '.ok', JSON.stringify(r));
    }
    if (fs.existsSync(norm + '.ok')) { muxAudio = norm; try { const r = JSON.parse(fs.readFileSync(norm + '.ok', 'utf8')); j.loudNote = `Âm lượng ${r.from.toFixed(1)} → ${r.to.toFixed(1)} LUFS`; } catch {} }
  }
  if (j.status === 'cancelled') return;

  // join parts without re-encoding + mux audio
  j.stage = 'Ghép các đoạn' + (wantAudio ? ' + âm thanh' : ''); j.progress = 0.97; emit();
  const list = path.join(partsDir, 'list.txt');
  fs.writeFileSync(list, ranges.map((_, i) => `file '${partFile(i).replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n'));
  const dur = (N / fps).toFixed(3);
  const args = ['-hide_banner', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list];
  if (wantAudio) args.push('-i', muxAudio, '-map', '0:v:0', '-map', '1:a:0', '-c:a', prores ? 'pcm_s16le' : 'aac', ...(prores ? [] : ['-b:a', '320k']));
  args.push('-c:v', 'copy', '-t', dur, ...(prores ? [] : ['-movflags', '+faststart']), j.out);
  const r = await ffAsync(args);
  if (r.code !== 0) throw new Error('Ghép video lỗi: ' + String(r.stderr).slice(-800));
  const probe = await fprobeAsync(['-v', 'error', '-count_packets', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', j.out]);
  const got = parseInt(String(probe.stdout)); if (got && Math.abs(got - N) > 2) j.note = `Cảnh báo: video có ${got}/${N} khung`;
  fs.rmSync(partsDir, {recursive: true, force: true}); j.partsDir = null;
  j.status = 'done'; j.progress = 1; j.stage = 'Hoàn tất'; j.eta = null; if (j.loudNote && !j.note) j.note = j.loudNote;
};
