// Hyperframes engine — scenes written as HTML + CSS + GSAP (web-core), default engine for new scenes since 0.6.
//   project.json → scenes[i] = {id, start, end, engine: 'hyperframes', src: 'hf/S03.html'}
// Preview: the Studio serves a staged copy of the scene (+ Hyperframes runtime + shim) at /hfp/<id>/<scene>/<ratio>/index.html
//          and the Remotion Player seeks it frame by frame (engine/src/core/HfScene.tsx).
// Render:  each HF scene is rendered ONCE by the Hyperframes CLI into public/_hf/<scene>_<ratio>_<fps>_<scale>_<hash>.mp4
//          (hash of everything that changes pixels) and composited by Remotion like any other scene → titles, subtitles,
//          overlays, crossfades and audio stay identical across engines; editing text/music never re-renders HF clips.
// File convention inside a scene: paths are relative to the PROJECT ROOT — public/…, hf/…, lib/<kind>/…, _sami/…, _gsap/…, _fonts/<family>/<w>.css
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {spawn} from 'child_process';
import {ROOT, NODE_MODULES, LIB, LIBRARY, cacheDir} from './paths.mjs';
import {childEnv} from './env.mjs';
import {junction} from './fslink.mjs';
import {ASSETS} from './library.mjs';
import {styleData, styleHead} from './styles.mjs';

export const OV = 8; // = engine/src/core/constants.ts
export const STAGES = {'16:9': {w: 1920, h: 1080}, '9:16': {w: 1080, h: 1920}, '1:1': {w: 1080, h: 1080}, '4:5': {w: 1080, h: 1350}};
export const HF_BIN = path.join(NODE_MODULES, 'hyperframes', 'bin', 'hyperframes.mjs');
export const HF_RUNTIME = path.join(NODE_MODULES, 'hyperframes', 'dist', 'hyperframe.runtime.iife.js');
export const HF_VERSION = (() => { try { return JSON.parse(fs.readFileSync(path.join(NODE_MODULES, 'hyperframes', 'package.json'), 'utf8')).version; } catch { return null; } })();
const GSAP_DIST = path.join(NODE_MODULES, 'gsap', 'dist');
const FONTS = path.join(NODE_MODULES, '@fontsource');
const DEFAULT_COLORS = {navy: '#0C0628', navyDeep: '#06031A', navyLift: '#16103A', mint: '#08DDA4', purple: '#7667FE', white: '#FFFFFF', text: '#F4F2FF', muted: '#A8A3C9', dim: '#6E6893', red: '#FF5A5F'};

export const isHf = (s) => !!s && (s.engine === 'hyperframes' || /\.html?$/i.test(s.src || ''));
export const hfScenes = (p) => (p.scenes || []).filter(isHf);
export const ratioTag = (r) => String(r).replace(':', 'x');
const projKey = (dir) => crypto.createHash('sha1').update(path.resolve(dir).toLowerCase()).digest('hex').slice(0, 10);

/** time span of the scene's Sequence in base frames (same maths as Main.tsx SceneStack) */
export const isCarousel = (p) => p?.type === 'carousel';
export const sceneSpan = (p, s) => {
  if (isCarousel(p)) return {a: s.start, b: s.end, dur: (s.end - s.start) / 30}; // carousel slide = exact seamless loop, no crossfade
  const S = p.scenes; const i = S.findIndex((x) => x.id === s.id); const T = S.length ? S[S.length - 1].end : 30;
  const a = i === 0 ? -OV : s.start - OV; const b = Math.min(T, s.end + OV);
  return {a, b, dur: (b - a) / 30};
};

/** data exposed to the scene as window.SAMI */
export const sceneData = (p, s, ratio, fps) => {
  const st = STAGES[ratio] || STAGES['16:9'];
  const copy = {}; for (const [k, v] of Object.entries(p.copy || {})) copy[k] = v?.value;
  return {copy, brand: {colors: {...DEFAULT_COLORS, ...(p.brand?.colors || {})}, gradient: p.brand?.gradient || null, fonts: p.brand?.fonts || {}},
    ratio, w: st.w, h: st.h, fps, scene: s.id, dur: +sceneSpan(p, s).dur.toFixed(4), t0: isCarousel(p) ? 0 : OV / 30, project: p.name || '',
    // khuôn (lib/hf/khuon): which template this scene came from + its theme (night | paper | light)
    khuon: s.khuon || null, theme: s.khuon?.theme || p.look?.theme || 'night', style: styleData(s.khuon?.theme || p.look?.theme || 'night'), // 1.2: phong cách
    ...(isCarousel(p) ? carouselData(p, s) : {})};
};
/** carousel: slide index/count + where this slide sits in the whole carousel (for continuing progress / protagonist) */
const carouselData = (p, s) => {
  const S = p.scenes || []; const i = S.findIndex((x) => x.id === s.id); const c = p.carousel || {};
  return {slide: {index: i, count: S.length, start: s.start / 30, total: (S.at(-1)?.end || 0) / 30},
    carousel: {series: c.series || '', handle: c.handle || '', theme: c.theme || 'sami', swipe: c.swipe || 'Swipe'}, photo: s.photo || null};
};

