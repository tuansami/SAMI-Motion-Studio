#!/usr/bin/env node
// Khuôn QA + ảnh xem trước. Dựng một dự án thử (thư mục cache) chứa các khuôn với chữ / ảnh mẫu (khuon.json → slots[].sample),
// chụp ảnh từng cảnh bằng `hyperframes snapshot` rồi ghép lưới để xem.
//   node tools/khuon-thumbs.mjs                         mọi khuôn, theme night, 9:16 + 16:9 → <cache>/khuon-test/…/sheet_*.jpg
//   node tools/khuon-thumbs.mjs --only maps-search,chat-whatsapp --theme paper --ratio 9:16
//   node tools/khuon-thumbs.mjs --apply                 ghi thumb_9x16.jpg / thumb_16x9.jpg vào lib/hf/khuon/<id>/ (theme mặc định của khuôn)
// Không render video: chỉ chụp ảnh tĩnh.
import fs from 'fs';
import path from 'path';
import {spawnSync} from 'child_process';
import {cacheDir} from '../server/paths.mjs';
import {listKhuon, buildProject, FPB, KHUON_DIR} from '../server/khuon.mjs';
import {snapshot, ratioTag} from '../server/hf.mjs';
import {FFMPEG} from '../server/ffmpeg.mjs';

const argv = process.argv.slice(2); const o = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) o[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
const only = o.only ? String(o.only).split(',') : null;
const ratios = o.ratio ? String(o.ratio).split(',') : ['9:16', '16:9'];
const all = listKhuon().filter((k) => !only || only.includes(k.id));
if (!all.length) { console.error('Không có khuôn nào' + (only ? ' khớp ' + only : '')); process.exit(1); }

const runFor = async (theme, list) => {
  const dir = path.join(cacheDir('khuon-test'), theme);
  fs.rmSync(dir, {recursive: true, force: true});
  const p = buildProject(dir, {name: 'Thử khuôn ' + theme, formats: ratios, theme, brand: {},
    scenes: list.map((k) => ({khuon: k.id, values: Object.fromEntries(k.slots.filter((s) => s.sample != null).map((s) => [s.slot, s.sample]))}))});
  const shots = {};
  for (const ratio of ratios) for (const [i, s] of p.scenes.entries()) {
    const k = list[i]; const beats = k.thumbAt || [k.beats - 1];
    const at = beats.map((b) => 8 / 30 + b * FPB / 30);
    const outDir = path.join(dir, 'snap', `${s.id}_${ratioTag(ratio)}`);
    fs.rmSync(outDir, {recursive: true, force: true});
    try { shots[`${k.id}|${ratio}`] = await snapshot(dir, p, s, {ratio, at, outDir}); process.stdout.write('.'); }
    catch (e) { console.log(`\n✗ ${k.id} ${ratio}: ${e.message.split('\n').slice(0, 4).join(' ')}`); }
  }
  console.log('');
  return {dir, shots};
};
const grid = (out, files, cols, w, h) => {
  let f = files.map((_, i) => `[${i}]scale=${w}:${h}:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=0x222222,setsar=1[v${i}]`).join(';');
  f += ';' + files.map((_, i) => `[v${i}]`).join('') + (files.length > 1 ? `xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % cols) * w}_${Math.floor(i / cols) * h}`).join('|')}:fill=0x111111` : 'null');
  const r = spawnSync(FFMPEG, ['-v', 'error', '-y', ...files.flatMap((x) => ['-i', x]), '-filter_complex', f, '-frames:v', '1', '-q:v', '3', out], {encoding: 'utf8'});
  if (r.status) console.log(r.stderr.slice(-400));
};
const thumb = (src, out) => spawnSync(FFMPEG, ['-v', 'error', '-y', '-i', src, '-vf', 'scale=480:-2', '-q:v', '4', out]);

if (o.apply) {
  for (const theme of ['night', 'paper', 'light']) {
    const list = all.filter((k) => (k.themes?.[0] || 'night') === theme); if (!list.length) continue;
    const {shots} = await runFor(theme, list);
    for (const k of list) for (const ratio of ratios) { const s = shots[`${k.id}|${ratio}`]; if (s?.length) thumb(s.at(-1), path.join(KHUON_DIR, k.id, `thumb_${ratioTag(ratio)}.jpg`)); }
  }
  console.log('✓ đã ghi thumb vào lib/hf/khuon/<id>/');
} else {
  const theme = o.theme || 'night';
  const {dir, shots} = await runFor(theme, all);
  for (const ratio of ratios) {
    const files = all.flatMap((k) => shots[`${k.id}|${ratio}`] || []);
    if (!files.length) continue;
    const out = path.join(dir, `sheet_${ratioTag(ratio)}.jpg`);
    grid(out, files, ratio === '9:16' ? 8 : 4, ratio === '9:16' ? 240 : 480, ratio === '9:16' ? 426 : 270);
    console.log(out);
  }
}
