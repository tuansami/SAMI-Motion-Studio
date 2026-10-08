// Shared helpers for dây chuyền (pipelines): brand → project brand + default contact, small brief validation.
// A pipeline is a pure function (brief, brand) → spec for server/khuon.mjs buildProject():
//   {name, client, formats, theme, brand, music, scenes: [{khuon, values, beats?, theme?, label?}]}
export const need = (brief, ...paths) => {
  const miss = paths.filter((p) => { const v = p.split('.').reduce((o, k) => (o == null ? o : o[k]), brief); return v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length); });
  if (miss.length) throw new Error('brief.json thiếu: ' + miss.join(', '));
};
/** brand.json (SAMI_Library/brands/<id>) → what goes into project.json */
export const brandOf = (brand) => (brand ? {colors: brand.colors || {}, ...(brand.gradient ? {gradient: brand.gradient} : {}), ...(brand.fonts ? {fonts: brand.fonts} : {})} : {});
/** the closing pair every pipeline ends with: CTA + end card, filled from brief.cta and the brand */
export const closing = (brief, brand) => {
  const c = brief.cta || {}, ct = brand?.contact || {};
  const out = [{khuon: 'cta-contact', label: 'Kêu gọi', values: {headline: c.headline || brand?.cta || 'Nhắn cho chúng tôi *ngay hôm nay.*', button: c.button || 'Liên hệ ngay', web: c.web ?? ct.web ?? '', phone: c.phone ?? ct.phone ?? '', whatsapp: c.whatsapp ?? ct.whatsapp ?? '', address: c.address ?? ct.address ?? ''}}];
  if (brief.end !== false) out.push({khuon: 'endcard-logo', label: 'Kết', values: {logo: brief.endcard?.logo ?? brand?.logo ?? '', name: brief.endcard?.name ?? brand?.name ?? brief.client ?? '', tagline: brief.endcard?.tagline ?? brand?.tagline ?? '', web: brief.endcard?.web ?? ct.web ?? ''}});
  return out;
};
export const base = (brief, brand, theme) => ({
  name: brief.name, client: brief.client || brand?.name || '', formats: brief.formats || ['9:16'],
  theme: brief.theme || brand?.theme || theme, brand: brandOf(brand), music: brief.music ?? brand?.music ?? '',
});
