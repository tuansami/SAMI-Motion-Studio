// quick test: node server/cli-still.mjs <projectDir> <out.jpg> <frame> [ratio] [fps]
import {renderStill, selectComposition} from '@remotion/renderer';
import {renderBundle, readProject} from './project.mjs';
const [dir, out, frame = '100', ratio, fps = '30'] = process.argv.slice(2);
const project = readProject(dir);
const serveUrl = await renderBundle(dir, (p) => process.stdout.write(`\rbundle ${p}%`));
const inputProps = {project, ratio: ratio || project.formats[0], fps: +fps, titles: true, audio: false};
const opts = {browserExecutable: process.env.REMOTION_BROWSER || null, chromiumOptions: process.env.REMOTION_GL ? {gl: process.env.REMOTION_GL} : {}};
const comp = await selectComposition({serveUrl, id: 'Main', inputProps, ...opts});
console.log('\ncomp', comp.width, comp.height, comp.fps, comp.durationInFrames);
for (const f of frame.split(',')) await renderStill({composition: comp, serveUrl, output: out.replace('.jpg', `_${f}.jpg`), frame: +f, imageFormat: 'jpeg', inputProps, ...opts});
console.log('ok');
