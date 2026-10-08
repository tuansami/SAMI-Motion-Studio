#!/usr/bin/env node
// Xuất video từ Claude Code (cùng bộ máy với nút "Xuất video" của Studio: Hyperframes + Remotion + ffmpeg NVENC).
//
// LUẬT: chỉ chạy khi Tuấn yêu cầu xuất video trong chat. --request phải là NGUYÊN VĂN câu yêu cầu đó.
//       Studio tab Xuất có công tắc "Cho phép Claude Code xuất video" (mặc định TẮT).
//
//   node server/cli-render.mjs --status
//   node server/cli-render.mjs --enable  --request "<nguyên văn lời Tuấn bảo bật>"
//   node server/cli-render.mjs --disable
//   node server/cli-render.mjs <thư mục dự án> --request "<nguyên văn lời Tuấn>" [--ratio 9:16] [--res 540p|FHD|2K|4K]
//        [--preset reels-9x16|feed-4x5|square-1x1|yt-16x9|yt-4k|ads-light|master-prores|review-540p] (lib/presets.json)
//        [--fps 24|30|60] [--codec h264|h265|prores] [--scene S03] [--gpu auto|off] [--name …] [--draft] [--no-wait]
//
// Studio đang mở → lượt xuất vào hàng đợi của Studio (thấy trong tab Xuất, dừng/huỷ được, không tranh GPU).
// Studio đang tắt → render ngay trong tiến trình này. Chờ xong mới thoát (chạy nền trong Claude Code để khỏi tốn token).
// Mọi lần bật/tắt/xuất ghi vào .studio/cli-render.log.
import fs from 'fs';
import path from 'path';
import {DATA, LIB} from './paths.mjs';

const argv = process.argv.slice(2);
const pos = [], o = {};
for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) { const k = a.slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; o[k] = v; } else pos.push(a); }
const SETTINGS = path.join(DATA, 'settings.json');
const LOG = path.join(DATA, 'cli-render.log');
const PORT = +(process.env.STUDIO_PORT || 5178);
const BASE = `http://127.0.0.1:${PORT}`;
const log = (row) => { fs.mkdirSync(DATA, {recursive: true}); fs.appendFileSync(LOG, JSON.stringify({ts: new Date().toISOString(), ...row}) + '\n'); };
const readSettings = () => { try { return JSON.parse(fs.readFileSync(SETTINGS, 'utf8')); } catch { return {}; } };
const studio = async () => { try { const r = await fetch(BASE + '/api/state', {signal: AbortSignal.timeout(2000)}); return r.ok ? await r.json() : null; } catch { return null; } };
const post = async (url, body) => { const r = await fetch(BASE + url, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)}); const j = await r.json().catch(() => ({})); if (!r.ok || j.error) throw new Error(j.error || r.statusText); return j; };
const die = (m) => { console.error('✗ ' + m); process.exit(1); };
const request = typeof o.request === 'string' ? o.request.trim() : '';
const fmt = (s) => `${Math.floor(s / 60)} phút ${Math.round(s % 60)} giây`;

const st = await studio();
const allowed = st ? st.allowCliRender : !!readSettings().allowCliRender;

if (o.status) { console.log(`Claude Code xuất video: ${allowed ? 'ĐANG BẬT' : 'ĐANG TẮT'} · Studio ${st ? 'đang mở (cổng ' + PORT + ')' : 'đang tắt'}`); process.exit(0); }
if (o.enable || o.disable) {
  const on = !!o.enable;
  if (on && request.length < 4) die('Bật cần --request "<nguyên văn lời Tuấn bảo bật>".');
  if (st) await post('/api/settings', {allowCliRender: on});
  else { const s = readSettings(); s.allowCliRender = on; fs.mkdirSync(DATA, {recursive: true}); fs.writeFileSync(SETTINGS, JSON.stringify(s, null, 1)); }
  log({action: on ? 'enable' : 'disable', request: request || null});
  console.log(`✓ Claude Code xuất video: ${on ? 'BẬT' : 'TẮT'}`); process.exit(0);
}

const dir = path.resolve(pos[0] || '');
if (!pos[0] || !fs.existsSync(path.join(dir, 'project.json'))) die('Cần thư mục dự án có project.json. Xem đầu file này để biết cách dùng.');
if (request.length < 4) die('Thiếu --request "<nguyên văn yêu cầu xuất video của Tuấn>". Không có yêu cầu của Tuấn thì KHÔNG xuất.');
if (!allowed) die('Studio đang TẮT "Cho phép Claude Code xuất video". Tuấn bật trong tab Xuất, hoặc nếu Tuấn bảo bật: node server/cli-render.mjs --enable --request "<lời Tuấn>"');

