// Still frames for QA / thumbnails across BOTH engines.
//  • frame inside a Remotion scene → Remotion renderStill (full composite: titles, overlays, look)
//  • frame inside a Hyperframes scene → fast path: `hyperframes snapshot` of that scene (scene only, no titles/overlays)
//                                      exact path (exact:true): render the scene's clip (cached) and composite with Remotion
import fs from 'fs';
import path from 'path';
import {renderBundle, readProject} from './project.mjs';
import {isHf, sceneSpan, snapshot, ensureClip} from './hf.mjs';
import {ffAsync} from './ffmpeg.mjs';
import {OV} from './hf.mjs';

/** which scene a real frame (at fps) shows — the incoming scene wins inside a crossfade */
export const sceneAt = (p, frame, fps) => {
  const b = (frame * 30) / fps; // base frames
  const S = p.scenes;
  for (let i = S.length - 1; i >= 0; i--) if (b >= S[i].start - (i ? OV : 0)) return S[i];
  return S[0];
};

/**
 * frames: real frame numbers at `fps`. out(frame) → output .jpg path.
 * opts: {ratio, fps, project (optional override), titles, scale, exact, onLog}
 */
export const stills = async (dir, frames, out, {ratio, fps = 30, project, titles = true, subtitles = true, scale = 1, jpegQuality, exact = false, onLog = () => {}} = {}) => {
  const p = project || readProject(dir);
  ratio = ratio || p.formats[0];
  const layout = p.formats.includes(ratio) ? ratio : p.formats[0];
  const hfFrames = [], rmFrames = [], hfClips = {};
  for (const f of frames) { const s = sceneAt(p, f, fps); (isHf(s) && !exact ? hfFrames : rmFrames).push([f, s]); }
  if (exact) for (const s of new Set(rmFrames.map(([, s]) => s).filter(isHf))) {
    onLog(`clip ${s.id}…`); hfClips[s.id] = (await ensureClip(dir, p, s, {ratio: layout, fps, workers: 4})).rel;
  }
  const done = [];
  // Hyperframes scenes: snapshot of the staged scene at scene-local time, then → jpg (+ scale)
  const byScene = new Map(); for (const [f, s] of hfFrames) (byScene.get(s) || byScene.set(s, []).get(s)).push(f);
  for (const [s, fs_] of byScene) {
    const {a} = sceneSpan(p, s);
    const tmp = path.join(path.dirname(out(fs_[0])), '.hfsnap');
    const order = fs_.map((f) => [f, f / fps - a / 30]).sort((x, y) => x[1] - y[1]); // scene-local seconds (clip 0 = Sequence start)
    fs.rmSync(tmp, {recursive: true, force: true});
    const pngs = await snapshot(dir, p, s, {ratio: layout, fps, at: order.map((x) => x[1]), outDir: tmp});
    for (let i = 0; i < order.length && i < pngs.length; i++) {
      const dst = out(order[i][0]);
      const vf = scale !== 1 ? ['-vf', `scale=iw*${scale}:-2`] : [];
      const r = await ffAsync(['-hide_banner', '-v', 'error', '-y', '-i', pngs[i], ...vf, '-q:v', '3', dst]);
      if (r.code !== 0) throw new Error('png→jpg lỗi: ' + r.stderr.slice(-300));
      done.push(dst); onLog(`${order[i][0]} · ${s.id} (HTML)`);
    }
    fs.rmSync(tmp, {recursive: true, force: true});
  }
  if (rmFrames.length) {
    const {renderStill, selectComposition} = await import('@remotion/renderer');
    const serveUrl = await renderBundle(dir);
    const inputProps = {project: p, ratio, fps, titles, subtitles, audio: false, hfClips};
    const opts = {browserExecutable: process.env.REMOTION_BROWSER || null, chromiumOptions: process.env.REMOTION_GL ? {gl: process.env.REMOTION_GL} : {}};
    const comp = await selectComposition({serveUrl, id: 'Main', inputProps, ...opts});
    for (const [f, s] of rmFrames) {
      const dst = out(f);
      await renderStill({composition: comp, serveUrl, output: dst, frame: Math.min(comp.durationInFrames - 1, f), imageFormat: 'jpeg', ...(jpegQuality ? {jpegQuality} : {}), ...(scale !== 1 ? {scale} : {}), inputProps, ...opts});
      done.push(dst); onLog(`${f} · ${s.id}`);
    }
  }
  return done;
};