const setAttr = (tag, name, value) => {
  const re = new RegExp(`\\s${name}\\s*=\\s*("[^"]*"|'[^']*'|[^\\s>]+)`, 'i');
  return re.test(tag) ? tag.replace(re, ` ${name}="${value}"`) : tag.replace(/\s*\/?>$/, (m) => ` ${name}="${value}"${m}`);
};

/** scene HTML → staged HTML (root sized/timed for this ratio, SAMI data + runtime injected) */
export const stageHtml = (dir, p, s, ratio, fps, {preview = false, audio = null} = {}) => {
  const src = path.join(dir, s.src || `hf/${s.id}.html`);
  if (!fs.existsSync(src)) throw new Error(`Thiếu file cảnh ${path.relative(dir, src)}`);
  let html = fs.readFileSync(src, 'utf8');
  const st = STAGES[ratio] || STAGES['16:9'];
  const dur = sceneSpan(p, s).dur.toFixed(4);
  const m = html.match(/<[a-z][^>]*\sdata-composition-id\s*=[^>]*>/i);
  if (!m) throw new Error(`${s.src}: thiếu phần tử gốc có data-composition-id`);
  let tag = m[0];
  for (const [k, v] of [['data-width', st.w], ['data-height', st.h], ['data-start', 0], ['data-duration', dur]]) tag = setAttr(tag, k, v);
  html = html.replace(m[0], tag);
  const data = JSON.stringify(sceneData(p, s, ratio, fps)).replace(/</g, '\\u003c');
  // preview: Studio tabs push unsaved copy/brand edits (shim → sessionStorage → reload) — JSON must match HfScene.tsx
  const live = {}; for (const [k, v] of Object.entries(p.copy || {})) live[k] = v?.value;
  const liveStr = JSON.stringify(JSON.stringify({copy: live, brand: p.brand || {}})).replace(/</g, '\\u003c');
  const dataJs = preview
    ? `window.__samiData=${liveStr};window.SAMI=${data};(function(S){try{var o=JSON.parse(sessionStorage.getItem('sami:'+S.scene+':'+S.ratio)||'null');if(o){S.copy=o.copy||S.copy;var b=o.brand||{};S.brand={colors:Object.assign({},S.brand.colors,b.colors||{}),gradient:b.gradient||S.brand.gradient,fonts:b.fonts||S.brand.fonts};}}catch(e){}})(window.SAMI);`
    : `window.SAMI=${data};`;
  const head = `<meta charset="utf-8"><script>${dataJs}</script><link rel="stylesheet" href="_sami/sami.css">` + brandFontLinks(p) +
    (/_gsap\/gsap(\.min)?\.js/.test(html) ? '' : '<script src="_gsap/gsap.min.js"></script>') + '<script src="_sami/sami-hf.js"></script>' + styleHead(s.khuon?.theme || p.look?.theme || 'night') +
    (isCarousel(p) ? '<link rel="stylesheet" href="_sami/carousel.css"><script src="_sami/carousel.js"></script>' : '');
  html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (h) => h + head) : html.replace(/<html[^>]*>/i, (h) => h + '<head>' + head + '</head>');
  // carousel slides carry their own sound (seamless-loop mix) → Hyperframes muxes it into the slide MP4
  if (audio) html = html.replace(tag, tag + `<audio id="sami-mix" src="${audio}" data-start="0" data-duration="${dur}" data-volume="1"></audio>`);
  if (preview) {
    const tail = '<script src="_hfrt.js"></script><script src="_sami/shim.js"></script>';
    html = /<\/body>/i.test(html) ? html.replace(/<\/body>/i, tail + '</body>') : html + tail;
  }
  return html;
};

/** brand fonts (project.json → brand.fonts.head / ui / script, e.g. "Playfair Display") → local fontsource links + CSS vars.
 *  Only families installed under @fontsource load; others fall back to the theme fonts. */
