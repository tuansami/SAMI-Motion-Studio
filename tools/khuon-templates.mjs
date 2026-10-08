#!/usr/bin/env node
// Studio 1.0 — template Hyperframes theo ngành, dựng hoàn toàn từ khuôn (lib/hf/khuon) → xuất thuần được (không Remotion).
// Chữ trên màn hình tiếng Đức (thị trường SAMI), nhà hàng / tiệm mẫu là hư cấu, ảnh mẫu lib:img/khuon-mau/*.
//   node tools/khuon-templates.mjs            chạy thử: in danh sách template sẽ dựng
//   node tools/khuon-templates.mjs --apply    ghi templates/hf-<ngành>/ (ghi đè bản cũ cùng tên)
import fs from 'fs';
import path from 'path';
import {TEMPLATES} from '../server/paths.mjs';
import {buildProject} from '../server/khuon.mjs';
import {validateProject} from '../server/validate.mjs';

const IMG = (f) => 'lib:img/khuon-mau/' + f;
const T = [
  {id: 'hf-nha-hang', category: 'restaurant', goal: ['menu-moi', 'uu-dai'], theme: 'paper', name: 'Nhà hàng: món mới + ưu đãi (khuôn)',
    description: 'Video nhà hàng dựng từ khuôn: hook, món mới, khoảnh khắc khách, đánh giá Google, ưu đãi trưa, kêu gọi, thẻ kết. Toàn cảnh HTML nên xuất thuần được.',
    tags: ['khuon', 'restaurant', 'menu', 'de'], scenes: [
      {khuon: 'hook-ransom', label: 'Hook', values: {headline: 'Neu auf der *Karte*', sub: 'nur diesen Monat'}},
      {khuon: 'menu-dish', label: 'Món mới', values: {label: 'Neu', dish: 'Sushi Platte Atelier', desc: 'Lachs, Thunfisch, Avocado, 16 Stück', price: '24,90 €', dish_photo: IMG('placeholder_dish.jpg')}},
      {khuon: 'photo-collage', label: 'Không khí', values: {headline: 'Kommt *vorbei!*', p1_photo: IMG('placeholder_guests.jpg'), c1: 'Freitagabend', p2_photo: IMG('placeholder_dish.jpg'), c2: 'Frisch gerollt'}},
      {khuon: 'review-quote', label: 'Đánh giá', values: {quote: 'Das beste Sushi im Kiez. Wir kommen jede Woche wieder.', author: 'Lena M.', meta: 'Google · vor 2 Wochen', rating: '5', headline: 'Das sagen *Gäste*'}},
      {khuon: 'offer-badge', label: 'Ưu đãi', values: {badge: '-15%', badge_sub: 'Mittagsmenü', headline: 'Mittagstisch *15% günstiger*', terms: 'Mo bis Fr, 11:30 bis 14:30', date: 'bis 30.11.'}},
      {khuon: 'cta-contact', label: 'Kêu gọi', values: {headline: 'Jetzt *Tisch reservieren.*', button: 'Reservieren', web: 'saigon-atelier.de', phone: '030 1234 567', address: 'Torstraße 12, Berlin'}},
      {khuon: 'endcard-logo', label: 'Kết', values: {name: 'Saigon Atelier', tagline: 'Asiatische Küche, neu gedacht', web: 'saigon-atelier.de'}}]},
  {id: 'hf-nail-spa', category: 'nail', goal: ['gioi-thieu', 'uu-dai'], theme: 'light', name: 'Nail / Spa: dịch vụ + đặt lịch (khuôn)',
    description: 'Video tiệm nail / spa dựng từ khuôn: hook, vấn đề, 3 lợi ích, số liệu, đánh giá, ngày ưu đãi, chat đặt lịch, kêu gọi, thẻ kết. Toàn cảnh HTML.',
    tags: ['khuon', 'nail', 'spa', 'booking', 'de'], scenes: [
      {khuon: 'hook-words', label: 'Hook', values: {label: 'NAIL STUDIO · BERLIN', headline: 'Deine Nägel / verdienen *mehr.*', sub: ''}},
      {khuon: 'problem-stamp', label: 'Vấn đề', values: {headline: 'Kennst du *das?*', p1: 'Lack splittert nach 3 Tagen', p2: 'Termin erst in 2 Wochen', p3: 'Niemand hört zu', stamp: 'Nicht bei uns'}},
      {khuon: 'benefits-3', label: 'Lợi ích', values: {title: 'Bei uns *anders*', b1: 'Hält 3 Wochen, garantiert', b2: 'Termin online in 30 Sekunden', b3: 'Beratung vor jedem Design'}},
      {khuon: 'stat-counter', label: 'Số liệu', values: {label: 'GEL-MANIKÜRE', number: '21', suffix: ' Tage', caption: 'hält unser Gel *mindestens*', source: 'Beispielwert, vor Veröffentlichung prüfen'}},
      {khuon: 'review-quote', label: 'Đánh giá', values: {quote: 'Super sauber, super freundlich und die Nägel halten ewig.', author: 'Sophie K.', meta: 'Google', rating: '5', headline: ''}},
      {khuon: 'calendar-date', label: 'Ngày ưu đãi', values: {month: 'November', month_num: '11', year: '2026', day: '14', headline: 'Ladies Day: / *-20%* auf alles', sub: 'nur mit Termin'}},
      {khuon: 'chat-whatsapp', label: 'Đặt lịch', values: {headline: 'Termin per *WhatsApp*', name: 'Lotus Nails', status: 'online', m1: 'Hallo! Habt ihr Samstag noch frei?', m2: 'Ja, 11 Uhr oder 15 Uhr 💅', m3: '15 Uhr bitte!', m4: 'Gebucht, bis Samstag!'}},
      {khuon: 'cta-contact', label: 'Kêu gọi', values: {headline: 'Jetzt *Termin sichern.*', button: 'Termin buchen', web: 'lotus-nails.de', whatsapp: '0176 1234 5678', address: 'Kantstraße 8, Berlin'}},
      {khuon: 'endcard-logo', label: 'Kết', values: {name: 'Lotus Nails', tagline: 'Nails · Spa · Beauty', web: 'lotus-nails.de'}}]},
  {id: 'hf-google-maps', category: 'agency', goal: ['gioi-thieu'], theme: 'paper', name: 'Dịch vụ Google Maps (khuôn)',
    description: 'Video dịch vụ hồ sơ Google Maps cho nhà hàng, dựng từ khuôn: hook, số liệu, tìm trên Maps, đường tới quán, hồ sơ đầy đủ, biểu đồ trước / sau, kêu gọi, thẻ kết.',
    tags: ['khuon', 'google-maps', 'agency', 'de'], scenes: [
      {khuon: 'hook-ransom', label: 'Hook', values: {headline: 'Gäste *googeln* / zuerst', sub: 'bevor sie kommen'}},
      {khuon: 'stat-counter', label: 'Số liệu', values: {label: 'GOOGLE · 2025', number: '87', suffix: '%', caption: 'schauen *Google Maps* an, bevor sie ein Restaurant wählen', source: 'Quelle: Beispielwert, vor Veröffentlichung prüfen'}},
      {khuon: 'maps-search', label: 'Tìm trên Maps', values: {headline: 'Sie suchen: / *„Restaurant in der Nähe“*', query: 'Restaurant in der Nähe', r1_name: 'Saigon Atelier', r1_rating: '4,8', r1_count: '1.204', r1_meta: 'Asiatisch · 350 m', r1_photo: IMG('placeholder_dish.jpg'), r2_name: 'Pho Co', r2_rating: '4,1', r3_name: 'Banh Mi 36', r3_rating: '3,9'}},
      {khuon: 'map-route', label: 'Đường tới quán', values: {headline: 'Und finden *dich.*', from: 'Hackescher Markt', to: 'Saigon Atelier', eta: '6 Min. zu Fuß'}},
      {khuon: 'maps-profile', label: 'Hồ sơ', values: {headline: 'Ein Profil, das *überzeugt*', name: 'Saigon Atelier', rating: '4,8', count: '1.204', category: 'Asiatisch · €€', hours: 'Geöffnet · bis 22:00', p1_photo: IMG('placeholder_dish.jpg'), p2_photo: IMG('placeholder_guests.jpg'), p3_photo: IMG('c4.jpg')}},
      {khuon: 'chart-bars', label: 'Trước / sau', values: {title: 'Anrufe über *Google Maps*', l1: 'Jul', v1: '18', l2: 'Aug', v2: '24', l3: 'Sep', v3: '41', l4: 'Okt', v4: '63', unit: 'pro Monat', source: 'Beispielwerte'}},
      {khuon: 'cta-contact', label: 'Kêu gọi', values: {headline: 'Maps-Check / *kostenlos.*', button: 'SAMI schreiben', web: 'sami-agency.de'}},
      {khuon: 'endcard-logo', label: 'Kết', values: {name: 'SAMI', tagline: 'Marketing für Restaurants', web: 'sami-agency.de'}}]},
];

