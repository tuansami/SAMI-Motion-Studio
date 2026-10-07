// Network helpers for adapters: JSON calls with timeout, streaming downloads, host allow-list for downloads.
import fs from 'fs';
import path from 'path';
import {Readable} from 'stream';
import {pipeline} from 'stream/promises';

export const UA = 'SAMI-Motion-Studio/0.8 (+https://github.com/tuansami/SAMI-Motion-Studio)';

const withTimeout = (signal, ms) => { const t = AbortSignal.timeout(ms); return signal ? AbortSignal.any([signal, t]) : t; };
/** fetch → parsed JSON; throws with the provider's error text (keys are never echoed: we only print the body) */
export const jfetch = async (url, {method = 'GET', headers = {}, body, signal, timeout = 60000} = {}) => {
  const r = await fetch(url, {method, headers: {'User-Agent': UA, ...(body && !(body instanceof Uint8Array) ? {'Content-Type': 'application/json'} : {}), ...headers}, body: body && typeof body === 'object' && !(body instanceof Uint8Array) ? JSON.stringify(body) : body, signal: withTimeout(signal, timeout)});
  const text = await r.text();
  let j = null; try { j = text ? JSON.parse(text) : null; } catch {}
  if (!r.ok) throw Object.assign(new Error(`${new URL(url).host} trả lỗi ${r.status}: ${(j?.error?.message || j?.detail?.message || j?.message || j?.detail || j?.error || text || '').toString().slice(0, 300)}`), {status: r.status, sent: true});
  return j ?? text;
};
/** fetch → Buffer (+ response headers) */
export const bfetch = async (url, {method = 'GET', headers = {}, body, signal, timeout = 180000} = {}) => {
  const r = await fetch(url, {method, headers: {'User-Agent': UA, ...(body ? {'Content-Type': 'application/json'} : {}), ...headers}, body: body ? JSON.stringify(body) : undefined, signal: withTimeout(signal, timeout)});
  if (!r.ok) { const t = await r.text().catch(() => ''); throw Object.assign(new Error(`${new URL(url).host} trả lỗi ${r.status}: ${t.slice(0, 300)}`), {status: r.status, sent: true}); }
  return {buf: Buffer.from(await r.arrayBuffer()), headers: r.headers, type: r.headers.get('content-type') || ''};
};
/** stream a URL to a file; refuses hosts outside `allow` (suffix match) and files above maxBytes */
export const download = async (url, dest, {allow = null, headers = {}, signal, timeout = 600000, maxBytes = 2e9} = {}) => {
  const u = new URL(url);
  if (u.protocol !== 'https:' && !(u.protocol === 'http:' && /^(127\.0\.0\.1|localhost)$/.test(u.hostname))) throw new Error('Chỉ tải qua https: ' + u.host);
  if (allow && !allow.some((h) => u.hostname === h || u.hostname.endsWith('.' + h))) throw new Error('Host không nằm trong danh sách được phép tải: ' + u.hostname);
  const r = await fetch(url, {headers: {'User-Agent': UA, ...headers}, signal: withTimeout(signal, timeout), redirect: 'follow'});
  if (!r.ok || !r.body) throw new Error(`Tải ${u.host} lỗi ${r.status}`);
  const len = +r.headers.get('content-length') || 0; if (len > maxBytes) throw new Error(`File quá lớn (${(len / 1e6).toFixed(0)} MB)`);
  fs.mkdirSync(path.dirname(dest), {recursive: true});
  const tmp = dest + '.part';
  await pipeline(Readable.fromWeb(r.body), fs.createWriteStream(tmp));
  fs.renameSync(tmp, dest);
  return {file: dest, type: r.headers.get('content-type') || '', bytes: fs.statSync(dest).size};
};
export const sleep = (ms, signal) => new Promise((ok, bad) => { const t = setTimeout(ok, ms); signal?.addEventListener('abort', () => { clearTimeout(t); bad(new Error('Đã huỷ')); }, {once: true}); });
export const extOf = (type, url = '') => {
  const m = {'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif', 'video/mp4': '.mp4', 'video/webm': '.webm', 'audio/mpeg': '.mp3', 'audio/mp3': '.mp3', 'audio/wav': '.wav', 'audio/x-wav': '.wav', 'audio/wave': '.wav', 'audio/flac': '.flac', 'audio/ogg': '.ogg'}[String(type).split(';')[0].trim().toLowerCase()];
  if (m) return m;
  const e = path.extname(new URL(url, 'http://x').pathname).toLowerCase();
  return /^\.(png|jpe?g|webp|gif|mp4|webm|mov|mp3|wav|flac|ogg|m4a|ogv|svg|tiff?)$/.test(e) ? e.replace('.jpeg', '.jpg') : '.bin';
};
