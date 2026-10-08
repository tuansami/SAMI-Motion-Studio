// Studio 1.0 — "Xuất Hyperframes thuần": export a project WITHOUT Remotion (for client packages; Remotion's licence
// needs a company licence above 3 people). Pipeline:
//   1. every HTML scene → clip, rendered once by the Hyperframes CLI (same cache as the Remotion path: public/_hf)
//   2. FILM composition (index.html in the cache): one <video> per scene clip (crossfade/blur done in lib/hf/native/film.js),
//      footage <video>s with their frames, titles, subtitles, image/sticker overlays, grain + vignette → Hyperframes renders it
//   3. sound: project.json → audio + footage sound mixed by ffmpeg (music edits/crossfades, fade-out, voice ducking, SFX),
//      loudness-normalised like the Remotion path, then muxed onto the picture (video stream copied)
// What it cannot do yet (support() says so, the Remotion path still can): .tsx scenes, Lottie overlays, "vừa khung"
// (a ratio the project has no layout for), H.265.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {LIB, NODE_MODULES, ENGINE, cacheDir} from './paths.mjs';
import {OV, STAGES, isHf, ensureClip, runHf, ratioTag, brandFontLinks, HF_VERSION} from './hf.mjs';
import {junction} from './fslink.mjs';
import {resolveLib, ASSETS} from './library.mjs';
import {ffAsync, fprobeAsync, normalizeLoudness, probeEncoder} from './ffmpeg.mjs';

