// Khuôn: parameterised Hyperframes scenes in lib/hf/khuon/<id>/ (khuon.json + scene.html + thumb.jpg).
// Applying a khuôn COPIES scene.html into <project>/hf/<scene>.html (the project stays self-contained; editing a khuôn
// later never changes old videos) and writes copy keys "<scene>_<slot>" with labels for the Chữ tab.
// Đổi khuôn keeps the values of slots with the same name, stashes the others in scene.khuon.stash (switching back
// restores them) and never touches voice, music, SFX or timing.
import fs from 'fs';
import path from 'path';
import {LIB, TEMPLATES} from './paths.mjs';
import {readProject, writeProject} from './project.mjs';

export const KHUON_DIR = path.join(LIB, 'hf', 'khuon');
export const FPB = 15; // frames per beat (30 fps, 120 BPM)
import {styleIds, listStyles} from './styles.mjs';
export const THEMES = ['night', 'paper', 'light']; // built-in; every style pack (lib/hf/styles) is also a theme → themes()
export const themes = () => styleIds();
export {listStyles};
export const GROUPS = {hook: 'Mở đầu (hook)', 'van-de': 'Vấn đề', 'loi-ich': 'Lợi ích', 'so-lieu': 'Số liệu', maps: 'Google Maps', chat: 'Chat', anh: 'Ảnh', menu: 'Thực đơn', 'uu-dai': 'Ưu đãi', 'danh-gia': 'Đánh giá', 'thoi-gian': 'Thời gian', cta: 'Kêu gọi', ket: 'Kết'};

export const listKhuon = () => {
  if (!fs.existsSync(KHUON_DIR)) return [];
  return fs.readdirSync(KHUON_DIR, {withFileTypes: true}).filter((e) => e.isDirectory() && fs.existsSync(path.join(KHUON_DIR, e.name, 'khuon.json')))
    .map((e) => { const k = JSON.parse(fs.readFileSync(path.join(KHUON_DIR, e.name, 'khuon.json'), 'utf8')); return {...k, id: e.name, thumbs: fs.readdirSync(path.join(KHUON_DIR, e.name)).filter((f) => /^thumb.*\.jpg$/.test(f))}; })
    .sort((a, b) => (Object.keys(GROUPS).indexOf(a.group) - Object.keys(GROUPS).indexOf(b.group)) || a.id.localeCompare(b.id));
};
export const getKhuon = (id) => {
  const f = path.join(KHUON_DIR, path.basename(String(id || '')), 'khuon.json');
  if (!fs.existsSync(f)) throw new Error(`Không có khuôn "${id}". Có: ${listKhuon().map((k) => k.id).join(', ')}`);
  return {...JSON.parse(fs.readFileSync(f, 'utf8')), id: path.basename(id)};
};

const sceneNum = (id) => +(String(id).match(/(\d+)$/)?.[1] || 0);
const nextSceneId = (p) => { const S = p.scenes || []; const prefix = (S.at(-1)?.id || 'S00').replace(/\d+$/, '') || 'S'; let n = Math.max(0, ...S.map((s) => sceneNum(s.id))) + 1; let id; do { id = prefix + String(n++).padStart(2, '0'); } while (S.some((s) => s.id === id)); return id; };

/** write the copy entries of khuôn k for scene id; values: {slot: value}; previous values (same slot / stash) win over defaults */
const writeSlots = (p, k, id, values = {}, stash = {}) => {
  p.copy = p.copy || {};
  for (const sl of k.slots) {
    const key = `${id}_${sl.slot}`; const prev = p.copy[key]?.value;
    const v = values[sl.slot] ?? prev ?? stash[sl.slot] ?? sl.default ?? '';
    p.copy[key] = {label: sl.label + (sl.optional ? ' (bỏ trống = ẩn)' : ''), scene: id, value: String(v), ...(sl.hint ? {hint: sl.hint} : {}), ...(sl.type && sl.type !== 'text' ? {type: sl.type} : {})};
  }
};

/** SFX cues of a khuôn placed at the scene's beats → [{t, sfx, gain, label}] */
export const khuonCues = (k, scene) => (k.sfx || []).map((c) => ({t: +((scene.start + c.beat * FPB) / 30).toFixed(3), sfx: c.sfx, gain: c.gain ?? -16, label: `${scene.id} ${c.label || k.id}`}));

/**
 * apply a khuôn to a project object (in memory) and copy its HTML into dir/hf.
 *   {khuon, scene}  → replace scene <scene> (Đổi khuôn)        {khuon, after}  → insert after scene <after>
 *   {khuon}         → append at the end                          values, theme, beats, cues (add SFX cues, default true for new scenes)
 */
