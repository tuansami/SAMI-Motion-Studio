#!/usr/bin/env node
// Studio 1.2 — tạo PHONG CÁCH mới (style pack) + template demo dựng từ khuôn.
//   node tools/style-new.mjs <id> --name "Tư liệu cắt dán giấy" --base paper [--desc "…"] [--accent "#E63946"]
//        [--head "Archivo Black"] [--ui "Inter"] [--hand "Caveat"]           tạo lib/hf/styles/<id>/ (không ghi đè nếu đã có)
//   node tools/style-new.mjs <id> --demo [--ratio 9:16,16:9]                 (dựng lại) template demo templates/style-<id>/ + ảnh bìa
// Sau khi tạo: sửa style.css (màu, chữ, thẻ, kết cấu), tuỳ chọn style.js (chuyển động riêng), chạy lại --demo, xem ảnh bìa.
// Khuôn nào cũng mặc được phong cách mới (chọn ở 🧩 Khuôn hoặc project.json → look.theme / scene.khuon.theme).
import fs from 'fs';
import path from 'path';
import {LIB, TEMPLATES} from '../server/paths.mjs';
import {STYLES_DIR, BUILTIN, getStyle} from '../server/styles.mjs';

const argv = process.argv.slice(2); const id = argv[0];
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
if (!id || id.startsWith('--') || !/^[a-z0-9-]+$/.test(id)) { console.log('Dùng: node tools/style-new.mjs <id-chu-thuong-khong-dau> --name "…" --base night|paper|light   (rồi --demo)'); process.exit(1); }
if (BUILTIN[id]) { console.error(`"${id}" là theme có sẵn`); process.exit(1); }
const dir = path.join(STYLES_DIR, id);

if (!argv.includes('--demo')) {
  if (fs.existsSync(path.join(dir, 'style.json'))) { console.error('Đã có phong cách ' + id + ' (' + dir + '). Sửa trực tiếp, hoặc chạy --demo.'); process.exit(1); }
  const base = BUILTIN[opt('base')] ? opt('base') : 'night';
  const name = opt('name', id), accent = opt('accent', base === 'paper' ? '#E63946' : base === 'light' ? '#7667FE' : '#08DDA4');
  const fonts = {head: opt('head', base === 'paper' ? 'Playfair Display' : 'Be Vietnam Pro'), ui: opt('ui', 'Inter'), hand: opt('hand', 'Caveat')};
  // the base theme's token block from kit.css, renamed → the starting point of style.css
  const kit = fs.readFileSync(path.join(LIB, 'hf', 'khuon', 'kit.css'), 'utf8');
  const block = (kit.match(new RegExp(`\\[data-theme="${base}"\\] \\{[\\s\\S]*?\\n\\}`)) || [''])[0].replace(`[data-theme="${base}"]`, `[data-theme="${id}"]`);
  const fam = (f) => `"${f}"`;
  fs.mkdirSync(path.join(dir, 'assets'), {recursive: true});
  fs.writeFileSync(path.join(dir, 'style.json'), JSON.stringify({
    name, description: opt('desc', ''), base, version: '1.0.0',
    fonts, fontWeights: [400, 700, 800],
    palette: {bg: '', ink: '', accent, accent2: ''},
    motion: {ease: 'cubic-bezier(0.22,1,0.36,1)', speed: 1, note: 'Một easing cho cả phim; speed < 1 = chậm, trang trọng; > 1 = nhanh, tin nóng'},
    texture: base === 'paper' ? 'giấy + hạt (kit)' : base === 'night' ? 'hạt nhẹ' : 'không',
    sfx: ['whoosh_a', 'pop', 'sub_hit'], music: '',
    tags: [], author: 'SAMI Marketing Agency', license: 'internal',
  }, null, 1));
  fs.writeFileSync(path.join(dir, 'style.css'), `/* Phong cách: ${name} (base: ${base}). Nạp tự động cho mọi cảnh có theme "${id}".
 * 1) Token: màu nền, chữ, nhấn, thẻ, bóng, font. 2) Ghi đè thành phần khuôn: .k-stage, .k-card, .k-btn, .k-chip, .k-polaroid,
 *    .k-tape, .k-stamp, .k-ransom, em.hl … luôn bắt đầu bằng html[data-theme="${id}"] (thắng luật base trong kit.css).
 *    Nhấn em.hl có nền: đặt cho "em.hl, em.hl .w" kèm "em.hl:has(.w) { background: none }", kẻo khối màu hiện trước chữ.
 *    Font đứng / hẹp (Anton, Oswald): line-height ≥ 1.15 để dấu tiếng Việt không chồng dòng. Không animation CSS. */
${block.replace(/--k-head:[^;]*;/, `--k-head: ${fam(fonts.head)}, var(--f-head);`).replace(/--k-ui:[^;]*;/, `--k-ui: ${fam(fonts.ui)}, var(--f-ui);`).replace(/--k-hand:[^;]*;/, `--k-hand: ${fam(fonts.hand)}, cursive;`).replace(/--k-accent:[^;]*;/, `--k-accent: var(--c-accent, ${accent});`)}
/* ví dụ ghi đè:
html[data-theme="${id}"] .k-card { border-radius: 4px; }
html[data-theme="${id}"] em.hl { color: var(--k-accent); background: none; -webkit-background-clip: border-box; }
*/
`);
  fs.writeFileSync(path.join(dir, 'style.js'), `/* Phong cách ${name}: chuyển động riêng (tuỳ chọn). Chạy trước script của cảnh; mọi thứ phải là hàm của timeline.
 * Cảnh / khuôn gọi: if (SAMI.style && SAMI.styleFx) SAMI.styleFx.enter(tl, el, at). */
(function () {
  var S = window.SAMI; if (!S) return;
  S.styleFx = {
    /** cách một phần tử xuất hiện trong phong cách này (mặc định: trồi lên + bỏ nhoè, như SAMI.arrive) */
    enter: function (tl, el, at, o) { return S.arrive(tl, el, at, o || {}); },
  };
})();
`);
  fs.writeFileSync(path.join(dir, 'README.md'), `# Phong cách: ${name}\n\n${opt('desc', '')}\n\nBase: \`${base}\` (khuôn dùng bố cục kiểu ${base}). Chuẩn: \`docs/TEMPLATE_STANDARD.md\` mục Phong cách.\n\n- [ ] Màu: nền, chữ, nhấn (đủ tương phản trên 9:16)\n- [ ] Font: tiêu đề, chữ thường, chữ tay (có trong @fontsource, đủ dấu tiếng Việt và tiếng Đức)\n- [ ] Thành phần: thẻ, nút, nhãn, ảnh, nhấn mạnh (em.hl)\n- [ ] Kết cấu: hạt, giấy, đường kẻ (tĩnh, không phụ thuộc thời gian)\n- [ ] Chuyển động: easing, tốc độ, cách vào / ra (style.js nếu khác mặc định)\n- [ ] Âm thanh: bộ SFX gợi ý, kiểu nhạc\n- [ ] \`node tools/style-new.mjs ${id} --demo\` → xem ảnh bìa \`templates/style-${id}/preview/\`\n`);
  console.log(`✓ Đã tạo phong cách ${id} → ${dir}\n  Sửa style.css (+ style.js nếu cần), rồi: node tools/style-new.mjs ${id} --demo`);
  process.exit(0);
}