const T_OF = (p) => (p.scenes?.at(-1)?.end || 30) / 30;
const DEFAULT_COLORS = {navy: '#0C0628', navyDeep: '#06031A', navyLift: '#16103A', mint: '#08DDA4', purple: '#7667FE', white: '#FFFFFF', text: '#F4F2FF', muted: '#A8A3C9', dim: '#6E6893', red: '#FF5A5F'};
const FONTS = path.join(NODE_MODULES, '@fontsource');
const famSlug = (f) => String(f || '').split(',')[0].replace(/["']/g, '').trim().toLowerCase().replace(/\s+/g, '-');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const clipLen = (c) => Math.max(0, ((+c.out || 0) - (+c.in || 0)) / (+c.speed || 1));
const fmt = (x) => (+x).toFixed(4);

/** can this project be exported without Remotion? → {ok, reasons[], notes[]} */
export const support = (p, {ratio, codec = 'h264', res = 'FHD', scope = null} = {}) => {
  const reasons = [], notes = [];
  if (!(p.scenes || []).length) reasons.push('Dự án chưa có cảnh nào.');
  if (p.type === 'carousel') reasons.push('Carousel đã xuất bằng Hyperframes (tab Xuất bình thường).');
  for (const s of p.scenes || []) if (s.engine !== 'blank' && !isHf(s)) reasons.push(`Cảnh ${s.id} viết bằng Remotion (.tsx). Chuyển sang HTML (khuôn hoặc viết lại) mới xuất thuần được.`);
  for (const o of p.overlays || []) if (o.kind === 'lottie') reasons.push(`Ảnh chèn ${o.id} là Lottie (chưa hỗ trợ khi xuất thuần).`);
  if (ratio && !(p.formats || []).includes(ratio)) reasons.push(`Dự án chưa có bố cục ${ratio} ("vừa khung" chỉ có ở bộ dựng Remotion).`);
  if (codec === 'h265') reasons.push('H.265 chưa có khi xuất thuần: chọn H.264 hoặc ProRes.');
  if (!['FHD', '4K'].includes(res || 'FHD')) reasons.push(`Độ phân giải ${res}: xuất thuần chỉ có FHD và 4K (Hyperframes phóng theo bội số nguyên).`);
  if (res === '4K' && ratio === '4:5') reasons.push('4K cho 4:5 chưa có khi xuất thuần.');
  if (scope && scope !== 'all') reasons.push('Xuất từng cảnh chỉ có ở bộ dựng Remotion; xuất thuần luôn xuất cả phim.');
  if (p.audio?.mode === 'premix' && p.audio.premix && (p.audio.voice?.length || p.audio.cues?.length)) notes.push('Chế độ nhạc mix sẵn: thoại / SFX riêng không được trộn thêm (giống bộ dựng Remotion).');
  if ((p.tracks?.video || []).some((c) => (c.speed || 1) !== 1)) notes.push('Footage đổi tốc độ: tiếng được kéo bằng atempo (0,5× đến 2×).');
  return {ok: !reasons.length, reasons, notes};
};

/** project media path → absolute file ('lib:…' = SAMI_Library, 'media/…' = footage, else public/…) */
const mediaFile = (dir, src) => {
  if (!src) return null;
  if (String(src).startsWith('lib:')) return resolveLib(src);
  if (/^media\//.test(src)) return path.join(dir, src);
  return path.join(dir, 'public', String(src).replace(/^public\//, ''));
};
/** same, as a URL path inside the staged composition */
const mediaUrl = (src) => (String(src).startsWith('lib:') ? 'lib/' + String(src).slice(4) : /^media\//.test(src) ? src : 'public/' + String(src).replace(/^public\//, ''));

// ── footage markup (port of engine/src/core/VideoTrack.tsx; fades/pop are animated by film.js) ──
const Z = {main: 0, screen: 5, broll: 10, pip: 20};
const footageHtml = (c, st, idx) => {
  const len = clipLen(c), fit = c.fit || (c.role === 'screen' ? 'contain' : 'cover');
  const video = `<video id="fv-${esc(c.id)}" src="${esc(c.src.split('/').map(encodeURIComponent).join('/'))}" muted playsinline data-start="${fmt(c.at || 0)}" data-duration="${fmt(len)}" data-media-start="${fmt(c.in || 0)}"${(c.speed || 1) !== 1 ? ` data-playback-rate="${c.speed}"` : ''} style="width:100%;height:100%;object-fit:${fit};display:block"></video>`;
  const zi = 10 + (c.z ?? Z[c.role] ?? 0) + idx / 1000;
  const framed = c.role === 'pip' || c.role === 'screen';
  if (!framed) return `<div id="ft-${esc(c.id)}" style="position:absolute;inset:0;z-index:${zi};visibility:hidden;${fit === 'contain' ? 'background:#000' : ''}">${video}</div>`;
  const short = Math.min(st.w, st.h); const P = {x: 0.5, y: 0.5, w: 0.4, r: 0.08, ...(c.pip || {})};
  const mask = c.mask || (c.role === 'screen' ? 'phone' : 'rounded');
  const W = P.w * short * (mask === 'laptop' ? 1.9 : 1);
  const aspect = mask === 'circle' ? 1 : mask === 'phone' ? 9 / 19.5 : mask === 'laptop' ? 16 / 10 : c.aspect || 16 / 9;
  const H = W / aspect;
  const box = `position:absolute;left:${P.x * st.w - W / 2}px;top:${P.y * st.h - H / 2}px;width:${W}px;height:${H}px;z-index:${zi};visibility:hidden;`;
  if (mask === 'phone') { const pad = W * 0.028; return `<div id="ft-${esc(c.id)}" style="${box}border-radius:${W * 0.14}px;background:#0E0E14;padding:${pad}px;box-sizing:border-box;box-shadow:0 40px 90px rgba(0,0,0,.45),inset 0 0 0 2px rgba(255,255,255,.08)"><div style="position:relative;width:100%;height:100%;border-radius:${W * 0.115}px;overflow:hidden;background:#000">${video}<div style="position:absolute;top:${W * 0.035}px;left:35%;width:30%;height:${W * 0.07}px;border-radius:999px;background:#0E0E14"></div></div></div>`; }
  if (mask === 'laptop') { const bez = W * 0.025; return `<div id="ft-${esc(c.id)}" style="${box}height:${H + W * 0.06}px"><div style="width:${W}px;height:${H}px;border-radius:${W * 0.022}px;background:#111;padding:${bez}px;box-sizing:border-box;box-shadow:0 30px 70px rgba(0,0,0,.4)"><div style="width:100%;height:100%;overflow:hidden;background:#000;border-radius:${W * 0.006}px">${video}</div></div><div style="width:${W * 1.14}px;margin-left:${-W * 0.07}px;height:${W * 0.035}px;background:linear-gradient(#cfd2d8,#9a9ea8);border-radius:0 0 ${W * 0.03}px ${W * 0.03}px"></div></div>`; }
  const radius = mask === 'circle' ? '50%' : mask === 'rounded' ? (P.r ?? 0.08) * W + 'px' : '0';
  return `<div id="ft-${esc(c.id)}" style="${box}border-radius:${radius};overflow:hidden;background:#000;${c.shadow === false ? '' : 'box-shadow:0 24px 60px rgba(0,0,0,.45);'}${c.border ? `outline:${Math.max(2, W * 0.012)}px solid ${c.border};outline-offset:-1px;` : ''}">${video}</div>`;
};

/** FILM composition HTML. clips: {sceneId: '_hf/…mp4'} (missing clip → a labelled placeholder, used for QA stills) */
export const filmHtml = (dir, p, {ratio, fps = 30, clips = {}, titles = true, subtitles = true}) => {
  const st = STAGES[ratio] || STAGES['16:9']; const T = T_OF(p); const S = p.scenes; const Tb = S.at(-1)?.end || 30;
  const colors = {...DEFAULT_COLORS, ...(p.brand?.colors || {})};
  const grad = p.brand?.gradient || `linear-gradient(120deg, ${colors.mint} 0%, ${colors.purple} 100%)`;
  const scenes = []; let vids = '';
  S.forEach((s, i) => {
    if (s.engine === 'blank') return;
    const first = i === 0, last = i === S.length - 1;
    const a = first ? -OV : s.start - OV, b = Math.min(Tb, s.end + OV);
    const fadeIn = first ? 0 : s.fadeIn ?? 2 * OV;
    scenes.push({id: s.id, a, b, fadeIn, delay: s.fadeDelay ?? (fadeIn < 2 * OV ? OV - Math.round(fadeIn / 2) : 0), fadeOut: last ? 0 : 2 * OV});
    const start = Math.max(0, a) / 30, mediaStart = a < 0 ? -a / 30 : 0, dur = (b - Math.max(0, a)) / 30;
    vids += clips[s.id]
      ? `<video id="sc-${esc(s.id)}" class="sc" src="public/${esc(clips[s.id])}" muted playsinline data-start="${fmt(start)}" data-duration="${fmt(dur)}" data-media-start="${fmt(mediaStart)}" style="z-index:${i + 1}"></video>\n`
      : `<div id="sc-${esc(s.id)}" class="sc ph" style="z-index:${i + 1}">${esc(s.id)} · ${esc(s.label || '')}<small>chưa có clip Hyperframes (QA)</small></div>\n`;
  });
  const foot = (p.tracks?.video || []).filter((c) => !c.formats?.length || c.formats.includes(ratio)).map((c, i) => ({c, i})).sort((x, y) => (x.c.z ?? Z[x.c.role] ?? 0) - (y.c.z ?? Z[y.c.role] ?? 0));
  const footHtml = foot.map(({c, i}) => footageHtml(c, st, i)).join('\n');
  const footData = foot.map(({c}) => ({id: c.id, at: +c.at || 0, len: clipLen(c), fin: +c.fadeIn || 0, fout: +c.fadeOut || 0, framed: c.role === 'pip' || c.role === 'screen'}));
  const inRatio = (x) => !x.formats?.length || x.formats.includes(ratio);
  const FILM = {T, w: st.w, h: st.h, fps, scenes, footage: footData, colors, grad,
    fontHead: p.brand?.fonts?.head ? `"${String(p.brand.fonts.head).split(',')[0].replace(/["']/g, '')}","Be Vietnam Pro",Inter,sans-serif` : '"Be Vietnam Pro",Inter,sans-serif',
    titles: titles ? (p.titles || []).filter(inRatio) : [],
    subs: subtitles && p.subtitles?.enabled && p.subtitles.items?.length ? p.subtitles : null,
    overlays: (p.overlays || []).filter((o) => inRatio(o) && o.kind !== 'lottie').map((o) => ({...o, url: o.kind === 'image' && o.src ? mediaUrl(o.src) : null})),
    look: {grain: p.look?.grain ?? 0.05, vignette: p.look?.vignette ?? 0.42}};
  // fonts: theme + every family a title / subtitle style names (if installed under @fontsource)
  const fams = new Set(['be-vietnam-pro', 'inter']); for (const t of [...FILM.titles, ...(FILM.subs ? [{style: FILM.subs.style}] : [])]) if (t.style?.font) fams.add(famSlug(t.style.font));
  let fontLinks = ''; for (const f of fams) for (const w of [400, 500, 600, 700, 800, 900]) if (fs.existsSync(path.join(FONTS, f, `${w}.css`))) fontLinks += `<link rel="stylesheet" href="_fonts/${f}/${w}.css">`;
  const SAMI = {copy: {}, brand: {colors, gradient: grad, fonts: p.brand?.fonts || {}}, ratio, w: st.w, h: st.h, fps, scene: 'film', dur: T, t0: 0, project: p.name || '', khuon: null, theme: p.look?.theme || 'night'};
  const js = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
  return `<!doctype html>
<html><head><meta charset="utf-8">
<script>window.SAMI=${js(SAMI)};window.FILM=${js(FILM)};</script>
<link rel="stylesheet" href="_sami/sami.css">${fontLinks}${brandFontLinks(p)}
<script src="_gsap/gsap.min.js"></script><script src="_sami/sami-hf.js"></script>
<style>
html,body{margin:0;background:${p.look?.background || colors.navyDeep}}
#film{position:relative;width:${st.w}px;height:${st.h}px;overflow:hidden;background:${p.look?.background || colors.navyDeep}}
.sc{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;visibility:hidden;transform-origin:50% 50%}
.sc.ph{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#cfc9ff;font:700 ${Math.round(Math.min(st.w, st.h) * 0.05)}px Inter,sans-serif;background:repeating-linear-gradient(135deg,#1c1840 0 24px,#15112f 24px 48px)}
.sc.ph small{font-size:.45em;opacity:.6}
</style></head>
<body>
<div id="film" data-composition-id="film" data-width="${st.w}" data-height="${st.h}" data-start="0" data-duration="${fmt(T)}">
${vids}${footHtml}
</div>
<script src="_sami/native/film.js"></script>
</body></html>`;
};

/** staging folder for the FILM composition (junctions, nothing copied) → {dir, html} */
export const stageFilm = (dir, p, opts) => {
  dir = path.resolve(dir);
  const key = crypto.createHash('sha1').update(dir.toLowerCase()).digest('hex').slice(0, 10);
  const out = cacheDir('hf-stage', key, `_film_${ratioTag(opts.ratio)}`);
  const html = filmHtml(dir, p, opts);
  fs.writeFileSync(path.join(out, 'index.html'), html);
  junction(path.join(LIB, 'hf'), path.join(out, '_sami'));
  junction(path.join(NODE_MODULES, 'gsap', 'dist'), path.join(out, '_gsap'));
  if (fs.existsSync(path.join(dir, 'public'))) junction(path.join(dir, 'public'), path.join(out, 'public'));
  if (fs.existsSync(path.join(dir, 'media'))) junction(path.join(dir, 'media'), path.join(out, 'media'));
  if (/["'(]lib\//.test(html) && fs.existsSync(ASSETS)) junction(ASSETS, path.join(out, 'lib'));
  const fd = path.join(out, '_fonts'); fs.mkdirSync(fd, {recursive: true});
  for (const f of new Set([...html.matchAll(/_fonts\/([a-z0-9-]+)\//g)].map((m) => m[1]))) if (fs.existsSync(path.join(FONTS, f))) junction(path.join(FONTS, f), path.join(fd, f));
  // grain frames live in the project's public/_engine (hardlinked by syncEngineAssets); make sure they exist
  const eng = path.join(dir, 'public', '_engine'); if (!fs.existsSync(path.join(eng, 'grain0.png')) && fs.existsSync(path.join(ENGINE, 'public'))) { fs.mkdirSync(eng, {recursive: true}); for (const f of fs.readdirSync(path.join(ENGINE, 'public'))) if (/^grain\d\.png$/.test(f)) fs.copyFileSync(path.join(ENGINE, 'public', f), path.join(eng, f)); }
  return {dir: out, html};
};

// ── sound: ffmpeg port of engine/src/core/AudioTrack.tsx ──
/** → {args, inputs, graph} for ffmpeg, or null when the project has no sound */
export const audioPlan = (dir, p, {out}) => {
  const A = p.audio || {mode: 'none'}; const T = T_OF(p); const SR = 48000;
  const inputs = []; const chains = []; const labels = [];
  const add = (file, chain) => { if (!file || !fs.existsSync(file)) return false; const i = inputs.push(file) - 1; const l = `a${i}`; chains.push(`[${i}:a]aresample=${SR},aformat=channel_layouts=stereo,${chain}[${l}]`); labels.push(`[${l}]`); return true; };
  const missing = [];
  const db = (d) => `volume=${(+d || 0).toFixed(2)}dB`;
  const delay = (s) => `adelay=${Math.max(0, Math.round(s * 1000))}:all=1`;
  const heard = (p.tracks?.video || []).filter((c) => c.volume != null);
  // voice / footage-with-sound ducking: music gain = 1 − w·(1 − duck), w = trapezoid around each clip (0.25 s ramps)
  const vo = [...(A.mode === 'layers' ? A.voice || [] : []).map((v) => ({t: +v.t, len: +v.len || 0})), ...heard.filter((c) => c.duck !== false).map((c) => ({t: +c.at || 0, len: clipLen(c)}))];
  const duckG = Math.pow(10, (A.duck ?? -9) / 20);
  const w = (v) => { const a = v.t - 0.15, b = v.t + v.len + 0.25; return `clip((t-${(a - 0.25).toFixed(3)})/0.25\\,0\\,1)*clip((${(b + 0.25).toFixed(3)}-t)/0.25\\,0\\,1)`; };
  const duckExpr = vo.length ? `volume='1-${(1 - duckG).toFixed(4)}*${vo.map(w).reduce((acc, x) => (acc ? `max(${acc}\\,${x})` : x), '')}':eval=frame` : null;
  if (A.mode === 'premix' && A.premix) { if (!add(mediaFile(dir, A.premix), `${db(A.premixGain)}`)) missing.push(A.premix); }
  else if (A.mode === 'layers') {
    const m = A.music;
    if (m?.src) {
      const f = mediaFile(dir, m.src); const segs = m.edit?.length ? m.edit : [[0, T + 5, 0]];
      if (!f || !fs.existsSync(f)) missing.push(m.src);
      else {
        // music segments → one music bus (edits with crossfades), then gain · end fade · ducking
        const segL = []; let at = 0;
        segs.forEach(([a, b, xf = 0.02], i) => {
          const pre = i === 0 ? 0 : (xf || 0); const len = b - a; const startS = i === 0 ? 0 : at - pre;
          const nextXf = segs[i + 1]?.[2] ?? 0; const dur = len + pre;
          let c = `atrim=start=${Math.max(0, a - pre).toFixed(3)}:duration=${dur.toFixed(3)},asetpts=PTS-STARTPTS`;
          if (pre) c += `,afade=t=in:d=${pre.toFixed(3)}`;
          if (i < segs.length - 1 && nextXf) c += `,afade=t=out:st=${Math.max(0, dur - nextXf).toFixed(3)}:d=${nextXf.toFixed(3)}`;
          c += ',' + delay(startS);
          const i2 = inputs.push(f) - 1; chains.push(`[${i2}:a]aresample=${SR},aformat=channel_layouts=stereo,${c}[m${i}]`); segL.push(`[m${i}]`);
          at += len;
        });
        const fo = m.fadeOut ?? 2.5;
        chains.push(`${segL.join('')}${segL.length > 1 ? `amix=inputs=${segL.length}:normalize=0:dropout_transition=0,` : ''}${db(m.gain ?? -3)},afade=t=out:st=${Math.max(0, T - fo).toFixed(3)}:d=${fo.toFixed(3)}${duckExpr ? ',' + duckExpr : ''}[mus]`);
        labels.push('[mus]');
      }
    }
    for (const c of A.cues || []) {
      const f = c.src ? mediaFile(dir, c.src) : path.join(dir, 'public', '_engine', 'sfx', `${c.sfx}.wav`);
      const ff = f && fs.existsSync(f) ? f : path.join(ENGINE, 'public', 'sfx', `${c.sfx}.wav`);
      if (!add(c.src ? f : ff, `atrim=duration=${Math.max(4, (+c.len || 0) + 0.5).toFixed(3)},${db(c.gain ?? -10)},${delay(+c.t)}`)) missing.push(c.src || c.sfx);
    }
    for (const v of A.voice || []) if (!add(mediaFile(dir, v.src), `atrim=duration=${((+v.len || 8) + 0.5).toFixed(3)},${db(v.gain ?? 0)},${delay(+v.t)}`)) missing.push(v.src);
  }
  for (const c of heard) { // footage sound: source range, speed, fades, volume
    const len = clipLen(c); const sp = +c.speed || 1;
    let ch = `atrim=start=${(+c.in || 0).toFixed(3)}:end=${(+c.out || 0).toFixed(3)},asetpts=PTS-STARTPTS`;
    if (sp !== 1) ch += `,atempo=${Math.min(2, Math.max(0.5, sp))}`;
    if (c.fadeIn) ch += `,afade=t=in:d=${(+c.fadeIn).toFixed(3)}`;
    if (c.fadeOut) ch += `,afade=t=out:st=${Math.max(0, len - c.fadeOut).toFixed(3)}:d=${(+c.fadeOut).toFixed(3)}`;
    if (!add(path.join(dir, c.src), `${ch},${db(c.volume ?? 0)},${delay(+c.at || 0)}`)) missing.push(c.src);
  }
  if (!labels.length) return {none: true, missing};
  const graph = [...chains, `${labels.join('')}${labels.length > 1 ? `amix=inputs=${labels.length}:normalize=0:dropout_transition=0,` : ''}apad=whole_dur=${T.toFixed(3)},atrim=duration=${T.toFixed(3)}[out]`].join(';');
  const args = ['-hide_banner', '-v', 'error', '-y', ...inputs.flatMap((f) => ['-i', f]), '-filter_complex', graph, '-map', '[out]', '-ar', String(SR), '-c:a', 'pcm_s16le', out];
  return {args, inputs, graph, missing};
};

/**
 * the export job (called by render.mjs when opts.engine === 'native'). j: render job (stage/progress/child/status), o = j.opts.
 * Same output naming, loudness normalisation and encoder report as the Remotion path.
 */
export const runNative = async (j, project, {emit, scale = 1, gpu = false, workers = 2}) => {
  const o = j.opts; const fps = +o.fps || 30; const ratio = o.ratio;
  const chk = support(project, {ratio, codec: o.codec, res: o.res, scope: o.scope}); if (!chk.ok) throw new Error('Không xuất thuần được:\n• ' + chk.reasons.join('\n• '));
  const hf = project.scenes.filter((s) => s.engine !== 'blank');
  const clips = {};
  for (const [k, s] of hf.entries()) {
    if (j.status === 'cancelled') return;
    j.stage = `Cảnh HTML ${s.id} ${k + 1}/${hf.length}`; j.progress = 0.02 + 0.5 * k / hf.length; emit();
    clips[s.id] = (await ensureClip(o.dir, project, s, {ratio, fps, scale, gpu, workers, onChild: (c) => { j.child = c; }, onProgress: (q) => { j.stage = `Cảnh HTML ${s.id} ${k + 1}/${hf.length} · ${Math.round(q * 100)}%`; j.progress = 0.02 + 0.5 * (k + q) / hf.length; emit(); }})).rel;
  }
  const T = T_OF(project);
  const outDir = path.join(o.dir, 'out'); fs.mkdirSync(outDir, {recursive: true});
  const prores = o.codec === 'prores'; const ext = prores ? 'mov' : 'mp4';
  if (!j.out) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 13).replace('T', '_');
    const safe = (o.name || project.name || 'video').replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 60);
    j.out = path.join(outDir, `${safe}_${ratio.replace(':', 'x')}_${o.res}_${fps}fps_hf_${stamp}.${ext}`);
  }
  const work = cacheDir('native', crypto.createHash('sha1').update(j.out).digest('hex').slice(0, 10));
  // picture
  const {dir: sd} = stageFilm(o.dir, project, {ratio, fps, clips, titles: o.titles !== false, subtitles: o.subtitles !== false});
  const pic = path.join(work, 'picture.' + ext);
  j.stage = 'Ghép phim (Hyperframes)'; j.progress = 0.55; emit();
  const args = ['render', sd, '-o', pic, '--fps', String(fps), '-q', 'delivery', '-w', String(workers), '--quiet', '--format', prores ? 'mov' : 'mp4'];
  if (scale === 2 && {'16:9': 1, '9:16': 1, '1:1': 1}[ratio]) args.push('--resolution', {'16:9': 'landscape-4k', '9:16': 'portrait-4k', '1:1': 'square-4k'}[ratio]);
  if (gpu && !prores) args.push('--gpu');
  else if (!prores && o.crf) args.push('--crf', String(o.crf)); // NVENC uses its own rate control
  let r = await runHf(args, {onChild: (c) => { j.child = c; }, onLine: (l) => { const m = l.match(/(\d{1,3}(?:\.\d+)?)\s*%/); if (m) { j.progress = 0.55 + 0.35 * Math.min(1, +m[1] / 100); j.stage = `Ghép phim (Hyperframes) ${Math.round(+m[1])}%`; emit(); } }});
  if (r.code !== 0 && gpu && /nvenc|gpu|encoder/i.test(r.log)) r = await runHf(args.filter((a) => a !== '--gpu'), {onChild: (c) => { j.child = c; }});
  if (j.status === 'cancelled') return;
  if (r.code !== 0 || !fs.existsSync(pic)) throw new Error('Hyperframes ghép phim lỗi:\n' + r.log.slice(-1500));
  // sound
  let snd = null;
  if (o.audio !== false) {
    const wav = path.join(work, 'mix.wav'); const plan = audioPlan(o.dir, project, {out: wav});
    if (plan.missing?.length) j.note = 'Thiếu file âm thanh: ' + plan.missing.slice(0, 4).join(', ');
    if (!plan.none) {
      j.stage = 'Trộn âm thanh (ffmpeg)'; j.progress = 0.92; emit();
      const a = await ffAsync(plan.args); if (a.code !== 0) throw new Error('Trộn âm thanh lỗi: ' + String(a.stderr).slice(-800));
      snd = wav;
      const lufs = o.loudness ?? -14;
      if (lufs !== 'off' && isFinite(+lufs)) { const norm = path.join(work, 'mix_norm.wav'); const n = await normalizeLoudness(wav, norm, +lufs); if (!n.skipped) { snd = norm; j.loudNote = `Âm lượng ${n.from.toFixed(1)} → ${n.to.toFixed(1)} LUFS`; } }
    }
  }
  j.stage = 'Ghép hình + tiếng'; j.progress = 0.97; emit();
  const mux = ['-hide_banner', '-v', 'error', '-y', '-i', pic];
  if (snd) mux.push('-i', snd, '-map', '0:v:0', '-map', '1:a:0', '-c:a', prores ? 'pcm_s16le' : 'aac', ...(prores ? [] : ['-b:a', '320k'])); else mux.push('-map', '0:v:0');
  mux.push('-c:v', 'copy', '-t', T.toFixed(3), ...(prores ? [] : ['-movflags', '+faststart']), j.out);
  const m2 = await ffAsync(mux); if (m2.code !== 0) throw new Error('Ghép hình + tiếng lỗi: ' + String(m2.stderr).slice(-800));
  const real = await probeEncoder(j.out).catch(() => null);
  j.encoderReal = real?.encoder || null; j.encoder = 'Hyperframes thuần' + (real?.label ? ' · ' + real.label : '');
  const probe = await fprobeAsync(['-v', 'error', '-count_packets', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', j.out]);
  const got = parseInt(String(probe.stdout)), N = Math.round(T * fps); if (got && Math.abs(got - N) > 2) j.note = `Cảnh báo: video có ${got}/${N} khung`;
  fs.rmSync(work, {recursive: true, force: true});
  j.status = 'done'; j.progress = 1; j.stage = 'Hoàn tất (Hyperframes thuần)'; j.eta = null; if (j.loudNote && !j.note) j.note = j.loudNote;
};

/** QA without exporting a video: snapshot the FILM composition at times (s) with the clips that are ALREADY cached
 *  (a scene without a cached clip shows a placeholder; nothing is rendered) → [png] */
export const filmStills = async (dir, p, {ratio, at = [1], outDir, fps = 30}) => {
  const {clipName, clipPath} = await import('./hf.mjs');
  const clips = {}; for (const s of p.scenes) if (isHf(s)) { const n = clipName(dir, p, s, ratio, fps, 1); if (fs.existsSync(clipPath(dir, n) + '.ok')) clips[s.id] = '_hf/' + n; }
  const {dir: sd} = stageFilm(dir, p, {ratio, fps, clips});
  fs.mkdirSync(outDir, {recursive: true}); const before = new Set(fs.readdirSync(outDir));
  const r = await runHf(['snapshot', sd, '-o', outDir, '--at', at.map((t) => Math.max(0, t).toFixed(3)).join(','), '--no-end', '--describe', 'false']);
  if (r.code !== 0) throw new Error('snapshot phim lỗi:\n' + r.log.slice(-1200));
  return {files: fs.readdirSync(outDir).filter((f) => !before.has(f) && /^frame-\d+-at-.*\.png$/i.test(f)).sort((a, b) => parseInt(a.slice(6)) - parseInt(b.slice(6))).map((f) => path.join(outDir, f)), cached: Object.keys(clips), stage: sd};
};
export {HF_VERSION};