export const applyKhuon = (dir, p, {khuon, scene = null, after = null, values = {}, theme = null, beats = null, cues = null, label = null}) => {
  const k = getKhuon(khuon);
  const html = fs.readFileSync(path.join(KHUON_DIR, k.id, 'scene.html'), 'utf8');
  p.scenes = p.scenes || [];
  let s;
  if (scene) {
    s = p.scenes.find((x) => x.id === scene); if (!s) throw new Error('Không có cảnh ' + scene);
    // stash values of slots the new khuôn does not have (Đổi khuôn back restores them)
    const stash = {...(s.khuon?.stash || {})};
    for (const key of Object.keys(p.copy || {})) if (p.copy[key]?.scene === s.id || key.startsWith(s.id + '_')) {
      const slot = key.slice(s.id.length + 1);
      if (!k.slots.some((x) => x.slot === slot)) { stash[slot] = p.copy[key].value; delete p.copy[key]; }
    }
    Object.assign(s, {engine: 'hyperframes', src: `hf/${s.id}.html`, khuon: {id: k.id, v: k.version || 1, theme: theme || s.khuon?.theme || null, ...(Object.keys(stash).length ? {stash} : {})}});
    if (label) s.label = label;
    writeSlots(p, k, s.id, values, stash);
    if (cues === true) p.audio = {...(p.audio || {}), cues: [...(p.audio?.cues || []), ...khuonCues(k, s)]};
  } else {
    const len = Math.round((beats || k.beats || 8) * FPB);
    const id = nextSceneId(p);
    const i = after ? p.scenes.findIndex((x) => x.id === after) : p.scenes.length - 1;
    if (after && i < 0) throw new Error('Không có cảnh ' + after);
    const start = i >= 0 ? p.scenes[i].end : 0;
    // shift everything after the insertion point
    const shift = len + (start === 0 ? 1 : 0);
    for (const x of p.scenes.slice(i + 1)) { x.start += shift; x.end += shift; }
    for (const c of p.audio?.cues || []) if (c.t * 30 >= start) c.t = +(c.t + shift / 30).toFixed(3);
    // grid: cuts on 15n+1 frames (first scene 0 → 15n+1, like the templates), so later scenes keep len = beats × 15
    s = {id, label: label || k.name, start, end: start + len + (start === 0 ? 1 : 0), engine: 'hyperframes', src: `hf/${id}.html`, khuon: {id: k.id, v: k.version || 1, theme: theme || null}};
    p.scenes.splice(i + 1, 0, s);
    writeSlots(p, k, id, values);
    if (cues !== false) p.audio = {...(p.audio || {}), cues: [...(p.audio?.cues || []), ...khuonCues(k, s)].sort((a, b) => a.t - b.t)};
  }
  if (!s.khuon.theme) delete s.khuon.theme;
  fs.mkdirSync(path.join(dir, 'hf'), {recursive: true});
  fs.writeFileSync(path.join(dir, 'hf', `${s.id}.html`), html.replace(/data-composition-id="[^"]*"/, `data-composition-id="${s.id}"`));
  return s;
};

/** apply + save (Studio route) */
export const applyKhuonToDir = (dir, opts) => { const p = readProject(dir); const s = applyKhuon(dir, p, opts); writeProject(dir, p); return {scene: s, project: p}; };

// ── whole projects from a list of khuôn (dây chuyền) ─────────────────────
const BASE = () => {
  const p = JSON.parse(fs.readFileSync(path.join(TEMPLATES, 'hf-starter', 'project.json'), 'utf8'));
  return {...p, name: '', client: '', scenes: [], copy: {}, titles: [], audio: {mode: 'layers', music: {src: '', gain: -4, edit: [], fadeOut: 2.5}, cues: []}};
};
/**
 * buildProject(dir, {name, client, formats, theme, brand, look, scenes: [{khuon, values, beats, theme, label}], music})
 * → writes <dir>/project.json, hf/*.html, scenes/index.ts, brief/ (dir must not contain a project.json yet)
 */
export const buildProject = (dir, spec) => {
  if (fs.existsSync(path.join(dir, 'project.json')) && !spec.overwrite) throw new Error('Đã có project.json ở ' + dir + ' (thêm --overwrite để dựng lại)');
  fs.mkdirSync(dir, {recursive: true});
  if (spec.overwrite) fs.rmSync(path.join(dir, 'hf'), {recursive: true, force: true});
  const p = BASE();
  Object.assign(p, {name: spec.name || path.basename(dir), client: spec.client || '', formats: spec.formats?.length ? spec.formats : ['9:16'], engine: 'hyperframes'});
  p.brand = spec.brand || {}; p.look = {...p.look, ...(spec.look || {}), theme: spec.theme || spec.look?.theme || 'night'};
  for (const sc of spec.scenes) applyKhuon(dir, p, {khuon: sc.khuon, values: sc.values || {}, beats: sc.beats, theme: sc.theme, label: sc.label});
  if (spec.music) p.audio.music = {...p.audio.music, src: spec.music};
  if (spec.voice) p.audio.voice = spec.voice;
  fs.mkdirSync(path.join(dir, 'scenes'), {recursive: true});
  fs.writeFileSync(path.join(dir, 'scenes', 'index.ts'), '// Dự án dựng từ khuôn (cảnh Hyperframes hf/*.html). Cảnh Remotion (.tsx), nếu thêm, đăng ký ở đây.\nexport const REG: Record<string, React.FC> = {};\n');
  writeProject(dir, p);
  return p;
};
