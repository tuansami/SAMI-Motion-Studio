// Gateway rules self-test (run by server/selftest.mjs in a child process with SAMI_PROVIDERS_TEST=1 and throw-away
// SAMI_USERDATA / SAMI_LIBRARY folders). No network, no money. Prints one line per check, exit 1 on any failure.
import fs from 'fs';
import path from 'path';

if (process.env.SAMI_PROVIDERS_TEST !== '1' || !process.env.SAMI_USERDATA || !process.env.SAMI_LIBRARY) { console.error('chạy qua npm run check'); process.exit(2); }
const {KEYS} = await import('./config.mjs');
for (const k of Object.values(KEYS)) for (const n of k.env) delete process.env[n]; // keys on this machine must not leak into the test
const G = await import('./gateway.mjs');
let bad = 0;
const t = async (name, fn) => { try { const r = await fn(); console.log('✓ ' + name + (r ? ' — ' + r : '')); } catch (e) { bad++; console.log('✗ ' + name + ' — ' + e.message); } };
const throws = async (fn, re) => { try { await fn(); } catch (e) { if (re && !re.test(e.message)) throw new Error('sai lỗi: ' + e.message); return; } throw new Error('lẽ ra phải bị từ chối'); };
const req = {provider: 'mock-paid', prompt: 'test', n: 2};

await t('providers: every adapter has id/kinds/estimate|search', () => { for (const a of G.ADAPTERS) if (!a.id || !a.kinds?.length || !(a.estimate || a.search)) throw new Error(a.id || '?'); if (G.ADAPTERS.some((a) => /eleven/.test(a.id) && a.kinds.includes('img'))) throw new Error('ElevenLabs không được sinh ảnh'); return G.ADAPTERS.length + ' nguồn'; });
await t('paid generate without token → refused', () => throws(() => G.generate(req), /mã xác nhận/));
await t('paid key missing → no estimate, no token', () => throws(() => G.estimate({provider: 'openai-image', prompt: 'x'}), /Chưa có khoá/));
let tok;
await t('estimate issues a one-time token', async () => { const e = await G.estimate(req); if (!/^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(e.token) || e.usd !== 1) throw new Error(JSON.stringify(e)); tok = e.token; });
await t('token bound to the exact request', () => throws(() => G.generate({...req, n: 3}, {token: tok}), /không khớp/));
let out;
await t('generate with token → files + meta in SAMI_Library', async () => {
  out = await G.generate(req, {token: tok, confirmedBy: 'selftest'});
  if (out.files.length !== 2 || !out.files[0].uri?.startsWith('lib:img/mock-paid/')) throw new Error(JSON.stringify(out.files[0]));
  const m = JSON.parse(fs.readFileSync(out.files[0].path + '.meta.json', 'utf8'));
  for (const k of ['provider', 'model', 'prompt', 'usd', 'licence', 'sha256', 'confirmedBy', 'created']) if (m[k] == null) throw new Error('meta thiếu ' + k);
  return `${out.usd} USD (thực tế)`;
});
await t('token cannot be reused', () => throws(() => G.generate(req, {token: tok}), /không tồn tại hoặc đã dùng/));
await t('daily cap blocks the estimate (2 USD/ngày)', async () => { const e = await G.estimate({...req, n: 3}); if (!e.blocked || e.token) throw new Error('không chặn'); });
await t('failed paid call: token burnt, cost counted, no retry', async () => {
  const r = {provider: 'mock-paid', prompt: 'fail', n: 1, opts: {fail: true}}; const e = await G.estimate(r);
  await throws(() => G.generate(r, {token: e.token}), /mock lỗi/);
  await throws(() => G.generate(r, {token: e.token}), /đã dùng/);
  const s = G.ledgerSummary(); if (Math.abs(s.day - 1.3) > 1e-6) throw new Error('đã dùng ' + s.day);
});
await t('free adapter runs without token; project destination', async () => {
  const proj = fs.mkdtempSync(path.join(process.env.SAMI_USERDATA, 'proj-')); fs.writeFileSync(path.join(proj, 'project.json'), '{}');
  const r = await G.generate({provider: 'mock-free', prompt: 'x', dest: proj}); if (!r.files[0].rel?.startsWith('img/mock-free/')) throw new Error(JSON.stringify(r.files[0]));
  await throws(() => G.generate({provider: 'mock-free', prompt: 'x', dest: path.join(proj, 'nope')}), /project\.json/);
});
await t('stock fetch writes licence + author meta', async () => { const s = await G.searchStock({provider: 'mock-stock', q: 'pho'}); const f = await G.fetchStock(s.items[0], {confirmedBy: 'selftest'}); if (f.meta.licence?.credit !== 'Tester' || !f.meta.source?.url) throw new Error(JSON.stringify(f.meta)); });
await t('web providers cannot run in the gateway; ingest copies with meta', async () => {
  await throws(() => G.generate({provider: 'chatgpt-web', prompt: 'x'}), /trình duyệt/);
  const src = path.join(process.env.SAMI_USERDATA, 'dl.png'); fs.copyFileSync(out.files[0].path, src);
  const r = G.ingestFile({file: src, provider: 'chatgpt-web', prompt: '5 ảnh phở', confirmedBy: 'selftest'}); if (!fs.existsSync(src) || r.meta.provider !== 'chatgpt-web' || !r.meta.licence) throw new Error(JSON.stringify(r.meta));
});
const {wikiLicenceOk} = await import('./adapters/stock.mjs');
await t('Wikimedia licence filter', () => { const ok = ['CC0', 'Public domain', 'CC BY 4.0', 'CC BY-SA 3.0'], no = ['CC BY-NC 4.0', 'CC BY-ND 2.0', 'CC BY-NC-SA 4.0', 'Fair use', 'GFDL']; for (const x of ok) if (!wikiLicenceOk(x)) throw new Error(x); for (const x of no) if (wikiLicenceOk(x)) throw new Error(x); });
process.exit(bad ? 1 : 0);
