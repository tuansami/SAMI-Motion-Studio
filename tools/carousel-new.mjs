// Tạo dự án carousel động mới.
//   Chế độ motion (từ chủ đề): chép mẫu templates/carousel-sami rồi sửa slides/*.html + project.json → copy
//     node tools/carousel-new.mjs <thư mục mới> --name "261008-V30-maps-3-hebel-v.1" [--theme sami|cream|tomato|forest|noir] [--handle sami.agency]
//   Chế độ photo (ảnh carousel đã thiết kế xong → mỗi ảnh thành 1 slide động, khung 0 giữ nguyên ảnh gốc):
//     node tools/carousel-new.mjs <thư mục mới> --name "…" --images a.png b.png c.jpg  [--dur 6]
//   Ảnh không phải 4:5 được cắt giữa về 1080×1350. Sau đó: node server/cli-carousel.mjs <thư mục> render
import fs from 'fs';
import path from 'path';
import {ROOT, LIB, TEMPLATES} from '../server/paths.mjs';
import {ffAsync} from '../server/ffmpeg.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const multi = (k) => { const i = argv.indexOf(k); if (i < 0) return []; const out = []; for (let j = i + 1; j < argv.length && !argv[j].startsWith('--'); j++) out.push(argv[j]); return out; };
const dest = path.resolve(argv[0] || '');
if (!argv[0] || argv[0].startsWith('--')) { console.log('Dùng: node tools/carousel-new.mjs <thư mục mới> --name "…" [--images a.png b.png …] [--theme sami] [--handle sami.agency] [--dur 6]'); process.exit(1); }
if (fs.existsSync(dest) && fs.readdirSync(dest).length) { console.error('Thư mục đã có nội dung:', dest); process.exit(1); }
const images = multi('--images');
const name = opt('--name', path.basename(dest));
const theme = opt('--theme', 'sami');
const handle = opt('--handle', 'sami.agency');
const dur = Math.max(2, Math.round((+opt('--dur', 6)) / 2) * 2); // whole 120 BPM bars (2 s)
const skip = (n) => ['out', 'preview', 'template.json', 'README.md', '.claude', 'public/_engine'].includes(n);
const copyDir = (s, d) => { fs.mkdirSync(d, {recursive: true}); for (const e of fs.readdirSync(s, {withFileTypes: true})) { if (skip(e.name)) continue; const a = path.join(s, e.name), b = path.join(d, e.name); e.isDirectory() ? copyDir(a, b) : fs.copyFileSync(a, b); } };

if (!images.length) {
  copyDir(path.join(TEMPLATES, 'carousel-sami'), dest);
  const pj = JSON.parse(fs.readFileSync(path.join(dest, 'project.json'), 'utf8'));
  pj.name = name; pj.carousel = {...pj.carousel, theme, handle};
  fs.writeFileSync(path.join(dest, 'project.json'), JSON.stringify(pj, null, 1));
  console.log(`Đã tạo carousel motion (5 slide mẫu) → ${dest}\nSửa: slides/*.html (bố cục, chuyển động), project.json → copy (chữ), scenes[].cues (SFX).`);
} else {
  fs.mkdirSync(path.join(dest, 'slides'), {recursive: true}); fs.mkdirSync(path.join(dest, 'public', 'img'), {recursive: true}); fs.mkdirSync(path.join(dest, 'brief'), {recursive: true});
  fs.copyFileSync(path.join(LIB, 'hf', 'photo-slide.html'), path.join(dest, 'slides', 'photo.html'));
  const scenes = [];
  for (const [i, f] of images.entries()) {
    const id = 'P' + String(i + 1).padStart(2, '0');
    const out = path.join(dest, 'public', 'img', id + '.jpg');
    // centre-crop to 4:5 and scale to 1080×1350 (high quality JPEG)
    const r = await ffAsync(['-hide_banner', '-v', 'error', '-y', '-i', path.resolve(f), '-vf', "crop='if(gt(iw/ih,0.8),ih*0.8,iw)':'if(gt(iw/ih,0.8),ih,iw/0.8)',scale=1080:1350:flags=lanczos", '-q:v', '2', out]);
    if (r.code !== 0) { console.error('Không đọc được ảnh', f, r.stderr.slice(-300)); process.exit(1); }
    scenes.push({id, label: `Slide ${i + 1} (ảnh ${path.basename(f)})`, start: i * dur * 30, end: (i + 1) * dur * 30, engine: 'hyperframes', src: 'slides/photo.html',
      photo: {img: `img/${id}.jpg`, hit: 2.0, push: 0.035, shine: true, motes: 14, kick: true, focus: [0.5, 0.45]},
      cues: [{t: 2.0, fx: i === images.length - 1 ? 'impact' : 'boop', gain: i === images.length - 1 ? -6 : -10, pitch: 1 + i * 0.12}, {t: 2.0, fx: 'sparkle', gain: -14}]});
  }
  const pj = {name, client: '', version: 1, schemaVersion: 2, type: 'carousel', engine: 'hyperframes', formats: ['4:5'], brand: {}, look: {grain: 0.03, vignette: 0},
    carousel: {series: '', handle, caption: '', theme, swipe: 'Swipe', audio: {mode: 'groove', groove: {intensity: 0.6, style: 'soft'}}},
    scenes, copy: {}, titles: [], overlays: [], subtitles: {enabled: false, items: [], anim: 'karaoke'}, audio: {mode: 'none'}};
  fs.writeFileSync(path.join(dest, 'project.json'), JSON.stringify(pj, null, 1));
  console.log(`Đã tạo carousel từ ${images.length} ảnh → ${dest}\nChỉnh từng slide trong project.json → scenes[].photo (hit, push, shine, motes, focus) và cues (SFX).`);
}
fs.mkdirSync(path.join(dest, 'brief'), {recursive: true});
if (!fs.existsSync(path.join(dest, 'brief', 'TRANG_THAI.md'))) fs.writeFileSync(path.join(dest, 'brief', 'TRANG_THAI.md'), `# TRẠNG THÁI — ${name}\nCập nhật: ${new Date().toISOString().slice(0, 10)}\n\n## Giai đoạn\nBrief ▢ · Storyboard ⛔ ▢ · Dựng slide ▢ · QA ▢ · Khách duyệt ⛔ ▢ · Xong ▢\n\n## Đã chốt\n- Loại: carousel động 4:5, ${images.length ? 'chế độ ảnh' : 'chế độ motion'}\n\n## Việc tiếp theo\n- [ ] \n`);
console.log('Kiểm tra: node "' + path.join(ROOT, 'server', 'cli-validate.mjs') + '" "' + dest + '"');
