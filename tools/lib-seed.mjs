// Nạp thư viện dùng chung SAMI_Library lần đầu từ những gì đã có trên máy (không tải gì từ Internet).
//   node tools/lib-seed.mjs            → chạy thử, chỉ in kế hoạch
//   node tools/lib-seed.mjs --apply    → hardlink file vào SAMI_Library/assets/<kind>/ + ghi .meta.json + index.json
// Nguồn: engine/public/sfx (SAMI tự tạo) · Z:\SAMI_Video\_series_2610_DE20\library\sfx (ElevenLabs, có prompt).
// Hardlink: thư viện và nơi cũ dùng chung một file trên ổ Z → không tốn thêm dung lượng.
import fs from 'fs';
import path from 'path';
import {ROOT, LIBRARY} from '../server/paths.mjs';
import {ASSETS, ensureLibrary, rebuildIndex, writeMeta, metaPath, sha256} from '../server/library.mjs';
import {linkOrCopy} from '../server/fslink.mjs';
import {durationAsync} from '../server/ffmpeg.mjs';

const APPLY = process.argv.includes('--apply');
const SERIES = path.resolve(ROOT, '..', '_series_2610_DE20', 'library', 'sfx');
const plan = [];

// 1 · engine SFX (procedural, SAMI)
const eng = path.join(ROOT, 'engine', 'public', 'sfx');
for (const f of fs.existsSync(eng) ? fs.readdirSync(eng) : []) if (/\.(wav|mp3)$/i.test(f)) plan.push({src: path.join(eng, f), kind: 'sfx', file: 'engine/' + f,
  meta: {title: f.replace(/\.\w+$/, '').replace(/_/g, ' '), tags: ['engine', 'ui'], licence: {type: 'sami-internal', commercial: true, note: 'SFX gốc của SAMI Motion Studio'}, source: {provider: 'sami-engine'}}});

// 2 · series SFX (ElevenLabs sound effects, prompts in _index_*.json)
if (fs.existsSync(SERIES)) {
  const prompts = {};
  for (const ix of fs.readdirSync(SERIES).filter((f) => /^_index_.*\.json$/.test(f))) {
    try { for (const it of JSON.parse(fs.readFileSync(path.join(SERIES, ix), 'utf8'))) prompts[it.file || it.name + '.mp3'] = it; } catch {}
  }
  for (const f of fs.readdirSync(SERIES)) {
    if (!/\.(mp3|wav)$/i.test(f)) continue;
    const it = prompts[f] || {};
    const words = f.replace(/\.\w+$/, '').split('_');
    plan.push({src: path.join(SERIES, f), kind: 'sfx', file: 'eleven/' + f, meta: {
      title: words.join(' '), tags: ['elevenlabs', ...words.filter((w) => w.length > 2)],
      licence: {type: 'elevenlabs-generated', commercial: null, note: 'Tạo bằng ElevenLabs (series 2610). Kiểm gói ElevenLabs lúc tạo (free = không dùng thương mại) trước khi chạy quảng cáo.'},
      source: {provider: 'elevenlabs', model: 'sound-effects', prompt: it.prompt || null, series: '2610-DE20'}}});
  }
}

console.log(`${APPLY ? 'NẠP' : 'CHẠY THỬ'} → ${LIBRARY}`);
let n = 0;
if (APPLY) ensureLibrary();
for (const p of plan) {
  const dst = path.join(ASSETS, p.kind, p.file);
  if (!APPLY) { console.log(`  ${p.kind}/${p.file}  ←  ${path.relative(path.resolve(ROOT, '..'), p.src)}`); continue; }
  linkOrCopy(p.src, dst);
  if (!fs.existsSync(metaPath(dst))) {
    const duration = await durationAsync(dst).catch(() => null);
    writeMeta(dst, {id: `${p.kind}/${p.file}`, ...p.meta, duration: isFinite(duration) ? +duration.toFixed(3) : null, sha256: sha256(dst), added: new Date().toISOString()});
  }
  n++;
}
if (APPLY) { const idx = rebuildIndex(); console.log(`Xong: ${n} file · thư viện có ${idx.count} mục · ${path.join(LIBRARY, 'index.json')}`); }
else console.log(`\n${plan.length} file sẽ được nạp. Thêm --apply để làm thật.`);