const apply = process.argv.includes('--apply');
for (const t of T) {
  const dir = path.join(TEMPLATES, t.id);
  if (!apply) { console.log(`${t.id.padEnd(16)} ${t.scenes.length} cảnh · ${t.scenes.map((s) => s.khuon).join(' → ')}`); continue; }
  fs.rmSync(dir, {recursive: true, force: true});
  const p = buildProject(dir, {name: t.name, client: '', formats: ['9:16', '16:9'], theme: t.theme, brand: {}, music: '', scenes: t.scenes});
  const sec = Math.round(p.scenes.at(-1).end / 30);
  fs.writeFileSync(path.join(dir, 'template.json'), JSON.stringify({id: t.id, name: t.name, version: '1.0.0', studio: '>=1.0.0', category: t.category, style: t.theme, goal: t.goal, description: t.description, formats: ['9:16', '16:9'], duration: sec, bpm: 120, languages: ['de'], thumbFrame: Math.round(p.scenes[1].start + 60), author: 'SAMI Marketing Agency', license: 'internal', tags: t.tags, engine: 'hyperframes', khuon: t.scenes.map((s) => s.khuon)}, null, 1));
  fs.writeFileSync(path.join(dir, 'README.md'), `# ${t.name}\n\n${t.description}\n\nDựng bằng \`node tools/khuon-templates.mjs --apply\` từ khuôn (lib/hf/khuon). Đổi chữ ở tab Chữ; đổi khuôn từng cảnh bằng 🧩 Khuôn. Nhà hàng / tiệm trong mẫu là hư cấu; số liệu mẫu phải thay bằng số thật trước khi đăng.\n`);
  const v = validateProject(dir);
  console.log(`✓ ${t.id}: ${p.scenes.length} cảnh · ${sec} s${v.fail.length ? ' · ✗ ' + v.fail.join('; ') : ''}`);
}
if (!apply) console.log('\nChạy thử. Thêm --apply để ghi vào templates/.');
