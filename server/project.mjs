import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {ENGINE, ENGINE_SRC, NODE_MODULES, DATA} from './paths.mjs';

export const readProject = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'project.json'), 'utf8'));
export const writeProject = (dir, p) => {
  const f = path.join(dir, 'project.json');
  if (fs.existsSync(f)) fs.copyFileSync(f, path.join(dir, '.project.backup.json'));
  fs.writeFileSync(f, JSON.stringify(p, null, 1));
};

/** copy engine assets (grain, sfx) into <project>/public/_engine so staticFile('_engine/...') works */
export const syncEngineAssets = (dir) => {
  const src = path.join(ENGINE, 'public');
  const dst = path.join(dir, 'public', '_engine');
  const walk = (s, d) => {
    fs.mkdirSync(d, {recursive: true});
    for (const e of fs.readdirSync(s, {withFileTypes: true})) {
      const a = path.join(s, e.name), b = path.join(d, e.name);
      if (e.isDirectory()) walk(a, b);
      else if (!fs.existsSync(b) || fs.statSync(b).size !== fs.statSync(a).size) fs.copyFileSync(a, b);
    }
  };
  walk(src, dst);
};

/** hash of code files (scenes + engine) AND public media → cache key for bundles.
 *  Remotion's bundle() copies public/ into the bundle, so a media file replaced under the same name must invalidate it
 *  (before 0.4.0 a re-uploaded image/music kept rendering the OLD file). */
export const codeHash = (dir, {media = true} = {}) => {
  const h = crypto.createHash('sha1');
  const walk = (d, all = false) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (!(all && e.name === '_engine')) walk(p, all); }
      else if (all || /\.(tsx?|jsx?|css|json)$/.test(e.name)) { const st = fs.statSync(p); h.update(p + st.mtimeMs + st.size); }
    }
  };
  walk(path.join(dir, 'scenes'));
  if (media) walk(path.join(dir, "public"), true);
  walk(ENGINE_SRC);
  return h.digest('hex').slice(0, 12);
};

/** webpack override for Remotion's bundler: @project / @engine aliases + engine node_modules */
export const webpackOverride = (dir0) => (config) => { const dir = path.resolve(dir0); return {
  ...config,
  resolve: {
    ...config.resolve,
    alias: {...(config.resolve?.alias || {}), '@project': dir, '@engine': ENGINE_SRC},
    modules: [NODE_MODULES, 'node_modules', ...(config.resolve?.modules || [])],
  },
  resolveLoader: {...(config.resolveLoader || {}), modules: [NODE_MODULES, 'node_modules']},
}; };

// bundle cache shared by every Studio process (server, render workers, CLIs) → .studio/bundles.json
const CACHE = path.join(DATA, 'bundles.json');
const readCache = () => { try { return JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch { return {}; } };
/** Remotion (webpack) bundle for rendering, cached by code hash */
export const renderBundle = async (dir0, onProgress) => {
  const dir = path.resolve(dir0);
  const key = dir + ':' + codeHash(dir);
  const c = readCache();
  if (c[key] && fs.existsSync(path.join(c[key], 'index.html'))) { syncEngineAssets(dir); return c[key]; }
  const {bundle} = await import('@remotion/bundler');
  syncEngineAssets(dir);
  const out = await bundle({
    entryPoint: path.join(ENGINE_SRC, 'index.ts'),
    publicDir: path.join(dir, 'public'),
    webpackOverride: webpackOverride(dir),
    onProgress: (p) => onProgress?.(p),
  });
  const c2 = readCache();
  for (const [k, v] of Object.entries(c2)) if (k.startsWith(dir + ':') && v !== out) { try { fs.rmSync(v, {recursive: true, force: true}); } catch {} delete c2[k]; } // drop stale bundles of this project
  c2[key] = out; fs.mkdirSync(DATA, {recursive: true}); fs.writeFileSync(CACHE, JSON.stringify(c2));
  return out;
};
