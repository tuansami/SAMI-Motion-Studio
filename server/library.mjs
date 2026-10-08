// SAMI_Library — shared assets for every project (music, SFX, voice, images, video, Lottie, fonts, LUTs, masks, brands).
//   <LIBRARY>/assets/<kind>/<slug>.<ext> + <slug>.<ext>.meta.json   (meta: licence, source, prompt, tags, bpm, lufs…)
//   <LIBRARY>/brands/<client>/brand.json
//   <LIBRARY>/index.json  (generated: rebuildIndex())
// Index, search and meta live in the sami-media package (one copy of the code, shared with its MCP server and CLI);
// this module adds the Studio's project side.
// Projects reference library files as  lib:<kind>/<file.ext>  (e.g. lib:sfx/whoosh-soft.mp3).
// materialize() hardlinks every referenced file into <project>/public/_lib/<kind>/<file> → staticFile('_lib/…') works in
// preview AND render, offline, with 0 extra bytes on the same drive.
import fs from 'fs';
import path from 'path';
import {LIBRARY} from './paths.mjs';
import {linkOrCopy} from './fslink.mjs';
import {ASSETS, resolveLib} from 'sami-media/library';

export {KINDS, ASSETS, ensureLibrary, resolveLib, isLib, metaPath, writeMeta, sha256, rebuildIndex, readIndex, search} from 'sami-media/library';
export const LIB_RE = /lib:((?:sfx|music|voice|img|video|lottie|fonts|luts|masks)\/[^\s'"`)<>?#]+?\.[a-z0-9]{2,5})(?=$|[\s'"`)<>?#])/gi;
if (path.resolve(ASSETS) !== path.join(LIBRARY, 'assets')) throw new Error(`sami-media dùng thư viện khác Studio: ${ASSETS} ≠ ${path.join(LIBRARY, 'assets')}`);

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

// ── brands ───────────────────────────────────────────────────────────
export const listBrands = () => { const d = path.join(LIBRARY, 'brands'); return fs.existsSync(d) ? fs.readdirSync(d).filter((b) => fs.existsSync(path.join(d, b, 'brand.json'))) : []; };
export const readBrand = (id) => { try { return JSON.parse(fs.readFileSync(path.join(LIBRARY, 'brands', id, 'brand.json'), 'utf8')); } catch { return null; } };
