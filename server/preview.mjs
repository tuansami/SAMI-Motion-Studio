import path from 'path';
import fs from 'fs';
import {ENGINE, ENGINE_SRC, NODE_MODULES, DATA} from './paths.mjs';
import {codeHash} from './project.mjs';

const cache = new Map(); // dir → {hash, outdir, error}
/** esbuild bundle of the Player preview for one project (fast; rebuilt when scene/engine code changes) */
export const previewBundle = async (dir0) => {
  const dir = path.resolve(dir0);
  const hash = codeHash(dir, {media: false}); // preview serves public/ live — only code matters
  const c = cache.get(dir);
  if (c && c.hash === hash) return c;
  const esbuild = await import('esbuild');
  const outdir = path.join(DATA, 'preview', Buffer.from(dir).toString('base64url').slice(-40), hash);
  fs.mkdirSync(outdir, {recursive: true});
  const alias = {
    name: 'studio-alias',
    setup(b) {
      b.onResolve({filter: /^@project\//}, (a) => ({path: resolveTs(path.join(dir, a.path.slice(9)))}));
      b.onResolve({filter: /^@engine\//}, (a) => ({path: resolveTs(path.join(ENGINE_SRC, a.path.slice(8)))}));
    },
  };
  const t0 = Date.now();
  try {
    await esbuild.build({
      entryPoints: [path.join(ENGINE, 'preview', 'entry.tsx')],
      bundle: true, outdir, format: 'iife', platform: 'browser', target: 'es2020',
      jsx: 'automatic', minify: false, sourcemap: false,
      nodePaths: [NODE_MODULES],
      loader: {'.woff2': 'file', '.woff': 'file', '.png': 'file', '.jpg': 'file', '.svg': 'file'},
      assetNames: 'assets/[name]-[hash]',
      define: {'process.env.NODE_ENV': '"production"'},
      plugins: [alias], logLevel: 'silent',
    });
    const r = {hash, outdir, ms: Date.now() - t0, error: null};
    cache.set(dir, r);
    return r;
  } catch (e) {
    const msg = (e.errors || []).map((x) => `${x.location?.file || ''}:${x.location?.line || ''} ${x.text}`).join('\n') || String(e);
    return {hash, outdir, error: msg};
  }
};
const resolveTs = (p) => {
  for (const ext of ['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts']) if (fs.existsSync(p + ext) && fs.statSync(p + ext).isFile()) return p + ext;
  return p;
};
