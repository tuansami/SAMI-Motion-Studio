// Free stock: Pexels, Pixabay, Unsplash (free API keys), Wikimedia Commons (no key, licence-filtered).
// search() returns normalised items; fetch() downloads one into ctx.tmp and returns licence/author meta.
import path from 'path';
import {jfetch, download, extOf} from '../net.mjs';

const ORIENT = {landscape: 'landscape', portrait: 'portrait', square: 'square'};
const needKey = (ctx, label) => { if (!ctx.key) throw new Error(`Chưa có khoá ${label}. Nhập trong Studio → tab "Nguồn & AI" → Khoá API.`); return ctx.key; };
const pickVideo = (files, orientation) => {
  const mp4 = files.filter((f) => /mp4/.test(f.file_type || f.type || 'video/mp4') && f.width && f.height);
  const long = (f) => Math.max(f.width, f.height);
  const ok = mp4.filter((f) => long(f) <= 1920).sort((a, b) => long(b) - long(a));
  return ok[0] || mp4.sort((a, b) => long(a) - long(b))[0];
};

// ── Pexels ────────────────────────────────────────────────────────────
const PEXELS_LIC = {name: 'Pexels License', url: 'https://www.pexels.com/license/', commercial: true, attribution: 'không bắt buộc (nên ghi)', notes: 'Không bán lại nguyên bản; người trong ảnh không được ngụ ý xác nhận sản phẩm.'};
export const pexels = {
  id: 'pexels', label: 'Pexels', kinds: ['img', 'video'], stock: true, keyId: 'pexels', paid: false, licence: PEXELS_LIC, allow: ['pexels.com', 'vimeo.com'],
  async search(q, {kind = 'img', orientation, page = 1, perPage = 24} = {}, ctx) {
    const key = needKey(ctx, 'Pexels');
    const qs = new URLSearchParams({query: q, per_page: perPage, page}); if (ORIENT[orientation]) qs.set('orientation', ORIENT[orientation]);
    if (kind === 'video') {
      const j = await jfetch('https://api.pexels.com/videos/search?' + qs, {headers: {Authorization: key}, signal: ctx.signal});
      return (j.videos || []).map((v) => { const f = pickVideo(v.video_files || [], orientation); return f && {provider: 'pexels', id: String(v.id), kind: 'video', title: (v.url || '').split('/').filter(Boolean).pop()?.replace(/-\d+$/, '').replace(/-/g, ' ') || 'pexels video ' + v.id, thumb: v.image, w: f.width, h: f.height, duration: v.duration, author: v.user?.name, authorUrl: v.user?.url, page: v.url, dl: {url: f.link, w: f.width, h: f.height}}; }).filter(Boolean);
    }
    const j = await jfetch('https://api.pexels.com/v1/search?' + qs, {headers: {Authorization: key}, signal: ctx.signal});
    return (j.photos || []).map((p) => ({provider: 'pexels', id: String(p.id), kind: 'img', title: p.alt || 'pexels ' + p.id, thumb: p.src?.medium, w: p.width, h: p.height, author: p.photographer, authorUrl: p.photographer_url, page: p.url, dl: {url: p.src?.original, w: p.width, h: p.height}}));
  },
  async fetch(it, ctx) {
    const f = path.join(ctx.tmp, `pexels-${it.id}`);
    const r = await download(it.dl.url, f, {allow: this.allow, signal: ctx.signal});
    return {file: r.file, ext: extOf(r.type, it.dl.url), licence: {...PEXELS_LIC, credit: `${it.kind === 'video' ? 'Video' : 'Photo'} by ${it.author} on Pexels`}};
  },
};

