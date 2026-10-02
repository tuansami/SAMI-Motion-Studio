// Builds the Remotion (webpack) bundle in its own process so the Studio server stays responsive.
import {renderBundle} from './project.mjs';
const dir = process.argv[2];
let last = -1;
renderBundle(dir, (p) => { if (p !== last) { last = p; process.send?.({type: 'progress', p}); } })
  .then((out) => { process.send?.({type: 'done', out}); setTimeout(() => process.exit(0), 50); })
  .catch((e) => { process.send?.({type: 'error', message: String(e?.stack || e).slice(0, 3000)}); setTimeout(() => process.exit(1), 50); });
