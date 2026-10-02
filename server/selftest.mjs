// npm run check — quick self-test of the Studio install (no render, no network). Exit 1 on any failure.
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import {spawnSync} from 'child_process';
import {ROOT, TEMPLATES} from './paths.mjs';
import * as history from './history.mjs';
import {validateProject} from './validate.mjs';
import {hasFilter, FFMPEG} from './ffmpeg.mjs';

let bad = 0;
const ok = (m) => console.log('✓ ' + m);
const fail = (m) => { bad++; console.log('✗ ' + m); };
const t = async (name, fn) => { try { const r = await fn(); ok(name + (r ? ' — ' + r : '')); } catch (e) { fail(name + ' — ' + e.message); } };
const sha = (f) => crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex');

await t('dependencies installed', () => { const r = spawnSync(process.execPath, [path.join(ROOT, 'server', 'check-deps.cjs')], {encoding: 'utf8'}); if (r.status) throw new Error(r.stdout.trim()); });
await t('server modules parse', () => { for (const f of fs.readdirSync(path.join(ROOT, 'server')).filter((x) => /\.m?js$/.test(x))) { const r = spawnSync(process.execPath, ['--check', path.join(ROOT, 'server', f)], {encoding: 'utf8'}); if (r.status) throw new Error(f + ': ' + r.stderr.split('\n').slice(0, 3).join(' ')); } });
await t('ui/app.js parses', () => { const r = spawnSync(process.execPath, ['--check', path.join(ROOT, 'ui', 'app.js')], {encoding: 'utf8'}); if (r.status) throw new Error(r.stderr.split('\n').slice(0, 3).join(' ')); });
await t('ffmpeg + loudnorm filter (chuẩn −14 LUFS)', () => { if (!FFMPEG) throw new Error('không thấy ffmpeg'); if (!hasFilter('loudnorm')) throw new Error('ffmpeg thiếu loudnorm → xuất video sẽ bỏ qua bước chuẩn âm lượng'); });
const tpls = fs.readdirSync(TEMPLATES).filter((d) => fs.existsSync(path.join(TEMPLATES, d, 'project.json')));
await t(`validate runs on ${tpls.length} templates`, () => { for (const d of tpls) validateProject(path.join(TEMPLATES, d)); });

await t('variants: copy override (CSV row) keeps project.json intact', async () => {
  const {applyCopy} = await import('./render.mjs');
  const p = {copy: {A: {label: 'a', value: 'gốc'}, B: {label: 'b', value: 'giữ'}}};
  const q = applyCopy(p, {A: 'Phở Hà Nội', B: '', X: 'bỏ qua'});
  if (q.copy.A.value !== 'Phở Hà Nội' || q.copy.B.value !== 'giữ' || q.copy.X || p.copy.A.value !== 'gốc') throw new Error(JSON.stringify(q));
});
await t('shared template ids resolve', async () => {
  const {tplDir} = await import('./template.mjs');
  if (path.resolve(tplDir(tpls[0])) !== path.resolve(TEMPLATES, tpls[0])) throw new Error('library id');
  if (!tplDir('../../etc').startsWith(TEMPLATES)) throw new Error('path escape');
});

// version history round trip on a throw-away copy of a template
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sami-selftest-'));
try {
  fs.cpSync(path.join(TEMPLATES, tpls[0]), tmp, {recursive: true});
  const pj = path.join(tmp, 'project.json'), media = path.join(tmp, 'public', 'img', 'selftest.bin');
  fs.mkdirSync(path.dirname(media), {recursive: true}); fs.writeFileSync(media, crypto.randomBytes(4096));
  const before = {pj: sha(pj), media: sha(media)};
  let a;
  await t('history: snapshot', async () => { a = await history.snapshot(tmp, {kind: 'manual', label: 'A', force: true}); return `${a.files} tệp, ${a.ms} ms`; });
  await t('history: unchanged → skipped', async () => { const r = await history.snapshot(tmp, {kind: 'save'}); if (!r.skipped) throw new Error('expected skip'); });
  fs.writeFileSync(media, crypto.randomBytes(4096)); fs.appendFileSync(pj, '\n'); fs.writeFileSync(path.join(tmp, 'public', 'img', 'added.bin'), 'x');
  await t('history: snapshot after edits', async () => { const r = await history.snapshot(tmp, {kind: 'ai'}); if (r.skipped) throw new Error('changes not seen'); });
  await t('history: restore whole project', async () => {
    const r = await history.restore(tmp, a.id);
    if (sha(pj) !== before.pj || sha(media) !== before.media) throw new Error('content differs after restore');
    if (fs.existsSync(path.join(tmp, 'public', 'img', 'added.bin'))) throw new Error('file added later was not removed');
    return `${r.written} ghi, ${r.deleted} xoá`;
  });
  await t('history: restore is undoable', async () => { const L = await history.list(tmp); const prev = L.find((x) => x.kind === 'ai'); await history.restore(tmp, prev.id, {paths: ['public/img/added.bin']}); if (!fs.existsSync(path.join(tmp, 'public', 'img', 'added.bin'))) throw new Error('partial restore failed'); });
} finally { fs.rmSync(tmp, {recursive: true, force: true}); }

console.log(bad ? `\n${bad} lỗi` : '\nTất cả đạt ✓');
process.exit(bad ? 1 : 0);
