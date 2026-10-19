#!/usr/bin/env node
// Dựng bản ngôn ngữ / bản chữ khác của mẫu từ cùng code cảnh: node tools/build-lang.mjs vi   (hoặc vi-story)
//   lang/<tên>.json → ../<template.id>/ (vd templates/sami-agency-intro-vi/): chép hf/, public/, tools/, scenes/,
//   thay chữ trong project.json (copy), đặt <html lang="…"> cho mọi cảnh (dấu tiếng Việt cần giãn dòng), ghi template.json + README.
// Tuỳ chọn trong lang/<tên>.json (bản chữ dài, kể chuyện):
//   "addCopy": {"S01_story": {"label": "…", "value": "…"}}   ô chữ mới (vd dòng dẫn chuyện .story), chèn sau các ô cùng cảnh
//   "holds":   {"S01": [[7.4, 3]]}   từ nhịp 7.4 của S01, mọi mốc lùi 3 nhịp (giữ hình cho kịp đọc); cảnh dài thêm 3 × 15 khung,
//              cảnh sau, cue âm thanh, khung bìa dời theo. Nhạc phải dựng lại theo mốc mới (lệnh in ra ở cuối).
//   "css":     {"*": "…", "S01": "…"}  CSS riêng của bản này, chèn vào cuối <head> của cảnh ("*" = mọi cảnh)
//   "formats": ["9:16"]   chỉ xuất các khung này   ·   "music": "sami-intro-story.mp3" (file ở lang/audio/, chép vào public/audio/)
// ĐỪNG sửa tay thư mục được sinh ra: sửa cảnh ở mẫu gốc hoặc chữ ở lang/<tên>.json rồi chạy lại. Ảnh bìa: cli-template thumbs.
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lang = process.argv[2];
if (!lang) { console.log('Cách dùng: node tools/build-lang.mjs <tên>   (đọc lang/<tên>.json)'); process.exit(1); }
const L = JSON.parse(fs.readFileSync(path.join(src, 'lang', lang + '.json'), 'utf8'));
const out = path.join(path.dirname(src), L.template.id);
if (path.resolve(out) === src) throw new Error('template.id trùng mẫu gốc');
const pj = JSON.parse(fs.readFileSync(path.join(src, 'project.json'), 'utf8'));

// ── kiểm tra trước khi xoá thư mục cũ ──
const miss = Object.keys(L.copy || {}).filter((k) => !pj.copy[k]);
if (miss.length) throw new Error('lang/' + lang + '.json có khoá không tồn tại trong project.json: ' + miss.join(', '));
const dup = Object.keys(L.addCopy || {}).filter((k) => pj.copy[k]);
if (dup.length) throw new Error('addCopy trùng ô chữ đã có: ' + dup.join(', '));
const holds = L.holds || {};
for (const id of Object.keys(holds)) if (!pj.scenes.some((s) => s.id === id)) throw new Error('holds: không có cảnh ' + id);
for (const id of Object.keys(L.css || {})) if (id !== '*' && !pj.scenes.some((s) => s.id === id)) throw new Error('css: không có cảnh ' + id);
const musicSrc = L.music ? path.join(src, 'lang', 'audio', L.music) : null;
if (musicSrc && !fs.existsSync(musicSrc)) console.warn('⚠ chưa có ' + path.relative(src, musicSrc) + ': dựng bằng lệnh nhạc in ở cuối rồi chạy lại.');

// giữ ảnh bìa đã tạo (cli-template thumbs) qua lần dựng lại
const prev = path.join(out, 'preview'), keep = fs.existsSync(prev) ? fs.mkdtempSync(path.join(path.dirname(src), '.preview-')) : null;
if (keep) fs.cpSync(prev, keep, {recursive: true});
fs.rmSync(out, {recursive: true, force: true});
const copyDir = (a, b, skip = () => false) => {
  fs.mkdirSync(b, {recursive: true});
  for (const e of fs.readdirSync(a, {withFileTypes: true})) {
    if (skip(e.name)) continue;
    const s = path.join(a, e.name), d = path.join(b, e.name);
    if (e.isDirectory()) copyDir(s, d, skip); else fs.copyFileSync(s, d);
  }
};
const skipGen = (n) => n.startsWith('_') || n === 'out' || n === 'build-lang.mjs';
for (const sub of ['hf', 'public', 'scenes', 'tools']) if (fs.existsSync(path.join(src, sub))) copyDir(path.join(src, sub), path.join(out, sub), skipGen);
if (keep) { fs.cpSync(keep, prev, {recursive: true}); fs.rmSync(keep, {recursive: true, force: true}); }

// cảnh: <html lang="…"> + CSS riêng của bản
for (const f of fs.readdirSync(path.join(out, 'hf')).filter((x) => x.endsWith('.html'))) {
  const p = path.join(out, 'hf', f), id = f.replace(/\.html$/, '');
  let h = fs.readFileSync(p, 'utf8').replace(/<html[^>]*>/i, `<html lang="${L.lang || lang}">`);
  const css = [L.css?.['*'], L.css?.[id]].filter(Boolean).join('\n');
  if (css) h = h.replace(/<\/head>/i, `<style data-lang="${lang}">\n${css}\n</style>\n</head>`);
  fs.writeFileSync(p, h);
}
// giữ nhịp: ghi vào intro.js (SAMI.beat dời mốc trong cảnh)
if (Object.keys(holds).length) {
  const ip = path.join(out, 'hf', 'parts', 'intro.js'), js = fs.readFileSync(ip, 'utf8');
  if (!js.includes('var HOLDS = {};')) throw new Error('intro.js thiếu dòng "var HOLDS = {};"');
  fs.writeFileSync(ip, js.replace('var HOLDS = {};', 'var HOLDS = ' + JSON.stringify(holds) + ';'));
}