const famSlug = (f) => String(f || '').split(',')[0].replace(/["']/g, '').trim().toLowerCase().replace(/\s+/g, '-');
export const brandFontLinks = (p) => {
  const F = p.brand?.fonts || {}; let out = '', vars = '';
  for (const [role, v] of Object.entries({head: F.head || F.display, ui: F.ui || F.body, script: F.script})) {
    const slug = famSlug(v); if (!slug || !fs.existsSync(path.join(FONTS, slug))) continue;
    for (const w of [400, 500, 600, 700, 800, 900]) if (fs.existsSync(path.join(FONTS, slug, `${w}.css`))) out += `<link rel="stylesheet" href="_fonts/${slug}/${w}.css">`;
    vars += `--f-${role}:"${String(v).split(',')[0].replace(/["']/g, '').trim()}","Be Vietnam Pro",sans-serif;`;
  }
  return out + (vars ? `<style>html:root{${vars}}</style>` : ''); // html:root outranks a khuôn theme's [data-theme] fonts
};

/** font families referenced as _fonts/<family>/… */
const fontRefs = (html) => [...new Set([...html.matchAll(/_fonts\/([a-z0-9-]+)\//gi)].map((m) => m[1].toLowerCase()))];

/** map a URL path inside a staged scene to a real file (preview server + render staging use the same rules) */
export const resolveStaged = (dir, rel) => {
  rel = rel.replace(/^\/+/, '');
  const pick = (base, r) => { const f = path.resolve(base, r); return f.startsWith(path.resolve(base) + path.sep) ? f : null; };
  if (rel === '_hfrt.js') return HF_RUNTIME;
  if (rel.startsWith('_sami/')) return pick(path.join(LIB, 'hf'), rel.slice(6));
  if (rel.startsWith('_gsap/')) return pick(GSAP_DIST, rel.slice(6));
  if (rel.startsWith('_fonts/')) return pick(FONTS, rel.slice(7));
  if (rel.startsWith('lib/')) return pick(ASSETS, rel.slice(4));
  if (rel.startsWith('public/') || rel.startsWith('hf/') || rel.startsWith('slides/') || rel.startsWith('media/')) return pick(dir, rel); // media/ = footage (0.9)
  return pick(path.join(dir, 'hf'), rel); // bare relative refs → next to the scene file
};

/** staging folder for the Hyperframes CLI: index.html + junctions (no media is copied) */
export const stageDir = (dir, p, s, ratio, fps, {audio = null} = {}) => {
  dir = path.resolve(dir);
  const out = cacheDir('hf-stage', projKey(dir), `${s.id}_${ratioTag(ratio)}`);
  if (audio) { fs.mkdirSync(path.join(out, '_audio'), {recursive: true}); fs.copyFileSync(audio, path.join(out, '_audio', 'mix.wav')); }
  else fs.rmSync(path.join(out, '_audio'), {recursive: true, force: true});
  const html = stageHtml(dir, p, s, ratio, fps, {audio: audio ? '_audio/mix.wav' : null});
  fs.writeFileSync(path.join(out, 'index.html'), html);
  junction(path.join(LIB, 'hf'), path.join(out, '_sami'));
  junction(GSAP_DIST, path.join(out, '_gsap'));
  if (fs.existsSync(path.join(dir, 'public'))) junction(path.join(dir, 'public'), path.join(out, 'public'));
  for (const sub of ['hf', 'slides', 'media']) if (fs.existsSync(path.join(dir, sub))) junction(path.join(dir, sub), path.join(out, sub));
  if (fs.existsSync(ASSETS) && /["'(]lib\/|"lib:/.test(html)) junction(ASSETS, path.join(out, 'lib')); // "lib: = a copy value (khuôn image slot)
  const fam = fontRefs(html);
  if (fam.length) { const fd = path.join(out, '_fonts'); fs.mkdirSync(fd, {recursive: true}); for (const f of fam) if (fs.existsSync(path.join(FONTS, f))) junction(path.join(FONTS, f), path.join(fd, f)); }
  return {dir: out, html};
};

// ── clip cache ──────────────────────────────────────────────────────
const treeSig = (d, h, skip = () => false) => {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
    if (skip(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) treeSig(p, h, skip); else { const st = fs.statSync(p); h.update(p + st.size + st.mtimeMs); }
  }
};
export const SCALE_PRESET = {'16:9': 'landscape-4k', '9:16': 'portrait-4k', '1:1': 'square-4k'};
/** HF can only upscale by integer factors with a preset → 1 or 2 */
export const hfScale = (ratio, scale = 1) => (scale > 1 && SCALE_PRESET[ratio] ? 2 : 1);
export const clipName = (dir, p, s, ratio, fps, scale = 1) => {
  const h = crypto.createHash('sha1');
  h.update(stageHtml(dir, p, s, ratio, fps) + '|' + fps + '|' + ratio + '|' + hfScale(ratio, scale) + '|' + HF_VERSION);
  treeSig(path.join(dir, 'hf'), h);
  treeSig(path.join(dir, 'public'), h, (n) => n === '_hf' || n === '_engine');
  treeSig(path.join(LIB, 'hf'), h);
  return `${s.id}_${ratioTag(ratio)}_${fps}_${hfScale(ratio, scale)}x_${h.digest('hex').slice(0, 10)}.mp4`;
};
export const clipPath = (dir, name) => path.join(dir, 'public', '_hf', name);

/** run the Hyperframes CLI → {code, log} ; returns the child via onChild so callers can kill it */
export const runHf = (args, {onChild, onLine} = {}) => new Promise((ok) => {
  const c = spawn(process.execPath, [HF_BIN, ...args], {env: childEnv(), windowsHide: true});
  onChild?.(c);
  let log = '';
  const take = (d) => { const s = String(d); log = (log + s).slice(-8000); if (onLine) for (const l of s.split(/\r?\n|\r/)) if (l.trim()) onLine(l.replace(/\x1b\[[0-9;]*m/g, '')); };
  c.stdout.on('data', take); c.stderr.on('data', take);
  c.on('exit', (code) => ok({code, log: log.replace(/\x1b\[[0-9;]*m/g, '')})); c.on('error', (e) => ok({code: -1, log: String(e)}));
});

/** make sure the clip for one HF scene exists → relative public path '_hf/…' */
export const ensureClip = async (dir, p, s, {ratio, fps = 30, scale = 1, gpu = false, workers = 'auto', onChild, onProgress} = {}) => {
  const name = clipName(dir, p, s, ratio, fps, scale);
  const out = clipPath(dir, name);
  if (fs.existsSync(out) && fs.existsSync(out + '.ok')) return {rel: '_hf/' + name, cached: true};
  const {dir: sd} = stageDir(dir, p, s, ratio, fps);
  fs.mkdirSync(path.dirname(out), {recursive: true});
  const tmp = out.replace(/\.mp4$/, '.part.mp4');
  const args = ['render', sd, '-o', tmp, '--fps', String(fps), '-q', 'delivery', '-w', String(workers), '--quiet', '--format', 'mp4'];
  if (hfScale(ratio, scale) === 2) args.push('--resolution', SCALE_PRESET[ratio]);
  if (gpu) args.push('--gpu');
  let r = await runHf(args, {onChild, onLine: (l) => { const m = l.match(/(\d{1,3}(?:\.\d+)?)\s*%/); if (m) onProgress?.(Math.min(1, +m[1] / 100)); }});
  if (r.code !== 0 && gpu && /nvenc|gpu|encoder/i.test(r.log)) r = await runHf(args.filter((a) => a !== '--gpu'), {onChild}); // NVENC busy/unsupported → CPU
  if (r.code !== 0 || !fs.existsSync(tmp)) throw new Error(`Hyperframes render ${s.id} lỗi:\n` + r.log.slice(-1500));
  fs.renameSync(tmp, out); fs.writeFileSync(out + '.ok', new Date().toISOString());
  // drop older clips of the same scene/ratio/fps/scale
  const prefix = name.replace(/_[0-9a-f]{10}\.mp4$/, '_');
  for (const f of fs.readdirSync(path.dirname(out))) if (f.startsWith(prefix) && !f.startsWith(name)) fs.rmSync(path.join(path.dirname(out), f), {force: true});
  return {rel: '_hf/' + name, cached: false};
};

/** QA stills of one HF scene at scene-local times (seconds) → [png paths] */
export const snapshot = async (dir, p, s, {ratio, fps = 30, at = [1], outDir}) => {
  const {dir: sd} = stageDir(dir, p, s, ratio, fps);
  fs.mkdirSync(outDir, {recursive: true});
  const before = new Set(fs.readdirSync(outDir));
  const r = await runHf(['snapshot', sd, '-o', outDir, '--at', at.map((t) => Math.max(0, t).toFixed(3)).join(','), '--no-end', '--describe', 'false']);
  if (r.code !== 0) throw new Error(`hyperframes snapshot ${s.id} lỗi:\n` + r.log.slice(-1200));
  // frame-NN-at-<t>s.png in the order of --at (contact-sheet.jpg is skipped)
  return fs.readdirSync(outDir).filter((f) => !before.has(f) && /^frame-\d+-at-.*\.png$/i.test(f)).sort((a, b) => parseInt(a.slice(6)) - parseInt(b.slice(6))).map((f) => path.join(outDir, f));
};

/** lint/check a scene with Hyperframes' own validator → {code, log} */
export const lintScene = async (dir, p, s, ratio = p.formats?.[0] || '16:9') => {
  const {dir: sd} = stageDir(dir, p, s, ratio, 30);
  return runHf(['lint', sd]);
};

/** remove clips no longer referenced by any scene/ratio (called by cleanup) */
export const pruneClips = (dir, keep = new Set()) => {
  const d = path.join(dir, 'public', '_hf'); if (!fs.existsSync(d)) return 0;
  let bytes = 0;
  for (const f of fs.readdirSync(d)) if (!keep.has(f.replace(/\.ok$/, ''))) { bytes += fs.statSync(path.join(d, f)).size; fs.rmSync(path.join(d, f), {force: true}); }
  return bytes;
};
export {ROOT, LIBRARY};
