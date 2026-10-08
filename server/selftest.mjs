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

// ── 0.6: engines, library, links, caps ──
await t('hyperframes installed + runtime present', async () => { const {HF_VERSION, HF_RUNTIME, HF_BIN} = await import('./hf.mjs'); if (!HF_VERSION || !fs.existsSync(HF_RUNTIME) || !fs.existsSync(HF_BIN)) throw new Error('npm install'); return HF_VERSION; });
await t('HTML scene staging (hf-starter): root sized/timed + SAMI data + runtime only in preview', async () => {
  const {stageHtml, sceneSpan} = await import('./hf.mjs');
  const dir = path.join(TEMPLATES, 'hf-starter'); const p = JSON.parse(fs.readFileSync(path.join(dir, 'project.json'), 'utf8'));
  const s = p.scenes[0]; const r = stageHtml(dir, p, s, '9:16', 30); const pv = stageHtml(dir, p, s, '9:16', 30, {preview: true});
  const dur = sceneSpan(p, s).dur.toFixed(4);
  if (!/data-width="1080"/.test(r) || !/data-height="1920"/.test(r) || !r.includes(`data-duration="${dur}"`)) throw new Error('root attrs');
  if (!r.includes('window.SAMI=') || !r.includes('_sami/sami-hf.js') || r.includes('_hfrt.js')) throw new Error('render staging');
  if (!pv.includes('_hfrt.js') || !pv.includes('_sami/shim.js') || !pv.includes('__samiData')) throw new Error('preview staging');
});
await t('validate: hf-starter has no ✗', async () => { const v = validateProject(path.join(TEMPLATES, 'hf-starter')); if (v.fail.length) throw new Error(v.fail.join(' | ')); });
await t('library: lib: URIs resolve inside SAMI_Library only', async () => {
  const L = await import('./library.mjs');
  if (!L.resolveLib('lib:sfx/a.mp3')?.endsWith(path.join('sfx', 'a.mp3'))) throw new Error('resolve');
  if (L.resolveLib('lib:../../etc/passwd') !== null || L.resolveLib('img/a.jpg') !== null) throw new Error('escape');
  const refs = [...'{"src":"lib:sfx/eleven/pop.mp3"} media(\'lib:img/a b.jpg\') lib:music/x.wav'.matchAll(L.LIB_RE)].map((m) => m[1]);
  if (refs.join('|') !== 'sfx/eleven/pop.mp3|music/x.wav') throw new Error('regex: ' + refs.join('|'));
});
await t('hardlink helper: same file, 0 extra bytes (same drive)', async () => {
  const {linkOrCopy} = await import('./fslink.mjs');
  const d = fs.mkdtempSync(path.join(ROOT, '.studio', 'lt-')); try {
    fs.writeFileSync(path.join(d, 'a.bin'), crypto.randomBytes(1000));
    const r = linkOrCopy(path.join(d, 'a.bin'), path.join(d, 'sub', 'b.bin'));
    const [x, y] = [fs.statSync(path.join(d, 'a.bin')), fs.statSync(path.join(d, 'sub', 'b.bin'))];
    if (r === 'link' && x.ino !== y.ino) throw new Error('not a link'); if (sha(path.join(d, 'a.bin')) !== sha(path.join(d, 'sub', 'b.bin'))) throw new Error('content');
    return r;
  } finally { fs.rmSync(d, {recursive: true, force: true}); }
});
await t('carousel: slide = exact loop, toolkit + audio injected, template valid', async () => {
  const {stageHtml, sceneSpan} = await import('./hf.mjs');
  const dir = path.join(TEMPLATES, 'carousel-sami'); const p = JSON.parse(fs.readFileSync(path.join(dir, 'project.json'), 'utf8'));
  const s = p.scenes[1]; const sp = sceneSpan(p, s);
  if (sp.a !== s.start || sp.b !== s.end) throw new Error('span');
  const h = stageHtml(dir, p, s, '4:5', 30, {audio: '_audio/mix.wav'});
  if (!h.includes('_sami/carousel.js') || !h.includes('id="sami-mix"') || !h.includes('"slide":{"index":1')) throw new Error('staging');
  const v = validateProject(dir); if (v.fail.length) throw new Error(v.fail.join(' | '));
});
await t('python audio synth (numpy): seamless 2 s mix', async () => {
  const d = fs.mkdtempSync(path.join(ROOT, '.studio', 'au-')); try {
    fs.writeFileSync(path.join(d, 's.json'), JSON.stringify({dur: 2, out: 'm.wav', groove: {intensity: 0.7}, events: [{t: 0.5, fx: 'pop'}, {t: 1.9, fx: 'chime'}]}));
    const r = spawnSync(process.env.SAMI_PYTHON || 'python', [path.join(ROOT, 'lib', 'py', 'sami_audio.py'), 'mix', path.join(d, 's.json')], {encoding: 'utf8'});
    if (r.status !== 0) throw new Error((r.stderr || r.stdout || 'python?').slice(-200));
    const n = fs.statSync(path.join(d, 'm.wav')).size; if (Math.abs(n - (44 + 2 * 48000 * 4)) > 64) throw new Error('length ' + n);
  } finally { fs.rmSync(d, {recursive: true, force: true}); }
});
// ── 0.8 / 0.8.2: AI gateway = the sami-media package (../MCP-sami-media); its own tests use throw-away folders, no network ──
{
  const pkg = path.join(ROOT, 'node_modules', 'sami-media');
  if (!fs.existsSync(path.join(pkg, 'test', 'run.mjs'))) fail('sami-media chưa cài (npm install; cần thư mục ../MCP-sami-media)');
  else {
    const r = spawnSync(process.execPath, [path.join(pkg, 'test', 'run.mjs')], {encoding: 'utf8', cwd: fs.realpathSync(pkg)});
    for (const line of (r.stdout || '').split('\n').filter((l) => /^[✓✗]/.test(l))) line.startsWith('✗') ? fail('sami-media: ' + line.slice(2)) : ok('sami-media: ' + line.slice(2));
    if (r.status && !/✗/.test(r.stdout || '')) fail('sami-media test — ' + (r.stderr || '').slice(-300));
  }
}
await t('Studio and sami-media share one SAMI_Library', async () => { const L = await import('./library.mjs'); const P = await import('./paths.mjs'); if (path.resolve(L.ASSETS) !== path.join(P.LIBRARY, 'assets')) throw new Error(L.ASSETS); return P.LIBRARY; });
await t('no second copy of the gateway in the Studio', () => { if (fs.existsSync(path.join(ROOT, 'providers'))) throw new Error('providers/ vẫn còn: mã cổng AI chỉ nằm trong sami-media'); });
// ── 0.8.1: Claude Code never renders without the Studio switch + Tuấn's request ──
await t('cli-render / cli-carousel refuse without --request', () => {
  for (const [f, a] of [['cli-render.mjs', [path.join(TEMPLATES, 'hf-starter')]], ['cli-carousel.mjs', [path.join(TEMPLATES, 'carousel-sami'), 'render']]]) {
    const r = spawnSync(process.execPath, [path.join(ROOT, 'server', f), ...a], {encoding: 'utf8', env: {...process.env, STUDIO_PORT: '1'}});
    if (r.status === 0 || !/--request/.test(r.stderr)) throw new Error(f + ' không từ chối: ' + (r.stderr || r.stdout).slice(0, 200));
  }
});
// ── 0.8.3: khuôn + dây chuyền ──
await t('khuôn: khuon.json + scene.html follow the rules', async () => {
  const {listKhuon, KHUON_DIR, GROUPS, THEMES} = await import('./khuon.mjs');
  const L = listKhuon(); if (L.length < 16) throw new Error('chỉ có ' + L.length + ' khuôn');
  for (const k of L) {
    const html = fs.readFileSync(path.join(KHUON_DIR, k.id, 'scene.html'), 'utf8'), bad = (m) => { throw new Error(`${k.id}: ${m}`); };
    if (!GROUPS[k.group]) bad('nhóm lạ ' + k.group);
    if (!k.themes?.length || k.themes.some((t) => !THEMES.includes(t))) bad('theme lạ');
    if (!(k.beats >= 4)) bad('beats');
    const slots = k.slots.map((s) => s.slot); if (new Set(slots).size !== slots.length) bad('slot trùng');
    for (const s of k.slots) if (s.type === 'image' && !/(_image|_logo|_img|_photo)$/.test(s.slot) && s.slot !== 'logo') bad(`slot ảnh "${s.slot}" phải kết thúc bằng _photo / _logo (tab Chữ nhận ra ô ảnh)`);
    if (!/data-composition-id=/.test(html) || !/_sami\/khuon\/kit\.js/.test(html) || !/K\.bind\(|S\.K\.bind\(/.test(html)) bad('thiếu root / kit / K.bind');
    if (/Math\.random|Date\.now|new Date|requestAnimationFrame|setInterval|https?:\/\//.test(html.replace(/<!--[\s\S]*?-->/g, '').replace(/xmlns='http:\/\/www\.w3\.org\/2000\/svg'/g, ''))) bad('có ngẫu nhiên / thời gian thật / CDN');
    for (const m of html.matchAll(/data-slot(?:-img)?="([\w]+)"/g)) if (!slots.includes(m[1])) bad('scene.html dùng slot không khai báo: ' + m[1]);
  }
  return L.length + ' khuôn';
});
await t('khuôn: thêm cảnh, đổi khuôn giữ chữ cùng tên, đổi lại khôi phục chữ', async () => {
  const {buildProject, applyKhuon} = await import('./khuon.mjs');
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'sami-kh-'));
  try {
    const p = buildProject(d, {name: 't', formats: ['9:16'], scenes: [{khuon: 'hook-words', values: {headline: 'Xin chào', label: 'NHÃN'}}, {khuon: 'cta-contact'}]});
    if (p.scenes[0].end !== 121 || p.scenes[1].start !== 121 || (p.scenes[1].end - 1) % 15) throw new Error('lưới nhịp: ' + p.scenes.map((s) => s.start + '-' + s.end));
    applyKhuon(d, p, {khuon: 'hook-ransom', scene: 'S01'});
    if (p.copy.S01_headline.value !== 'Xin chào' || p.copy.S01_label) throw new Error('đổi khuôn không giữ chữ');
    applyKhuon(d, p, {khuon: 'hook-words', scene: 'S01'});
    if (p.copy.S01_label?.value !== 'NHÃN') throw new Error('đổi lại không khôi phục ô đã cất');
    const s = applyKhuon(d, p, {khuon: 'stat-counter', after: 'S01'});
    if (s.id !== 'S03' || p.scenes[1].id !== 'S03' || p.scenes[2].start !== p.scenes[1].end) throw new Error('chèn sai');
    if (!fs.readFileSync(path.join(d, 'hf', 'S03.html'), 'utf8').includes('data-composition-id="S03"')) throw new Error('id cảnh');
  } finally { fs.rmSync(d, {recursive: true, force: true}); }
});
await t('dây chuyền: promo / maps / menu dựng từ brief mẫu, validate không lỗi', async () => {
  const {buildProject} = await import('./khuon.mjs'); const {validateProject: vp} = await import('./validate.mjs');
  const out = [];
  for (const n of ['promo', 'maps', 'menu']) {
    const P = await import('file:///' + path.join(ROOT, 'lib', 'pipelines', n + '.mjs').replace(/\\/g, '/'));
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'sami-pl-'));
    try { const p = buildProject(d, P.default(P.example, null)); const v = vp(d); if (v.fail.length) throw new Error(n + ': ' + v.fail[0]); out.push(`${n} ${p.scenes.length} cảnh`); }
    finally { fs.rmSync(d, {recursive: true, force: true}); }
  }
  return out.join(', ');
});
// ── 0.9: footage (tiny synthetic clips, CPU; probe → proxy, VFR → CFR, timeline helpers, local media server) ──
await t('footage: nhập, bản xem trước 540p, VFR → CFR 30, clip trên timeline, máy chủ media có Range', async () => {
  const F = await import('./footage.mjs'); const {ffAsync} = await import('./ffmpeg.mjs'); const {buildProject} = await import('./khuon.mjs'); const {validateProject: vp} = await import('./validate.mjs');
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'sami-ft-'));
  try {
    buildProject(d, {name: 'ft', formats: ['9:16'], scenes: [{khuon: 'hook-words'}]});
    fs.mkdirSync(path.join(d, 'media'));
    const mk = (n, a) => ffAsync(['-v', 'error', '-y', ...a, path.join(d, 'media', n)]);
    let r = await mk('a.mp4', ['-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=30:duration=1', '-f', 'lavfi', '-i', 'sine=duration=1', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest']);
    if (r.code) return 'ffmpeg thiếu lavfi/libx264 (bỏ qua)';
    await mk('rec.mp4', ['-f', 'lavfi', '-i', 'testsrc=size=180x320:rate=30:duration=2', '-vf', "select='not(mod(n\\,3))+lt(n\\,20)'", '-fps_mode', 'vfr', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p']);
    const a = await F.prepare(d, 'media/a.mp4'); if (!a.audio || !fs.existsSync(path.join(d, a.proxy)) || !fs.existsSync(path.join(d, a.thumb))) throw new Error('proxy / ảnh đại diện');
    const v = await F.prepare(d, 'media/rec.mp4'); if (!v.vfrOrig || v.src !== 'media/rec.cfr30.mp4' || Math.abs(v.fps - 30) > 0.01) throw new Error('VFR → CFR: ' + JSON.stringify(v));
    const L = F.listMedia(d); if (L.length !== 2 || L.some((x) => !x.ready) || L.some((x) => x.src === 'media/rec.mp4')) throw new Error('listMedia ' + L.map((x) => x.src));
    const pj = JSON.parse(fs.readFileSync(path.join(d, 'project.json'), 'utf8')); pj.tracks = {video: [F.newClip(pj, {src: 'media/a.mp4', role: 'pip', at: 1, info: a})]};
    pj.tracks.video.push(F.newClip(pj, {src: v.src, role: 'broll', at: 2, info: v}));
    fs.writeFileSync(path.join(d, 'project.json'), JSON.stringify(pj));
    if (pj.tracks.video[1].id !== 'V02' || pj.tracks.video[1].volume !== null || pj.tracks.video[0].volume !== 0 || F.clipEnd(pj.tracks.video[0]) !== 2) throw new Error('newClip ' + JSON.stringify(pj.tracks.video));
    const val = vp(d); if (val.fail.length) throw new Error(val.fail[0]);
    const ms = await F.serveMedia(d);
    try {
      const res = await fetch(ms.url + 'media/a.mp4', {headers: {Range: 'bytes=0-99'}}); if (res.status !== 206 || (await res.arrayBuffer()).byteLength !== 100) throw new Error('Range');
      if ((await fetch(ms.url + 'project.json')).status !== 404) throw new Error('máy chủ media lộ file ngoài media/');
    } finally { await ms.close(); }
    return '2 clip · proxy + CFR + Range';
  } finally { fs.rmSync(d, {recursive: true, force: true}); }
});
await t('preset xuất: lib/presets.json hợp lệ', () => {
  const P = JSON.parse(fs.readFileSync(path.join(ROOT, 'lib', 'presets.json'), 'utf8')).presets;
  for (const x of P) { if (!['16:9', '9:16', '1:1', '4:5'].includes(x.ratio) || !['540p', 'FHD', '2K', '4K'].includes(x.res) || ![24, 30, 60].includes(x.fps) || !['h264', 'h265', 'prores'].includes(x.codec)) throw new Error(x.id); }
  return P.length + ' preset';
});
// ── 0.8.2: the encoder that really wrote a file (tiny 0.2 s clip from a still, CPU only; not a video export) ──
await t('probeEncoder reads libx264 from a real file', async () => {
  const {probeEncoder, ffAsync} = await import('./ffmpeg.mjs');
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'sami-enc-')); const f = path.join(d, 'x.mp4');
  try {
    const r = await ffAsync(['-v', 'error', '-y', '-loop', '1', '-i', path.join(ROOT, 'engine', 'public', 'grain0.png'), '-t', '0.2', '-vf', 'scale=160:120', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', f]);
    if (r.code !== 0) return 'ffmpeg không có libx264 (bỏ qua)';
    const e = await probeEncoder(f); if (e.encoder !== 'libx264' || e.gpu) throw new Error(JSON.stringify(e)); return e.label + ' (' + e.how + ')';
  } finally { fs.rmSync(d, {recursive: true, force: true}); }
});
await t('encoder caps (async probe, NVENC/QSV/AMF)', async () => { const {capsReady} = await import('./ffmpeg.mjs'); const c = await capsReady(); return `Remotion NVENC ${c.remotion.nvenc ? '✓' : '–'} · ffmpeg ${c.full.full ? 'đầy đủ' : 'đi kèm'} NVENC ${c.full.nvenc ? '✓' : '–'}`; });

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