// project.json: chữ
for (const [k, v] of Object.entries(L.copy || {})) pj.copy[k].value = v;
if (L.addCopy) {
  const copy = {}, keys = Object.keys(pj.copy), add = Object.entries(L.addCopy);
  keys.forEach((k, i) => {
    copy[k] = pj.copy[k];
    const pre = k.split('_')[0];
    if (keys[i + 1]?.split('_')[0] !== pre) add.filter(([n]) => n.split('_')[0] === pre).forEach(([n, c]) => { copy[n] = c; });
  });
  add.filter(([n]) => !copy[n]).forEach(([n, c]) => { copy[n] = c; });
  pj.copy = copy;
}
// thời lượng: mỗi nhịp giữ = 15 khung; dời cảnh sau + mốc thời gian
const BEATF = 15;
const old = pj.scenes.map((s) => ({id: s.id, start: s.start, end: s.end}));
const addOf = (id) => (holds[id] || []).reduce((a, h) => a + h[1], 0);
let shift = 0;
for (const s of pj.scenes) { s.start += shift; shift += addOf(s.id) * BEATF; s.end += shift; }
const mapFrame = (f) => {
  let i = old.findIndex((s) => f < s.end); if (i < 0) i = old.length - 1;
  const o = old[i], loc = f - o.start, beat = loc / BEATF;
  const extra = (holds[o.id] || []).reduce((a, h) => a + (beat >= h[0] ? h[1] : 0), 0);
  return pj.scenes[i].start + loc + extra * BEATF;
};
if (shift) for (const c of pj.audio?.cues || []) c.t = +(mapFrame(Math.round(c.t * 30)) / 30).toFixed(2);
if (L.music) { const was = pj.audio.music.src; pj.audio.music.src = 'audio/' + L.music; if (was !== pj.audio.music.src) fs.rmSync(path.join(out, 'public', was), {force: true}); if (musicSrc && fs.existsSync(musicSrc)) fs.copyFileSync(musicSrc, path.join(out, 'public', 'audio', L.music)); }
if (L.formats) pj.formats = L.formats;
if (L.projectName) pj.name = L.projectName;
pj.template = L.template.id;
fs.writeFileSync(path.join(out, 'project.json'), JSON.stringify(pj, null, 1));
// template.json
const tj = JSON.parse(fs.readFileSync(path.join(src, 'template.json'), 'utf8'));
const end = pj.scenes.at(-1).end;
const tOut = {...tj, formats: pj.formats, duration: Math.round(end / 30), ...L.template};
if (shift && tj.thumbFrame != null && L.template.thumbFrame == null) tOut.thumbFrame = mapFrame(tj.thumbFrame);
fs.writeFileSync(path.join(out, 'template.json'), JSON.stringify(tOut, null, 1) + '\n');
// README
const keys = Object.keys(L.copy || {}), added = Object.keys(L.addCopy || {});
const beatsOf = (id) => (pj.scenes.find((s) => s.id === id).start - 1) / BEATF;
const marks = ['S02', 'S03', 'S04', 'S06', 'S08', 'S10', 'S11', 'S12'].map(beatsOf).join(',');
const musicCmd = `python templates/sami-agency-intro/tools/make_music.py out.wav --mp3 templates/sami-agency-intro/lang/audio/${L.music || 'nhac.mp3'} --beats ${(end - 1) / BEATF} --marks ${marks}`;
fs.writeFileSync(path.join(out, 'README.md'), `# ${L.template.name}

> **Sinh tự động** từ \`templates/sami-agency-intro\` + \`lang/${lang}.json\` (\`node templates/sami-agency-intro/tools/build-lang.mjs ${lang}\`). Đừng sửa tay thư mục này: sửa cảnh ở mẫu gốc, sửa chữ ở \`lang/${lang}.json\`, rồi dựng lại.

${L.template.description}

- Cùng 12 cảnh, cùng ảnh thật (SAMI_Library, xem README mẫu gốc mục "Ảnh thật nằm ở thư viện"). ${(end / 30).toFixed(1).replace('.', ',')} giây · khung ${pj.formats.join(', ')}.
- ${keys.length} ô chữ đã đổi; các ô còn lại là chữ trong giao diện khách người Đức thấy (Google Maps, website, đặt bàn, đặt món, menu) nên giữ tiếng Đức.${added.length ? `\n- ${added.length} ô chữ thêm riêng cho bản này: ${added.join(', ')} (dòng dẫn chuyện \`.story\`, để trống = ẩn).` : ''}${shift ? `\n- Giữ nhịp cho kịp đọc (\`holds\`): ${Object.entries(holds).map(([id, h]) => `${id} +${addOf(id)}`).join(' · ')} nhịp. Cue âm thanh và khung bìa đã dời theo.\n- Nhạc riêng \`public/audio/${L.music}\` khớp mốc cảnh mới. Đổi \`holds\` thì dựng lại nhạc:\n  \`${musicCmd}\`` : ''}
- Cảnh đặt \`<html lang="${L.lang || lang}">\` → \`intro.css\` giãn dòng tiêu đề để dấu tiếng Việt không chồng.
- Nhà hàng trong cảnh Branding / Menu là **hư cấu** ("${pj.copy.S04_brand?.value || ''}"), luôn có nhãn "${pj.copy.S04_concept?.value || ''}".
`);
console.log(`✓ ${path.relative(path.dirname(path.dirname(src)), out)} · ${keys.length + added.length} ô chữ · ${(end / 30).toFixed(2)} s`);
if (shift) console.log('  nhạc khớp mốc: ' + musicCmd);