// ── Pixabay ───────────────────────────────────────────────────────────
const PIXABAY_LIC = {name: 'Pixabay Content License', url: 'https://pixabay.com/service/license-summary/', commercial: true, attribution: 'không bắt buộc (nên ghi)', notes: 'Không bán lại nguyên bản; không dùng logo/thương hiệu/người trong ảnh theo cách gây hiểu lầm.'};
export const pixabay = {
  id: 'pixabay', label: 'Pixabay', kinds: ['img', 'video'], stock: true, keyId: 'pixabay', paid: false, licence: PIXABAY_LIC, allow: ['pixabay.com'],
  async search(q, {kind = 'img', orientation, page = 1, perPage = 24} = {}, ctx) {
    const key = needKey(ctx, 'Pixabay');
    const qs = new URLSearchParams({key, q: q.slice(0, 100), per_page: Math.max(3, perPage), page, safesearch: 'true'});
    const authorUrl = (h) => h.user && h.user_id ? `https://pixabay.com/users/${encodeURIComponent(h.user)}-${h.user_id}/` : null;
    if (kind === 'video') {
      const j = await jfetch('https://pixabay.com/api/videos/?' + qs, {signal: ctx.signal});
      return (j.hits || []).map((h) => { const v = h.videos?.large?.url ? h.videos.large : h.videos?.medium; return v?.url && {provider: 'pixabay', id: String(h.id), kind: 'video', title: h.tags || 'pixabay ' + h.id, thumb: v.thumbnail || h.videos?.tiny?.thumbnail, w: v.width, h: v.height, duration: h.duration, author: h.user, authorUrl: authorUrl(h), page: h.pageURL, dl: {url: v.url, w: v.width, h: v.height}}; }).filter(Boolean);
    }
    qs.set('image_type', 'photo'); if (orientation === 'landscape') qs.set('orientation', 'horizontal'); if (orientation === 'portrait') qs.set('orientation', 'vertical');
    const j = await jfetch('https://pixabay.com/api/?' + qs, {signal: ctx.signal});
    return (j.hits || []).map((h) => ({provider: 'pixabay', id: String(h.id), kind: 'img', title: h.tags || 'pixabay ' + h.id, thumb: h.webformatURL, w: h.imageWidth, h: h.imageHeight, author: h.user, authorUrl: authorUrl(h), page: h.pageURL, dl: {url: h.largeImageURL, w: h.imageWidth, h: h.imageHeight}}));
  },
  async fetch(it, ctx) {
    const r = await download(it.dl.url, path.join(ctx.tmp, `pixabay-${it.id}`), {allow: this.allow, signal: ctx.signal});
    return {file: r.file, ext: extOf(r.type, it.dl.url), licence: {...PIXABAY_LIC, credit: `${it.author} / Pixabay`}};
  },
};

// ── Unsplash ──────────────────────────────────────────────────────────
const UTM = '?utm_source=sami_motion_studio&utm_medium=referral';
const UNSPLASH_LIC = {name: 'Unsplash License', url: 'https://unsplash.com/license', commercial: true, attribution: 'API yêu cầu ghi "Photo by <tác giả> on Unsplash"', notes: 'Không gom ảnh để dựng dịch vụ cạnh tranh; không bán lại nguyên bản.'};
export const unsplash = {
  id: 'unsplash', label: 'Unsplash', kinds: ['img'], stock: true, keyId: 'unsplash', paid: false, licence: UNSPLASH_LIC, allow: ['unsplash.com'],
  async search(q, {orientation, page = 1, perPage = 24} = {}, ctx) {
    const key = needKey(ctx, 'Unsplash');
    const qs = new URLSearchParams({query: q, per_page: Math.min(30, perPage), page, content_filter: 'high'});
    if (orientation) qs.set('orientation', orientation === 'square' ? 'squarish' : orientation);
    const j = await jfetch('https://api.unsplash.com/search/photos?' + qs, {headers: {Authorization: 'Client-ID ' + key, 'Accept-Version': 'v1'}, signal: ctx.signal});
    return (j.results || []).map((p) => ({provider: 'unsplash', id: p.id, kind: 'img', title: p.description || p.alt_description || 'unsplash ' + p.id, thumb: p.urls?.small, w: p.width, h: p.height, author: p.user?.name, authorUrl: (p.user?.links?.html || '') + UTM, page: (p.links?.html || '') + UTM, dl: {url: p.urls?.full, w: p.width, h: p.height, track: p.links?.download_location}}));
  },
  async fetch(it, ctx) {
    const key = needKey(ctx, 'Unsplash');
    let url = it.dl.url;
    if (it.dl.track) { const t = await jfetch(it.dl.track, {headers: {Authorization: 'Client-ID ' + key}, signal: ctx.signal}); if (t?.url) url = t.url; } // API guideline: trigger the download endpoint
    const r = await download(url, path.join(ctx.tmp, `unsplash-${it.id}`), {allow: this.allow, signal: ctx.signal});
    return {file: r.file, ext: extOf(r.type, url) === '.bin' ? '.jpg' : extOf(r.type, url), licence: {...UNSPLASH_LIC, credit: `Photo by ${it.author} on Unsplash`}};
  },
};

