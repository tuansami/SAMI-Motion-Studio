// quick test: node server/cli-still.mjs <projectDir> <out.jpg> <frame[,frame…]> [ratio] [fps] [--copy override.json]
//   --copy: JSON {copyKey: "text"} — preview a batch variant (CSV row) without touching project.json
import fs from 'fs';
import {renderStill, selectComposition} from '@remotion/renderer';
import {renderBundle, readProject} from './project.mjs';
const args = process.argv.slice(2);
const ci = args.indexOf('--copy'); const over = ci >= 0 ? JSON.parse(fs.readFileSync(args.splice(ci, 2)[1], 'utf8').replace(/^﻿/, '')) : null;
const [dir, out, frame = '100', ratio, fps = '30'] = args;
const project = readProject(dir);
if (over) for (const [k, v] of Object.entries(over)) if (project.copy?.[k]) project.copy[k].value = String(v);
const serveUrl = await renderBundle(dir, (p) => process.stdout.write(`\rbundle ${p}%`));
const inputProps = {project, ratio: ratio || project.formats[0], fps: +fps, titles: true, audio: false};
const opts = {browserExecutable: process.env.REMOTION_BROWSER || null, chromiumOptions: process.env.REMOTION_GL ? {gl: process.env.REMOTION_GL} : {}};
const comp = await selectComposition({serveUrl, id: 'Main', inputProps, ...opts});
console.log('\ncomp', comp.width, comp.height, comp.fps, comp.durationInFrames);
for (const f of frame.split(',')) await renderStill({composition: comp, serveUrl, output: out.replace('.jpg', `_${f}.jpg`), frame: +f, imageFormat: 'jpeg', inputProps, ...opts});
console.log('ok');
