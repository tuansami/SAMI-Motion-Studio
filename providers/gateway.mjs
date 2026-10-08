// AI / stock gateway: the ONLY way the Studio, CLI and MCP server reach media providers.
//   estimate(req)                → cost + (paid) a one-time confirm token bound to this exact request
//   generate(req, {token})       → paid adapters refuse without a valid token; caps re-checked; one paid run at a time
//   searchStock / fetchStock     → free stock with licence filter
//   ingestFile                   → files downloaded by hand / by a browser recipe get the same meta
// Every output lands in SAMI_Library/assets/<kind>/<provider>/ (default) or <project>/public/<sub>/<provider>/
// next to a <file>.meta.json (prompt, model, cost, licence, source, sha256, who confirmed).
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {ROOT, cacheDir} from '../server/paths.mjs';
import * as library from '../server/library.mjs';
import {getKey, keySource, getOpts, KEYS} from './config.mjs';
import * as ledger from './ledger.mjs';
import * as tokens from './tokens.mjs';
import {prices} from './pricing.mjs';
import stock from './adapters/stock.mjs';
import local from './adapters/local.mjs';
import eleven from './adapters/elevenlabs.mjs';
import images from './adapters/images.mjs';
import web from './adapters/web.mjs';
import mock from './adapters/mock.mjs';

export const ADAPTERS = [...stock, ...local, ...eleven, ...images, ...web, ...(process.env.SAMI_PROVIDERS_TEST === '1' ? mock : [])];
export const KINDS = ['img', 'video', 'music', 'sfx', 'voice'];
const VERSION = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version; } catch { return '?'; } })();
export const get = (id) => { const a = ADAPTERS.find((x) => x.id === id); if (!a) throw new Error(`Không có nguồn "${id}". Có: ${ADAPTERS.map((x) => x.id).join(', ')}`); return a; };

const needKey = (a) => { if (a.keyId && !keySource(a.keyId)) throw new Error(`Chưa có khoá ${KEYS[a.keyId]?.label || a.keyId}. Tuấn nhập trong Studio → tab "Nguồn & AI" → Khoá API.`); };
const tmpDir = () => fs.mkdtempSync(path.join(cacheDir('providers'), 'run-'));
const ctxFor = async (a, {signal, onProgress, tmp, withKey = true} = {}) => ({key: a.keyId && withKey ? await getKey(a.keyId) : null, opts: {...(a.defaults || {}), ...getOpts(a.id)}, prices: prices(), signal, onProgress, tmp});

// ── request normalisation (the token is bound to this exact shape) ─────
const clean = (o) => JSON.parse(JSON.stringify(o ?? {}));
export const normalize = (r = {}) => {
  const a = get(r.provider);
  const kind = r.kind || a.kinds[0];
  if (!a.kinds.includes(kind)) throw new Error(`${a.label} không làm "${kind}" (chỉ: ${a.kinds.join(', ')})`);
  const out = {provider: a.id, kind, prompt: String(r.prompt ?? '').trim(), n: Math.max(1, Math.round(+r.n || 1))};
  for (const k of ['model', 'ratio', 'voice']) if (r[k]) out[k] = String(r[k]);
  if (r.seconds != null && r.seconds !== '') out.seconds = +r.seconds;
  if (r.opts && Object.keys(r.opts).length) out.opts = clean(r.opts);
  out.dest = destOf(r.dest);
  return out;
};
const destOf = (d) => {
  if (!d || d === 'library' || d.to === 'library') return {to: 'library'};
  const dir = path.resolve(typeof d === 'string' ? d : d.dir || '');
  if (!fs.existsSync(path.join(dir, 'project.json'))) throw new Error('Đích không phải thư mục dự án (thiếu project.json): ' + dir);
  return {to: 'project', dir};
};

// ── listing ───────────────────────────────────────────────────────────
export const listProviders = async ({probe = true} = {}) => Promise.all(ADAPTERS.map(async (a) => {
  const src = a.keyId ? keySource(a.keyId) : null;
  let available = !a.keyId || !!src, reason = a.keyId && !src ? `Chưa có khoá ${KEYS[a.keyId]?.label || a.keyId}` : null;
  if (available && probe && a.available) { try { const r = await a.available({opts: {...(a.defaults || {}), ...getOpts(a.id)}}); available = r.ok; reason = r.reason || null; } catch (e) { available = false; reason = e.message; } }
  return {id: a.id, label: a.label, kinds: a.kinds, paid: !!a.paid, free: !!a.free || !a.paid, stock: !!a.stock, local: !!a.local, web: !!a.web, needsHuman: !!a.needsHuman, recipe: a.recipe || null,
    keyId: a.keyId || null, keySource: src, available, reason, models: a.models || null, defaults: a.defaults || {}, voices: a.voices || null, licence: a.licence || null};
}));