// ── Wikimedia Commons ─────────────────────────────────────────────────
const strip = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim();
/** only licences that allow commercial use + modification */
export const wikiLicenceOk = (name) => { const n = String(name || '').trim(); return !/\b(nc|nd)\b|non-?commercial|no-?deriv|fair use/i.test(n) && /^(cc0|public domain|pd\b|pd-|cc[- ]by(-sa)?\b)/i.test(n); };
export const wikimedia = {
  id: 'wikimedia', label: 'Wikimedia Commons', kinds: ['img', 'video'], stock: true, keyId: null, paid: false, allow: ['wikimedia.org'],
  licence: {name: 'theo từng file (CC0 / PD / CC BY / CC BY-SA)', url: 'https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia', commercial: true},
  async search(q, {kind = 'img', page = 1, perPage = 30} = {}, ctx) {
    const qs = new URLSearchParams({action: 'query', format: 'json', generator: 'search', gsrnamespace: '6', gsrsearch: `${q} filetype:${kind === 'video' ? 'video' : 'bitmap'}`, gsrlimit: String(Math.min(50, perPage * 2)), gsroffset: String((page - 1) * perPage * 2), prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '480', origin: '*'});
    const j = await jfetch('https://commons.wikimedia.org/w/api.php?' + qs, {signal: ctx.signal});
    const pages = Object.values(j?.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
    const out = [];
    for (const p of pages) {
      const ii = p.imageinfo?.[0]; if (!ii) continue; const m = ii.extmetadata || {};
      const lic = strip(m.LicenseShortName?.value);
      if (!wikiLicenceOk(lic)) continue;
      const name = p.title.replace(/^File:/, '');
      const big = kind === 'img' && Math.max(ii.width, ii.height) > 3840;
      out.push({provider: 'wikimedia', id: name, kind, title: strip(m.ObjectName?.value) || name.replace(/\.[^.]+$/, ''), thumb: ii.thumburl, w: ii.width, h: ii.height, duration: ii.duration || null, author: strip(m.Artist?.value) || null, authorUrl: null, page: ii.descriptionurl,
        dl: big ? {url: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=${ii.width >= ii.height ? 3840 : Math.round(ii.width * 3840 / ii.height)}`, ...(ii.width >= ii.height ? {w: 3840, h: Math.round(ii.height * 3840 / ii.width)} : {w: Math.round(ii.width * 3840 / ii.height), h: 3840})} : {url: ii.url, w: ii.width, h: ii.height},
        licence: {name: lic, url: m.LicenseUrl?.value || null, attributionRequired: m.AttributionRequired?.value !== 'false', credit: strip(m.Credit?.value) || null}});
      if (out.length >= perPage) break;
    }
    return out;
  },
  async fetch(it, ctx) {
    if (!wikiLicenceOk(it.licence?.name)) throw new Error('Giấy phép không cho dùng thương mại/chỉnh sửa: ' + it.licence?.name);
    const r = await download(it.dl.url, path.join(ctx.tmp, 'wiki-' + it.id.replace(/[^\w.-]+/g, '_')), {allow: this.allow, signal: ctx.signal});
    const L = it.licence;
    return {file: r.file, ext: extOf(r.type, it.dl.url), licence: {name: L.name, url: L.url, commercial: true, attribution: L.attributionRequired ? 'bắt buộc ghi công' : 'không bắt buộc', credit: `${it.author || 'Unknown'} / Wikimedia Commons / ${L.name}`, notes: /sa\b/i.test(L.name) ? 'Share-alike: bản chỉnh sửa phải chia sẻ cùng giấy phép.' : null}};
  },
};

export default [pexels, pixabay, unsplash, wikimedia];
