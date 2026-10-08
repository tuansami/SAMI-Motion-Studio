// node server/cli-carousel.mjs <projectDir> [render|audio|stills] [--only C01,C03] [--cpu] [--request "<lời Tuấn>"]
//   render cần công tắc "Cho phép Claude Code xuất video" + --request (giống server/cli-render.mjs). Ưu tiên dùng cli-render.mjs.
//   render (default): every slide → out/carousel/<stamp>/NN-<ID>.mp4 + covers/ + seams/ + contact-sheet.jpg + preview.html + qa.json
//   audio:  only the per-slide seamless mixes → out/carousel/audio/<ID>.wav (listen before rendering)
//   stills: frame 0 (= cover) + mid frame of every slide → out/qa/<ID>_cover.jpg, <ID>_mid.jpg (fast, no render)
import fs from 'fs';
import path from 'path';
import {readProject} from './project.mjs';
import {renderCarousel, slideAudio, isCarousel} from './carousel.mjs';
import {snapshot, sceneSpan} from './hf.mjs';
import {ffAsync} from './ffmpeg.mjs';
const args = process.argv.slice(2);
const flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; };
const only = flag('--only')?.split(',') || null;
const request = flag('--request');
const cpu = args.includes('--cpu');
const [dir0, cmd = 'render'] = args.filter((a) => !a.startsWith('--'));
// render = full video export → same rule as server/cli-render.mjs: Studio switch ON + Tuấn's request quoted
if (cmd === 'render') {
  const {DATA} = await import('./paths.mjs');
  let on = false; try { on = !!JSON.parse(fs.readFileSync(path.join(DATA, 'settings.json'), 'utf8')).allowCliRender; } catch {}
  if (!request || request.trim().length < 4) { console.error('✗ Xuất carousel cần --request "<nguyên văn yêu cầu xuất của Tuấn>". Không có yêu cầu thì KHÔNG xuất (QA dùng: stills / audio).'); process.exit(1); }
  if (!on) { console.error('✗ Studio đang TẮT "Cho phép Claude Code xuất video" (tab Xuất).'); process.exit(1); }
  fs.appendFileSync(path.join(DATA, 'cli-render.log'), JSON.stringify({ts: new Date().toISOString(), action: 'render', via: 'cli-carousel', dir: path.resolve(dir0 || '.'), request, only}) + '\n');
}
const dir = path.resolve(dir0 || '.');
const p = readProject(dir);
if (!isCarousel(p)) { console.error('project.json không phải carousel (type: "carousel")'); process.exit(1); }
const slides = p.scenes.filter((s) => !only || only.includes(s.id));
if (cmd === 'audio') {
  const out = path.join(dir, 'out', 'carousel', 'audio'); fs.mkdirSync(out, {recursive: true});
  for (const s of slides) { const w = await slideAudio(dir, p, s, out); console.log(w ? `${s.id} → ${w}` : `${s.id}: không tiếng (audio.mode none)`); }
} else if (cmd === 'stills') {
  const out = path.join(dir, 'out', 'qa'); const tmp = path.join(out, '.snap');
  for (const s of slides) {
    fs.rmSync(tmp, {recursive: true, force: true});
    const d = sceneSpan(p, s).dur;
    const pngs = await snapshot(dir, p, s, {ratio: '4:5', fps: 30, at: [0, +(d * 0.45).toFixed(2)], outDir: tmp});
    for (const [k, f] of pngs.entries()) { const dst = path.join(out, `${s.id}_${k ? 'mid' : 'cover'}.jpg`); await ffAsync(['-hide_banner', '-v', 'error', '-y', '-i', f, '-q:v', '3', dst]); console.log(dst); }
  }
  fs.rmSync(tmp, {recursive: true, force: true});
} else {
  const r = await renderCarousel(dir, {project: p, only, gpu: !cpu, onStage: (m) => console.log('»', m)});
  for (const s of r.slides) console.log(`${s.n}. ${s.id} ${s.dur}s ${s.size} ${s.audio ? 'tiếng ✓' : 'KHÔNG TIẾNG ✗'} nối vòng ${s.seamPsnr >= 99 ? 'trùng khít' : s.seamPsnr?.toFixed(1) + ' dB'}`);
  console.log('\nThư mục:', r.outDir, '\nXem thử:', r.preview, '\nContact sheet:', r.sheet);
}
