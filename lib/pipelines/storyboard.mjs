// Dây chuyền "storyboard": video bất kỳ dựng từ khuôn. Claude viết storyboard (mỗi cảnh = 1 khuôn + chữ cho các ô),
// máy dựng dự án. Dùng khi video không khớp promo / maps / menu. Danh mục khuôn gọn: `cli-pipeline.mjs catalog`.
//   cảnh tự viết (không có khuôn phù hợp): {"khuon": "hook-words", "label": "…", "custom": "mô tả cảnh cần viết tay"}
//   → dựng tạm bằng khuôn gần nhất, ghi chú vào label để viết lại HTML sau.
import {need, closing, base} from './common.mjs';

export const describe = 'Video tự do: storyboard là danh sách cảnh, mỗi cảnh chọn 1 khuôn + chữ cho các ô (xem catalog).';
export default (b, brand) => {
  need(b, 'name', 'scenes');
  const S = b.scenes.map((s, i) => {
    if (!s.khuon) throw new Error(`storyboard: cảnh ${i + 1} thiếu "khuon"`);
    return {khuon: s.khuon, label: (s.label || '') + (s.custom ? ' ✎ viết tay: ' + s.custom : ''), values: s.values || {}, ...(s.beats ? {beats: s.beats} : {}), ...(s.theme ? {theme: s.theme} : {})};
  });
  if (b.closing) S.push(...closing(b, brand)); // "closing": true → CTA + end card from the brand
  return {...base(b, brand, 'night'), scenes: S};
};
export const example = {
 name: '261008-V30-mittagsangebot-v.1', client: 'SAMI', brand: 'sami', formats: ['9:16'], theme: 'light', music: '',
 closing: true,
 cta: {headline: 'Mittagsgäste / *jetzt gewinnen.*', button: 'SAMI schreiben'},
 scenes: [
  {khuon: 'hook-words', label: 'Hook', beats: 6, values: {label: 'Mittagsgeschäft', headline: 'Leere Tische / um *12 Uhr?*', sub: ''}},
  {khuon: 'stat-counter', label: 'Số liệu', values: {number: '68', suffix: '%', caption: 'suchen ihr Mittagessen *auf Google*', source: 'Quelle: …'}},
  {khuon: 'offer-badge', label: 'Ưu đãi', values: {badge: '-20%', headline: 'Mittagsmenü / *diese Woche*', terms: 'Mo bis Fr, 11:30 bis 14:30', date: 'bis 31.10'}}
 ]
};