const pj = JSON.parse(fs.readFileSync(path.join(dir, 'project.json'), 'utf8'));
const opts = {};
if (o.preset) { // lib/presets.json (0.9): ratio + res + fps + codec + crf in one name; explicit flags below still win
  const P = JSON.parse(fs.readFileSync(path.join(LIB, 'presets.json'), 'utf8')).presets;
  const pr = P.find((x) => x.id === o.preset); if (!pr) die(`Không có preset "${o.preset}". Có: ${P.map((x) => x.id).join(', ')}`);
  for (const k of ['ratio', 'res', 'fps', 'codec', 'crf']) if (pr[k] != null) opts[k] = pr[k];
}
if (o.ratio) opts.ratio = String(o.ratio); if (o.res) opts.res = String(o.res); if (o.fps) opts.fps = +o.fps; if (o.codec) opts.codec = String(o.codec);
if (o.gpu) opts.gpu = String(o.gpu); if (o.name) opts.name = String(o.name); if (o.scene) opts.scope = String(o.scene);
if (o.draft) Object.assign(opts, {res: '540p', crf: 28, name: (o.name || pj.name) + '_nhap'});
if (opts.ratio && !(pj.formats || []).includes(opts.ratio) && pj.type !== 'carousel') console.error(`! Dự án chưa có bố cục ${opts.ratio}: xuất ở chế độ vừa khung.`);
const t0 = Date.now();

if (st) {
  const job = await post('/api/render/cli', {dir, request, opts}).catch((e) => die(e.message));
  console.log(`→ Đã đưa vào hàng đợi Studio (lượt #${job.id}). Theo dõi trong tab Xuất.`);
  if (o['no-wait']) process.exit(0);
  for (;;) {
    await new Promise((r) => setTimeout(r, 5000));
    let J; try { J = (await (await fetch(BASE + '/api/jobs')).json()).find((x) => x.id === job.id); } catch { die('Mất kết nối với Studio. Xem tab Xuất.'); }
    if (!J) die('Lượt xuất đã bị xoá khỏi hàng đợi.');
    if (J.status === 'done') { console.log(`✓ Xong sau ${fmt((Date.now() - t0) / 1000)} · ${J.encoder || ''}${J.note ? ' · ' + J.note : ''}\n  ${J.out}`); process.exit(0); }
    if (['error', 'cancelled', 'interrupted'].includes(J.status)) die(`${J.status === 'error' ? 'Lỗi' : 'Đã dừng'}: ${J.error || J.stage}`);
  }
}

// Studio is closed → render here with Studio's saved defaults
const {validateProject} = await import('./validate.mjs');
const v = validateProject(dir); if (v.fail.length) die('Dự án còn lỗi:\n• ' + v.fail.join('\n• '));
const S = readSettings();
const DEF = {threads: 8, gpu: 'auto', res: 'FHD', fps: 30, codec: 'h264', crf: 18, priority: 'normal', titles: true, subtitles: true, audio: true, loudness: -14};
const full = {...DEF, ...(S.render || {}), ...opts}; full.ratio ||= pj.formats?.[0] || '16:9';
log({action: 'render', via: 'cli', dir, request, opts: full});
const {addJob, onJobs, jobs} = await import('./render.mjs');
const job = addJob({...full, dir, name: full.name || pj.name, by: 'Claude Code'});
let last = '';
onJobs(() => {
  const J = jobs.find((x) => x.id === job.id); if (!J) return;
  const line = `${Math.round((J.progress || 0) * 100)}% ${J.stage || ''}`; if (process.stdout.isTTY && line !== last) { process.stdout.write('\r' + line.slice(0, 100).padEnd(100)); last = line; }
  if (J.status === 'done') { console.log(`\n✓ Xong sau ${fmt((Date.now() - t0) / 1000)} · ${J.encoder || ''}${J.note ? ' · ' + J.note : ''}\n  ${J.out}`); process.exit(0); }
  if (['error', 'cancelled'].includes(J.status)) { console.error(`\n✗ ${J.error || J.stage}`); process.exit(1); }
});
