// Dây chuyền "maps": video dịch vụ Google Maps / hồ sơ doanh nghiệp.
//   hook → tìm kiếm trên Maps (quán của khách sáng lên) → (vấn đề) → hồ sơ đầy đủ → (lợi ích) → (đánh giá) → kêu gọi → kết
import {need, closing, base} from './common.mjs';

export const describe = 'Video Google Maps: hook, tìm kiếm trên Maps, vấn đề, hồ sơ quán đầy đủ, lợi ích, đánh giá, kêu gọi, kết.';
export default (b, brand) => {
  need(b, 'name', 'hook.headline', 'query', 'business.name');
  const B = b.business, comp = b.competitors || [['Quán bên cạnh', '4,1'], ['Quán khác', '3,9']], ph = B.photos || [];
  const S = [];
  S.push(b.hookStyle === 'words'
    ? {khuon: 'hook-words', label: 'Hook', values: {label: b.hook.label || '', headline: b.hook.headline, sub: b.hook.sub || ''}}
    : {khuon: 'hook-ransom', label: 'Hook', values: {headline: b.hook.headline, sub: b.hook.sub || ''}});
  S.push({khuon: 'maps-search', label: 'Tìm trên Maps', values: {headline: b.search?.headline || 'Khách gõ / *“' + b.query + '”*', sub: b.search?.sub || '', query: b.query,
    r1_name: B.name, r1_rating: String(B.rating ?? '4,8'), r1_count: String(B.count ?? ''), r1_meta: B.meta || B.category || '', r1_photo: ph[0] || '',
    r2_name: comp[0]?.[0] || '', r2_rating: String(comp[0]?.[1] ?? ''), r3_name: comp[1]?.[0] || '', r3_rating: String(comp[1]?.[1] ?? '')}});
  if (b.problem?.headline) { const r = b.problem.reasons || []; S.push({khuon: 'problem-stamp', label: 'Vấn đề', values: {headline: b.problem.headline, p1: r[0] || '', p2: r[1] || '', p3: r[2] || '', stamp: b.problem.stamp || 'Lướt qua!'}}); }
  S.push({khuon: 'maps-profile', label: 'Hồ sơ đầy đủ', values: {headline: b.profile?.headline || 'Hồ sơ *đầy đủ* / ấn tượng đầu tiên', sub: b.profile?.sub || '', name: B.name, rating: String(B.rating ?? '4,8'), count: String(B.count ?? ''), category: B.category || '', hours: B.hours || 'Đang mở · Đóng cửa lúc 22:00', p1_photo: ph[0] || '', p2_photo: ph[1] || '', p3_photo: ph[2] || ''}});
  if (b.benefits?.items?.length) { const it = b.benefits.items; S.push({khuon: 'benefits-3', label: 'SAMI làm gì', values: {title: b.benefits.title || 'SAMI làm *gì* cho quán?', b1: it[0] || '', b2: it[1] || '', b3: it[2] || '', b4: it[3] || ''}}); }
  if (b.proof?.quote) S.push({khuon: 'review-quote', label: 'Đánh giá', values: {quote: b.proof.quote, author: b.proof.author || '', meta: b.proof.meta || 'Google', rating: String(b.proof.rating ?? 5), headline: b.proof.headline || ''}});
  if (b.deadline?.day) S.push({khuon: 'calendar-date', label: 'Thời hạn', values: {month: b.deadline.month || 'Tháng 12', month_num: String(b.deadline.monthNum || 12), year: String(b.deadline.year || 2026), day: String(b.deadline.day), headline: b.deadline.headline || 'Quán của bạn / đã *sẵn sàng* chưa?', sub: b.deadline.sub || ''}});
  S.push(...closing({...b, cta: b.cta || {headline: 'Kiểm tra Google Maps / *miễn phí.*', button: 'Nhắn cho SAMI'}}, brand));
  return {...base(b, brand, 'paper'), scenes: S};
};
export const example = {
 name: 'SAMI · Google Maps cuối năm', client: 'SAMI', brand: 'sami', formats: ['9:16', '16:9'], theme: 'paper',
 hook: {headline: 'Ai *cũng* mở / Google Maps', sub: 'trước khi ra khỏi nhà'},
 query: 'quán ăn gần đây',
 business: {name: 'Saigon Atelier', rating: '4,8', count: '1.204', category: 'Nhà hàng Việt · €€', meta: 'Nhà hàng Việt · 350 m', hours: 'Đang mở · Đóng cửa lúc 22:00', photos: ['lib:img/khuon-mau/placeholder_dish.jpg', 'lib:img/khuon-mau/c2.jpg', 'lib:img/khuon-mau/placeholder_guests.jpg']},
 competitors: [['Pho Co', '4,1'], ['Banh Mi 36', '3,9']],
 problem: {headline: 'Khách *lướt qua* rất nhanh', reasons: ['Thiếu giờ mở cửa', 'Ảnh mờ, ảnh cũ'], stamp: 'Lướt qua!'},
 benefits: {title: 'SAMI làm *gì* cho quán?', items: ['Thông tin chuẩn', 'Hình ảnh đẹp', 'Từ khoá khách hay tìm']},
 deadline: {month: 'Tháng 12', monthNum: 12, year: 2026, day: 24, headline: 'Quán của bạn / đã *sẵn sàng* chưa?'},
 cta: {headline: 'Kiểm tra Google Maps / *miễn phí.*', button: 'Nhắn cho SAMI'},
};
