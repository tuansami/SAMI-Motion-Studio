// SAMI_Library — shared assets for every project (music, SFX, voice, images, video, Lottie, fonts, LUTs, masks, brands).
//   <LIBRARY>/assets/<kind>/<slug>.<ext> + <slug>.<ext>.meta.json   (meta: licence, source, prompt, tags, bpm, lufs…)
//   <LIBRARY>/brands/<client>/brand.json
//   <LIBRARY>/index.json  (generated: rebuildIndex())
// Projects reference library files as  lib:<kind>/<file.ext>  (e.g. lib:sfx/whoosh-soft.mp3).
// materialize() hardlinks every referenced file into <project>/public/_lib/<kind>/<file> → staticFile('_lib/…') works in
// preview AND render, offline, with 0 extra bytes on the same drive.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {LIBRARY} from './paths.mjs';
import {linkOrCopy} from './fslink.mjs';

export const KINDS = ['sfx', 'music', 'voice', 'img', 'video', 'lottie', 'fonts', 'luts', 'masks'];
export const ASSETS = path.join(LIBRARY, 'assets');
export const LIB_RE = /lib:((?:sfx|music|voice|img|video|lottie|fonts|luts|masks)\/[^\s'"`)<>?#]+?\.[a-z0-9]{2,5})(?=$|[\s'"`)<>?#])/gi;

export const ensureLibrary = () => { for (const k of KINDS) fs.mkdirSync(path.join(ASSETS, k), {recursive: true}); fs.mkdirSync(path.join(LIBRARY, 'brands'), {recursive: true}); };
/** 'lib:sfx/a.mp3' → absolute path (or null if not a lib URI / escapes the library) */
export const resolveLib = (uri) => {
  if (typeof uri !== 'string' || !uri.startsWith('lib:')) return null;
  const f = path.resolve(ASSETS, uri.slice(4));
  return f.startsWith(path.resolve(ASSETS) + path.sep) ? f : null;
};
export const isLib = (s) => typeof s === 'string' && s.startsWith('lib:');
/** project-relative public path used by the engine for a lib URI */
export const libPublic = (uri) => '_lib/' + uri.slice(4);

/** every lib: URI referenced by a project (project.json + scenes/*.tsx + hf/*.html|css|js) */
export const libRefs = (dir) => {
  const out = new Set();
  const scan = (t) => { for (const m of String(t).matchAll(LIB_RE)) out.add('lib:' + m[1]); };
  try { scan(fs.readFileSync(path.join(dir, 'project.json'), 'utf8')); } catch {}
  const walk = (d) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, {withFileTypes: true})) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(tsx?|jsx?|html?|css|json)$/i.test(e.name)) scan(fs.readFileSync(p, 'utf8')); } };
  walk(path.join(dir, 'scenes')); walk(path.join(dir, 'hf')); walk(path.join(dir, 'slides'));
  return [...out];
};

/** hardlink referenced library files into public/_lib → {linked, missing[]} */
export const materialize = (dir) => {
  const refs = libRefs(dir); const missing = []; let linked = 0;
  for (const r of refs) {
    const src = resolveLib(r);
    if (!src || !fs.existsSync(src)) { missing.push(r); continue; }
    linkOrCopy(src, path.join(dir, 'public', libPublic(r))); linked++;
  }
  return {linked, missing, refs};
};

// ── index + search ──────────────────────────────────────────────────
const readMeta = (f) => { try { return JSON.parse(fs.readFileSync(f + '.meta.json', 'utf8')); } catch { return null; } };
export const metaPath = (f) => f + '.meta.json';
export const writeMeta = (f, meta) => fs.writeFileSync(metaPath(f), JSON.stringify(meta, null, 1));
export const sha256 = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

export const rebuildIndex = () => {
  ensureLibrary();
  const items = [];
  for (const kind of KINDS) {
    const d = path.join(ASSETS, kind);
    const walk = (dd, rel = '') => {
      for (const e of fs.readdirSync(dd, {withFileTypes: true})) {
        const p = path.join(dd, e.name), r = rel ? rel + '/' + e.name : e.name;
        if (e.isDirectory()) { walk(p, r); continue; }
        if (e.name.endsWith('.meta.json') || e.name.startsWith('.') || e.name === 'Thumbs.db') continue;
        const m = readMeta(p) || {};
        const st = fs.statSync(p);
        items.push({uri: `lib:${kind}/${r}`, kind, file: r, title: m.title || e.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '), tags: m.tags || [], licence: m.licence || null, source: m.source || null, duration: m.duration ?? null, bpm: m.bpm ?? null, lufs: m.lufs ?? null, w: m.w ?? null, h: m.h ?? null, bytes: st.size, mtime: st.mtimeMs, hasMeta: !!readMeta(p)});
      }
    };
    walk(d);
  }
  const idx = {built: new Date().toISOString(), root: LIBRARY, count: items.length, items};
  fs.writeFileSync(path.join(LIBRARY, 'index.json'), JSON.stringify(idx));
  return idx;
};
let _idx = null, _idxAt = 0;
export const readIndex = () => {
  const f = path.join(LIBRARY, 'index.json');
  try { const st = fs.statSync(f); if (!_idx || st.mtimeMs !== _idxAt) { _idx = JSON.parse(fs.readFileSync(f, 'utf8')); _idxAt = st.mtimeMs; } return _idx; }
  catch { return fs.existsSync(ASSETS) ? rebuildIndex() : {count: 0, items: []}; }
};
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();
/** search({q:'whoosh soft', kind:'sfx', limit:50}) — every word must match title/tags/file/prompt */
export const search = ({q = '', kind = null, limit = 60} = {}) => {
  const words = fold(q).split(/\s+/).filter(Boolean);
  const res = readIndex().items.filter((it) => (!kind || it.kind === kind) && words.every((w) => fold([it.title, it.file, ...(it.tags || []), it.source?.prompt].join(' ')).includes(w)));
  return res.slice(0, limit);
};

// ── brands ───────────────────────────────────────────────────────────
export const listBrands = () => { const d = path.join(LIBRARY, 'brands'); return fs.existsSync(d) ? fs.readdirSync(d).filter((b) => fs.existsSync(path.join(d, b, 'brand.json'))) : []; };
export const readBrand = (id) => { try { return JSON.parse(fs.readFileSync(path.join(LIBRARY, 'brands', id, 'brand.json'), 'utf8')); } catch { return null; } };
