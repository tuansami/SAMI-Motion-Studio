import fs from 'fs';
import os from 'os';
import path from 'path';
import {fileURLToPath} from 'url';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ENGINE = path.join(ROOT, 'engine');
export const ENGINE_SRC = path.join(ENGINE, 'src');
export const NODE_MODULES = path.join(ROOT, 'node_modules');
export const TEMPLATES = path.join(ROOT, 'templates');
export const DEFAULT_PROJECTS = path.join(ROOT, 'projects');
export const DATA = path.join(ROOT, '.studio');
export const VENDOR = path.join(ROOT, 'vendor');
/** shared CODE versioned with the app (lib/hf runtime, lib/remotion components, lib/py) */
export const LIB = path.join(ROOT, 'lib');

// machine config (.studio/config.json): {libraryRoot, cacheRoot, cacheCapGB} — env vars win
const cfg = (() => { try { return JSON.parse(fs.readFileSync(path.join(DATA, 'config.json'), 'utf8')); } catch { return {}; } })();
export const CONFIG = cfg;
/** shared ASSET library (not in git): music, SFX, images, video, brands — Z:\SAMI_Video\SAMI_Library by default */
export const LIBRARY = path.resolve(process.env.SAMI_LIBRARY || cfg.libraryRoot || path.join(ROOT, '..', 'SAMI_Library'));
/** caches that can always be deleted (bundles, previews, Hyperframes staging, temp) — Z:\SAMI_Video\.sami-cache */
export const CACHE = path.resolve(process.env.SAMI_CACHE || cfg.cacheRoot || path.join(ROOT, '..', '.sami-cache'));
/** per-user secrets + cost ledger (API keys never live in the repo or in projects) */
export const USERDATA = path.join(process.env.APPDATA || path.join(os.homedir(), '.config'), 'SAMI');
export const cacheDir = (...p) => { const d = path.join(CACHE, ...p); fs.mkdirSync(d, {recursive: true}); return d; };
