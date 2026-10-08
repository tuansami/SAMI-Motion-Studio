// Dây chuyền "promo": video quảng cáo ~30 s từ brief. Phần nào có trong brief thì có cảnh đó:
//   hook → (vấn đề) → (số liệu) → lợi ích → (đánh giá) → (ưu đãi) → kêu gọi → kết
import {need, closing, base} from './common.mjs';

export const describe = 'Video quảng cáo ~30 s: hook, vấn đề, số liệu, lợi ích, đánh giá, ưu đãi, kêu gọi, kết (phần nào có trong brief thì có cảnh đó).';
export default (b, brand) => {
  need(b, 'name', 'hook.headline', 'benefits.items', 'cta.headline');
  const S = [];
  S.push(b.hookStyle === 'ransom'
    ? {khuon: 'hook-ransom', label: 'Hook', values: {headline: b.hook.headline, sub: b.hook.sub || ''}}
    : {khuon: 'hook-words', label: 'Hook', values: {label: b.hook.label || '', headline: b.hook.headline, sub: b.hook.sub || ''}});
  if (b.problem?.headline) { const r = b.problem.reasons || []; S.push({khuon: 'problem-stamp', label: 'Vấn đề', values: {headline: b.problem.headline, p1: r[0] || '', p2: r[1] || '', p3: r[2] || '', stamp: b.problem.stamp || 'Bỏ qua!'}}); }
  if (b.stat?.number != null) S.push({khuon: 'stat-counter', label: 'Số liệu', values: {label: b.stat.label || '', number: String(b.stat.number), prefix: b.stat.prefix || '', suffix: b.stat.suffix ?? '%', caption: b.stat.caption || '', source: b.stat.source || ''}});
  const it = b.benefits.items; S.push({khuon: 'benefits-3', label: 'Lợi ích', values: {title: b.benefits.title || 'Bạn nhận được gì?', b1: it[0] || '', b2: it[1] || '', b3: it[2] || '', b4: it[3] || ''}});
  if (b.proof?.quote) S.push({khuon: 'review-quote', label: 'Đánh giá', values: {quote: b.proof.quote, author: b.proof.author || '', meta: b.proof.meta || 'Google', rating: String(b.proof.rating ?? 5), headline: b.proof.headline || ''}});
  if (b.offer?.badge) S.push({khuon: 'offer-badge', label: 'Ưu đãi', values: {badge: b.offer.badge, badge_sub: b.offer.badgeSub || '', headline: b.offer.headline || '', terms: b.offer.terms || '', date: b.offer.date || ''}});
  S.push(...closing(b, brand));
  return {...base(b, brand, 'night'), scenes: S};
};
export const example = {
 name: 'SAMI · Website cho nhà hàng (promo)', client: 'SAMI', brand: 'sami', formats: ['9:16'], theme: 'night',
 hook: {label: 'SAMI · BERLIN', headline: 'Khách tìm quán / *trên điện thoại.*', sub: 'Website của bạn có kịp gây ấn tượng?'},
 problem: {headline: 'Website cũ *mất khách*', reasons: ['Tải chậm hơn 5 giây', 'Không đặt bàn được', 'Vỡ khung trên điện thoại'], stamp: 'Thoát!'},
 stat: {number: 53, suffix: '%', caption: 'người dùng rời trang *tải quá 3 giây*', source: 'Nguồn: Google'},
 benefits: {title: 'SAMI làm *gì* cho quán?', items: ['Website nhanh, đẹp', 'Đặt bàn 1 chạm', 'Chuẩn Google Maps']},
 proof: {quote: 'Đặt bàn online tăng *gấp đôi* sau 1 tháng.', author: 'Chủ quán Saigon Atelier', meta: 'Berlin · 2026', rating: 5},
 cta: {headline: 'Tư vấn *miễn phí* / 15 phút', button: 'Nhắn cho SAMI'},
};
