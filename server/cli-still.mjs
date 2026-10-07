// quick test: node server/cli-still.mjs <projectDir> <out.jpg> <frame[,frame…]> [ratio] [fps] [--copy override.json] [--exact]
//   --copy: JSON {copyKey: "text"} — preview a batch variant (CSV row) without touching project.json
//   frames inside a Hyperframes (HTML) scene use `hyperframes snapshot` (scene only, fast);
//   --exact renders those scenes' clips (cached) and composites titles/overlays like the final export
import fs from 'fs';
import {readProject} from './project.mjs';
import {stills} from './still.mjs';
const args = process.argv.slice(2);
const ci = args.indexOf('--copy'); const over = ci >= 0 ? JSON.parse(fs.readFileSync(args.splice(ci, 2)[1], 'utf8').replace(/^﻿/, '')) : null;
const xi = args.indexOf('--exact'); const exact = xi >= 0; if (exact) args.splice(xi, 1);
const [dir, out, frame = '100', ratio, fps = '30'] = args;
const project = readProject(dir);
if (over) for (const [k, v] of Object.entries(over)) if (project.copy?.[k]) project.copy[k].value = String(v);
const frames = frame.split(',').map(Number);
const files = await stills(dir, frames, (f) => out.replace('.jpg', `_${f}.jpg`), {ratio: ratio || project.formats[0], fps: +fps, project, exact, subtitles: true, onLog: (m) => console.log(m)});
console.log('ok', files.length);
