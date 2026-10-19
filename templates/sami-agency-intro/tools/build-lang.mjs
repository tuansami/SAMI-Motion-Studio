#!/usr/bin/env node
// Dựng bản ngôn ngữ khác của mẫu từ cùng code cảnh: node tools/build-lang.mjs vi
//   lang/<lang>.json → ../<template.id>/ (vd templates/sami-agency-intro-vi/): chép hf/, public/, tools/, scenes/,
//   thay chữ trong project.json (copy), đặt <html lang="…"> cho mọi cảnh (dấu tiếng Việt cần giãn dòng), ghi template.json + README.
// ĐỪNG sửa tay thư mục được sinh ra: sửa cảnh ở mẫu gốc hoặc chữ ở lang/<lang>.json rồi chạy lại. Ảnh bìa: cli-template thumbs.
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lang = process.argv[2];
if (!lang) { console.log('Cách dùng: node tools/build-lang.mjs <lang>   (đọc lang/<lang>.json)'); process.exit(1); }
const L = JSON.parse(fs.readFileSync(path.join(src, 'lang', lang + '.json'), 'utf8'));
const out = path.join(path.dirname(src), L.template.id);
if (path.resolve(out) === src) throw new Error('template.id trùng mẫu gốc');

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
// cảnh: <html lang="…">
for (const f of fs.readdirSync(path.join(out, 'hf')).filter((x) => x.endsWith('.html'))) {
  const p = path.join(out, 'hf', f);
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/<html[^>]*>/i, `<html lang="${L.lang || lang}">`));
}
// project.json: thay chữ
const pj = JSON.parse(fs.readFileSync(path.join(src, 'project.json'), 'utf8'));
const miss = [];
for (const [k, v] of Object.entries(L.copy || {})) { if (!pj.copy[k]) { miss.push(k); continue; } pj.copy[k].value = v; }
if (miss.length) throw new Error('lang/' + lang + '.json có khoá không tồn tại trong project.json: ' + miss.join(', '));
if (L.projectName) pj.name = L.projectName;
pj.template = L.template.id;
fs.writeFileSync(path.join(out, 'project.json'), JSON.stringify(pj, null, 1));
// template.json
const tj = JSON.parse(fs.readFileSync(path.join(src, 'template.json'), 'utf8'));
fs.writeFileSync(path.join(out, 'template.json'), JSON.stringify({...tj, ...L.template}, null, 1) + '\n');
// README
const keys = Object.keys(L.copy || {});
fs.writeFileSync(path.join(out, 'README.md'), `# ${L.template.name}

> **Sinh tự động** từ \`templates/sami-agency-intro\` + \`lang/${lang}.json\` (\`node templates/sami-agency-intro/tools/build-lang.mjs ${lang}\`). Đừng sửa tay thư mục này: sửa cảnh ở mẫu gốc, sửa chữ ở \`lang/${lang}.json\`, rồi dựng lại.

${L.template.description}

- Cùng 12 cảnh, cùng nhạc, cùng ảnh thật (SAMI_Library, xem README mẫu gốc mục "Ảnh thật nằm ở thư viện").
- ${keys.length} ô chữ đã đổi sang tiếng Việt; các ô còn lại là chữ trong giao diện khách người Đức thấy (Google Maps, website, đặt bàn, đặt món, menu) nên giữ tiếng Đức.
- Cảnh đặt \`<html lang="${L.lang || lang}">\` → \`intro.css\` giãn dòng tiêu đề để dấu tiếng Việt không chồng.
- Nhà hàng trong cảnh Branding / Menu là **hư cấu** ("${pj.copy.S04_brand?.value || ''}"), luôn có nhãn "${pj.copy.S04_concept?.value || ''}".
`);
console.log(`✓ ${path.relative(path.dirname(path.dirname(src)), out)} · ${keys.length} ô chữ ${lang}`);