// ── estimate → token ──────────────────────────────────────────────────
export const estimate = async (raw) => {
  const req = normalize(raw); const a = get(req.provider);
  if (a.stock) throw new Error(`${a.label} là kho stock: dùng search/fetch`);
  if (!a.web) needKey(a);
  const ctx = await ctxFor(a, {withKey: false});
  const e = await a.estimate(req, ctx);
  const usd = +e.usd || 0; const s = ledger.spent();
  const out = {request: req, provider: a.id, label: a.label, paid: !!a.paid, web: !!a.web, recipe: a.recipe || null, usd, units: e.units, notes: e.notes || null, spent: {day: s.day, month: s.month}, caps: s.caps};
  if (!a.paid) return out;
  const blocked = ledger.capCheck(usd, s);
  if (blocked) return {...out, blocked};
  const summary = `${a.label} · ${req.kind} · ${e.units} · ≈ ${usd.toFixed(3)} USD`;
  return {...out, ...tokens.issue(req, {usd, summary}), summary};
};

// ── run ───────────────────────────────────────────────────────────────
export const generate = async (raw, {token, confirmedBy = 'unknown', signal, onProgress} = {}) => {
  const req = normalize(raw); const a = get(req.provider);
  if (a.stock) throw new Error(`${a.label} là kho stock: dùng fetch`);
  if (a.web) throw new Error(`${a.label} chạy bằng trình duyệt theo ${a.recipe}, rồi ingest file tải về.`);
  needKey(a);
  const tmp = tmpDir();
  let release = null, est = {usd: 0};
  try {
    const ctx = await ctxFor(a, {signal, onProgress, tmp});
    est = await a.estimate(req, ctx);
    if (a.paid) {
      const blocked = ledger.capCheck(+est.usd || 0); if (blocked) throw new Error(blocked);
      tokens.consume(token, req);               // burnt now: an error below never leaves a reusable token
      release = tokens.acquire(`${a.id} ${req.kind}`);
    }
    onProgress?.({msg: `${a.label}: đang tạo…`});
    let res;
    try { res = await a.run(req, ctx); }
    catch (e) {
      const sent = !!e.sent || ['TimeoutError', 'AbortError'].includes(e.name) || e.cause?.code === 'UND_ERR_SOCKET';
      ledger.append({provider: a.id, model: req.model || a.defaults?.model || null, kind: req.kind, est: est.usd, actual: null, status: 'error', sent: a.paid && sent, project: req.dest.dir || null, confirmedBy, note: String(e.message).slice(0, 300)});
      throw e;
    }
    const row = ledger.append({provider: a.id, model: res.model || req.model || null, kind: req.kind, est: est.usd, actual: res.usd ?? null, status: 'ok', sent: true, project: req.dest.dir || null, n: res.files.length, confirmedBy}); // cost first: recorded even if saving the files fails
    const files = [];
    for (const f of res.files) files.push(ingest(f.file, {
      title: f.title || req.prompt.slice(0, 60), kind: req.kind, provider: a.id, providerLabel: a.label, model: res.model || req.model || null,
      prompt: req.prompt, params: {n: req.n, ratio: req.ratio, seconds: req.seconds, voice: req.voice, opts: req.opts}, extra: res.meta || null,
      usd: +(((res.usd ?? est.usd) || 0) / res.files.length).toFixed(4), usdEstimated: res.usd == null, licence: a.licence || null,
      source: {provider: a.id, prompt: req.prompt}, tags: req.opts?.tags || [], confirmedBy, ledgerTs: row.ts,
    }, req.dest, f.ext));
    return {files, usd: row.charged, estimated: est.usd, units: est.units, ledger: row};
  } finally {
    release?.();
    fs.rmSync(tmp, {recursive: true, force: true});
  }
};

