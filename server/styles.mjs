// Studio 1.2 — Phong cách (style packs): one folder = one look that every khuôn and every HTML scene can wear.
//   lib/hf/styles/<id>/style.json   {name, description, base: night|paper|light, fonts: {head, ui, hand, mono}, palette, motion, sfx, tags}
//   lib/hf/styles/<id>/style.css    [data-theme="<id>"] { --k-… tokens } + component overrides (.k-card, .k-stage::after …)
//   lib/hf/styles/<id>/style.js     (optional) motion vocabulary on window.SAMI.style, e.g. a jitter or a stamp
//   lib/hf/styles/<id>/assets/      (optional) textures, paper scans, grain (licensed for reuse)
// A scene picks it with scene.khuon.theme = "<id>" or project.look.theme = "<id>". "base" tells the khuôn which of the
// three built-in layouts to follow (paper = cut-out / polaroid look, night = dark glass, light = clean) when the khuôn
// branches on the theme. New style: node tools/style-new.mjs <id> --name "…" --base paper.
import fs from 'fs';
import path from 'path';
import {LIB} from './paths.mjs';

export const STYLES_DIR = path.join(LIB, 'hf', 'styles');
export const BUILTIN = {
  night: {name: 'Đêm (navy SAMI)', base: 'night', description: 'Nền navy, kính mờ, gradient mint → tím.', builtin: true},
  paper: {name: 'Giấy kraft', base: 'paper', description: 'Giấy kraft, polaroid, băng dính, chữ cắt dán (kiểu video Maps cuối năm).', builtin: true},
  light: {name: 'Sáng', base: 'light', description: 'Nền sáng, thẻ trắng, gọn (kiểu video One Conversation).', builtin: true},
};
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };

/** every style: built-in themes first, then lib/hf/styles/* (folders with style.json) */
export const listStyles = () => {
  const out = Object.entries(BUILTIN).map(([id, s]) => ({id, ...s}));
  if (fs.existsSync(STYLES_DIR)) for (const e of fs.readdirSync(STYLES_DIR, {withFileTypes: true})) {
    if (!e.isDirectory() || BUILTIN[e.name]) continue;
    const j = readJson(path.join(STYLES_DIR, e.name, 'style.json')); if (!j) continue;
    out.push({id: e.name, ...j, base: BUILTIN[j.base] ? j.base : 'night', css: fs.existsSync(path.join(STYLES_DIR, e.name, 'style.css')), js: fs.existsSync(path.join(STYLES_DIR, e.name, 'style.js')),
      thumb: fs.existsSync(path.join(STYLES_DIR, e.name, 'thumb.jpg'))});
  }
  return out;
};
export const styleIds = () => listStyles().map((s) => s.id);
export const getStyle = (id) => listStyles().find((s) => s.id === id) || null;

/** data a scene sees as window.SAMI.style */
export const styleData = (id) => { const s = getStyle(id) || getStyle('night'); return {id: s.id, base: s.base, name: s.name, palette: s.palette || {}, motion: s.motion || {}, fonts: s.fonts || {}}; };

/** <head> tags for a custom style (fonts from @fontsource, style.css, style.js); built-in themes need nothing */
export const styleHead = (id) => {
  const s = getStyle(id); if (!s || s.builtin) return '';
  let out = '';
  for (const f of new Set(Object.values(s.fonts || {}).map((v) => String(v).split(',')[0].replace(/["']/g, '').trim().toLowerCase().replace(/\s+/g, '-')).filter(Boolean)))
    for (const w of s.fontWeights || [400, 700, 800]) out += `<link rel="stylesheet" href="_fonts/${f}/${w}.css">`;
  if (s.css) out += `<link rel="stylesheet" href="_sami/styles/${id}/style.css">`;
  if (s.js) out += `<script src="_sami/styles/${id}/style.js"></script>`;
  return out;
};