// ── template demo: 8 khuôn tiêu biểu mặc phong cách này ──
const st = getStyle(id); if (!st) { console.error('Chưa có phong cách ' + id + '. Tạo trước: node tools/style-new.mjs ' + id + ' --name "…" --base paper'); process.exit(1); }
const {buildProject} = await import('../server/khuon.mjs'); const {validateProject} = await import('../server/validate.mjs'); const {makeThumbs} = await import('../server/template.mjs');
const IMG = (f) => 'lib:img/khuon-mau/' + f;
const scenes = [
  {khuon: 'hook-words', label: 'Hook', values: {label: st.name.toUpperCase(), headline: 'Eine Geschichte / in *30 Sekunden*', sub: 'Beispieltext'}},
  {khuon: 'problem-stamp', label: 'Vấn đề', values: {headline: 'Das *Problem*', p1: 'Erster Grund', p2: 'Zweiter Grund', stamp: 'Stopp'}},
  {khuon: 'stat-counter', label: 'Số liệu', values: {number: '68', suffix: '%', caption: 'Beispielzahl *ersetzen*', source: 'Quelle: Beispiel'}},
  {khuon: 'benefits-3', label: 'Lợi ích', values: {title: 'Drei *Punkte*', b1: 'Erster Punkt', b2: 'Zweiter Punkt', b3: 'Dritter Punkt'}},
  {khuon: 'photo-collage', label: 'Ảnh', values: {headline: 'Bilder *hier*', p1_photo: IMG('placeholder_guests.jpg'), c1: 'Bild 1', p2_photo: IMG('placeholder_dish.jpg'), c2: 'Bild 2'}},
  {khuon: 'review-quote', label: 'Trích dẫn', values: {quote: 'Ein Zitat als Beispiel, kurz und klar.', author: 'Name', meta: 'Quelle', rating: '5', headline: ''}},
  {khuon: 'cta-contact', label: 'Kêu gọi', values: {headline: 'Jetzt *handeln.*', button: 'Kontakt', web: 'beispiel.de'}},
  {khuon: 'endcard-logo', label: 'Kết', values: {name: 'Marke', tagline: st.name, web: 'beispiel.de'}},
];
const tid = 'style-' + id; const tdir = path.join(TEMPLATES, tid);
fs.rmSync(tdir, {recursive: true, force: true});
const formats = String(opt('ratio', '9:16,16:9')).split(',');
const p = buildProject(tdir, {name: `Phong cách: ${st.name}`, formats, theme: id, brand: {}, music: st.music || '', scenes});
const sec = Math.round(p.scenes.at(-1).end / 30);
fs.writeFileSync(path.join(tdir, 'template.json'), JSON.stringify({id: tid, name: `Phong cách: ${st.name}`, version: st.version || '1.0.0', studio: '>=1.2.0', category: 'style', style: id, goal: [], description: (st.description || '') + ' Template demo: 8 khuôn tiêu biểu mặc phong cách này; dùng làm điểm bắt đầu.', formats, duration: sec, bpm: 120, languages: ['de'], thumbFrame: Math.round(p.scenes[0].end - 20), author: st.author || 'SAMI Marketing Agency', license: st.license || 'internal', tags: ['style', id, ...(st.tags || [])], engine: 'hyperframes', khuon: scenes.map((s) => s.khuon)}, null, 1));
fs.writeFileSync(path.join(tdir, 'README.md'), `# Phong cách: ${st.name}\n\nDựng tự động: \`node tools/style-new.mjs ${id} --demo\` (đừng sửa tay, sửa \`lib/hf/styles/${id}/\` rồi dựng lại).\n`);
const v = validateProject(tdir); if (v.fail.length) console.log('✗ ' + v.fail.join('\n✗ '));
await makeThumbs(tdir, (m) => console.log('  ảnh bìa ' + m));
console.log(`✓ Template demo ${tid}: ${p.scenes.length} cảnh · ${sec} s → ${tdir}\n  Xem: ${path.join(tdir, 'preview')}`);