// ── stock ─────────────────────────────────────────────────────────────
export const STOCK_ORDER = ['pexels', 'pixabay', 'unsplash', 'wikimedia'];
export const searchStock = async ({provider = 'auto', q, kind = 'img', orientation, page = 1, perPage = 24, signal} = {}) => {
  if (!String(q || '').trim()) throw new Error('Chưa có từ khoá');
  const ids = provider === 'auto' ? STOCK_ORDER.filter((id) => { const a = get(id); return a.kinds.includes(kind) && (!a.keyId || keySource(a.keyId)); }) : [provider];
  const items = [], errors = [];
  for (const id of ids) { // sequential: polite to free APIs
    const a = get(id); if (!a.stock) throw new Error(id + ' không phải kho stock');
    if (!a.kinds.includes(kind)) { errors.push(`${a.label}: không có ${kind}`); continue; }
    try { items.push(...(await a.search(String(q).trim(), {kind, orientation, page, perPage: provider === 'auto' ? Math.ceil(perPage / ids.length) + 2 : perPage}, await ctxFor(a, {signal})))); }
    catch (e) { errors.push(`${a.label}: ${e.message}`); }
  }
  return {items, errors, providers: ids};
};
export const fetchStock = async (item, {dest, confirmedBy = 'unknown', signal} = {}) => {
  const a = get(item?.provider); if (!a.stock) throw new Error('Không phải mục stock');
  if (!item.dl?.url) throw new Error('Thiếu link tải');
  const d = destOf(dest); const tmp = tmpDir();
  try {
    const r = await a.fetch(item, await ctxFor(a, {signal, tmp}));
    ledger.append({provider: a.id, model: null, kind: item.kind, est: 0, actual: 0, status: 'ok', sent: true, project: d.dir || null, confirmedBy, note: item.page || null});
    return ingest(r.file, {
      title: item.title, kind: item.kind, provider: a.id, providerLabel: a.label, model: null, prompt: null, usd: 0, usdEstimated: false,
      licence: r.licence || a.licence, source: {provider: a.id, id: item.id, url: item.page, author: item.author || null, authorUrl: item.authorUrl || null, downloadUrl: item.dl.url.replace(/([?&](key|client_id)=)[^&]+/gi, '$1…')},
      tags: String(item.title || '').split(/[,\s]+/).filter((w) => w.length > 2).slice(0, 12), w: item.dl.w || item.w || null, h: item.dl.h || item.h || null, duration: item.duration ?? null, confirmedBy,
    }, d, r.ext);
  } finally { fs.rmSync(tmp, {recursive: true, force: true}); }
};

// ── ingest (generated, stock, or downloaded by hand / browser recipe) ──
const SUB = {img: 'img', video: 'video', music: 'audio', sfx: 'audio', voice: 'audio'};
const LIBKIND = {img: 'img', video: 'video', music: 'music', sfx: 'sfx', voice: 'voice'};
const slug = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 40) || 'file';
export const ingest = (src, meta, dest, ext) => {
  const d = destOf(dest); const kind = meta.kind; if (!SUB[kind]) throw new Error('Loại không hợp lệ: ' + kind);
  ext = (ext || path.extname(src) || '.bin').toLowerCase();
  const buf = fs.readFileSync(src); const sha = crypto.createHash('sha256').update(buf).digest('hex');
  const base = `${slug(meta.title)}-${sha.slice(0, 8)}${ext}`;
  const folder = d.to === 'library' ? path.join(library.ASSETS, LIBKIND[kind], meta.provider) : path.join(d.dir, 'public', SUB[kind], meta.provider);
  fs.mkdirSync(folder, {recursive: true});
  const file = path.join(folder, base); const existed = fs.existsSync(file);
  if (!existed) fs.writeFileSync(file, buf);
  const full = {...meta, file: base, sha256: sha, bytes: buf.length, created: new Date().toISOString(), app: 'SAMI Motion Studio ' + VERSION};
  for (const k of Object.keys(full)) if (full[k] == null || (typeof full[k] === 'object' && !Array.isArray(full[k]) && !Object.keys(full[k]).length)) delete full[k];
  if (!existed || !fs.existsSync(library.metaPath(file))) library.writeMeta(file, full);
  if (d.to === 'library') { try { library.rebuildIndex(); } catch {} }
  const rel = path.relative(d.to === 'library' ? library.ASSETS : path.join(d.dir, 'public'), file).replace(/\\/g, '/');
  return {path: file, dest: d.to, uri: d.to === 'library' ? 'lib:' + rel : null, rel: d.to === 'project' ? rel : null, duplicate: existed, meta: full};
};
/** a file the user / a browser recipe downloaded → library or project, with meta. Copies; never deletes the source. */
export const ingestFile = ({file, provider = 'manual', kind, prompt = null, model = null, title, dest, note, confirmedBy = 'unknown'} = {}) => {
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) throw new Error('Không thấy file: ' + file);
  const a = provider === 'manual' ? {id: 'manual', label: 'Nhập tay', licence: null, kinds: KINDS} : get(provider);
  kind = kind || a.kinds[0]; if (!SUB[kind]) throw new Error('Loại không hợp lệ: ' + kind);
  const d = destOf(dest);
  const r = ingest(file, {title: title || prompt?.slice(0, 60) || path.basename(file, path.extname(file)), kind, provider: a.id, providerLabel: a.label, model, prompt, usd: 0, usdEstimated: false, licence: a.licence, source: {provider: a.id, prompt, original: path.basename(file)}, note: note || null, confirmedBy}, d, path.extname(file));
  ledger.append({provider: a.id, model, kind, est: 0, actual: 0, status: 'ok', sent: false, project: d.dir || null, files: [path.basename(file)], out: r.uri || r.rel, confirmedBy, note: note || 'ingest'});
  return r;
};

export const ledgerSummary = ledger.summary;
export const pendingTokens = tokens.pending;
