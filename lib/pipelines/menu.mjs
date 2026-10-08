// Dây chuyền "menu": video thực đơn / món mới / ưu đãi. hook → mỗi món một cảnh → (ưu đãi) → kêu gọi → kết
import {need, closing, base} from './common.mjs';

export const describe = 'Video thực đơn / món mới: hook, mỗi món một cảnh (ảnh, tên, mô tả, giá), ưu đãi, kêu gọi, kết.';
export default (b, brand) => {
  need(b, 'name', 'hook.headline', 'dishes');
  if (b.dishes.length > 8) throw new Error('Tối đa 8 món một video (tách thành nhiều video)');
  const S = [{khuon: 'hook-words', label: 'Hook', values: {label: b.hook.label || '', headline: b.hook.headline, sub: b.hook.sub || ''}}];
  b.dishes.forEach((d, i) => { need(d, 'name', 'price'); S.push({khuon: 'menu-dish', label: 'Món ' + (i + 1), beats: d.beats, values: {label: d.label ?? (b.dishes.length > 1 ? `${b.labelWord || 'Món'} ${i + 1}/${b.dishes.length}` : ''), dish: d.name, desc: d.desc || '', price: d.price, dish_photo: d.photo || ''}}); });
  if (b.offer?.badge) S.push({khuon: 'offer-badge', label: 'Ưu đãi', values: {badge: b.offer.badge, badge_sub: b.offer.badgeSub || '', headline: b.offer.headline || '', terms: b.offer.terms || '', date: b.offer.date || ''}});
  S.push(...closing({...b, cta: b.cta || {headline: 'Đặt bàn *ngay hôm nay.*', button: 'Đặt bàn'}}, brand));
  return {...base(b, brand, 'paper'), scenes: S};
};
export const example = {
 name: 'Quán mẫu · Thực đơn trưa', client: 'Quán mẫu (ví dụ)', formats: ['9:16'], theme: 'paper', labelWord: 'Món',
 hook: {label: 'MITTAGSMENÜ', headline: 'Thực đơn trưa / *tuần này*', sub: 'Thứ Hai đến Thứ Sáu'},
 dishes: [
  {name: 'Phở bò *tái lăn*', desc: 'Nước dùng ninh 12 giờ', price: '14,90 €', photo: 'lib:img/khuon-mau/placeholder_dish.jpg'},
  {name: 'Bún chả *Hà Nội*', desc: 'Chả nướng than hoa', price: '13,50 €', photo: 'lib:img/khuon-mau/c4.jpg'},
 ],
 offer: {badge: '-20%', badgeSub: '11:30–14:30', headline: 'Bữa trưa *giảm 20%*', terms: 'Áp dụng tại quán', date: 'đến 31.10'},
 cta: {headline: 'Đặt bàn *ngay hôm nay.*', button: 'Đặt bàn', web: 'quan-mau.de', phone: '+49 30 000000'},
};
