#!/usr/bin/env node
// SAMI media gateway CLI (same rules as the Studio UI and the MCP server).
//   node providers/cli.mjs list                                   nguồn, khoá (đã đặt / chưa), có chạy được không
//   node providers/cli.mjs stock "pho bo" [--provider auto|pexels|pixabay|unsplash|wikimedia] [--kind img|video] [--orientation portrait|landscape|square] [--n 12]
//   node providers/cli.mjs fetch <số thứ tự từ lần stock trước> [--to <thư mục dự án>]
//   node providers/cli.mjs estimate <kind> --provider <id> --prompt "…" [--n 4] [--model …] [--ratio 9:16] [--seconds 30] [--voice …] [--to <dự án>]
//   node providers/cli.mjs gen <kind> --provider <id> --prompt "…" [cùng tham số] [--confirm <MÃ>]   (nguồn trả tiền: bắt buộc --confirm)
//   node providers/cli.mjs ingest <file> --provider chatgpt-web|gemini-web|flow-web|suno-web|manual --kind img --prompt "…" [--to <dự án>]
//   node providers/cli.mjs downloads [--since <ISO>] [--dir <thư mục>]   file mới trong thư mục Tải xuống (sau khi tải từ ChatGPT, Gemini, Flow, Suno)
//   node providers/cli.mjs ledger                                 chi phí hôm nay / tháng / gần đây
// Không có lệnh đặt khoá hay đổi trần: Tuấn làm việc đó trong Studio (tab "Nguồn & AI").
import fs from 'fs';
import path from 'path';
import {cacheDir} from '../server/paths.mjs';
import * as G from './gateway.mjs';

const argv = process.argv.slice(2);
const pos = [], o = {};
for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (a.startsWith('--')) { const k = a.slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; o[k] = v; } else pos.push(a); }
const cmd = pos.shift();
const LAST = path.join(cacheDir('providers'), 'last-stock.json');
const print = (x) => console.log(o.json ? JSON.stringify(x, null, 1) : x);
const reqOf = (kind) => ({provider: o.provider, kind, prompt: o.prompt ?? (o['prompt-file'] ? fs.readFileSync(o['prompt-file'], 'utf8') : ''), n: o.n, model: o.model, ratio: o.ratio, seconds: o.seconds, voice: o.voice, opts: o.opts ? JSON.parse(o.opts) : undefined, dest: o.to || 'library'});
const usd = (x) => (+x || 0).toFixed(3) + ' USD';

try {
  if (cmd === 'list') {
    const L = await G.listProviders();
    if (o.json) print(L); else for (const p of L) console.log(`${p.available ? '✓' : '·'} ${p.id.padEnd(17)} ${p.kinds.join('/').padEnd(10)} ${p.paid ? 'TRẢ TIỀN' : p.web ? 'web' : p.stock ? 'stock' : 'miễn phí'}${p.keyId ? `  khoá ${p.keySource || 'CHƯA ĐẶT'}` : ''}${p.reason ? '  (' + p.reason + ')' : ''}`);
  } else if (cmd === 'stock') {
    const r = await G.searchStock({provider: o.provider || 'auto', q: pos.join(' ') || o.q, kind: o.kind || 'img', orientation: o.orientation, perPage: +(o.n || 12)});
    fs.writeFileSync(LAST, JSON.stringify(r.items));
    if (o.json) print(r); else { r.items.forEach((it, i) => console.log(`${String(i + 1).padStart(2)}. [${it.provider}] ${it.title.slice(0, 60)} · ${it.w}×${it.h}${it.duration ? ' · ' + it.duration + ' s' : ''} · ${it.author || '?'} · ${it.licence?.name || ''}\n    ${it.page}`)); for (const e of r.errors) console.log('! ' + e); console.log(`\nLấy về: node providers/cli.mjs fetch <số> [--to <dự án>]`); }
  } else if (cmd === 'fetch') {
    const items = JSON.parse(fs.readFileSync(LAST, 'utf8')); const it = items[+pos[0] - 1]; if (!it) throw new Error('Không có mục số ' + pos[0]);
    const r = await G.fetchStock(it, {dest: o.to || 'library', confirmedBy: 'cli'});
    print(o.json ? r : `✓ ${r.uri || r.rel}\n  ${r.path}\n  Giấy phép: ${r.meta.licence?.name} · ${r.meta.licence?.credit || ''}`);
  } else if (cmd === 'estimate') {
    const e = await G.estimate(reqOf(pos[0]));
    if (o.json) print(e);
    else console.log(`${e.label}: ${e.units} · ${usd(e.usd)}${e.notes ? '\n  ' + e.notes : ''}\nĐã dùng: hôm nay ${usd(e.spent.day)} / ${e.caps.dailyUsd} · tháng ${usd(e.spent.month)} / ${e.caps.monthlyUsd}` +
      (e.blocked ? `\n✗ ${e.blocked}` : e.token ? `\nMã xác nhận: ${e.token} (10 phút, 1 lần, đúng yêu cầu này). Chạy: thêm --confirm ${e.token} vào lệnh gen` : e.web ? `\nChạy bằng trình duyệt: ${e.recipe}` : '\nMiễn phí: chạy gen không cần mã.'));
  } else if (cmd === 'gen') {
    const r = await G.generate(reqOf(pos[0]), {token: o.confirm, confirmedBy: 'cli', onProgress: (p) => process.stderr.write(p.msg + '\n')});
    print(o.json ? r : `✓ ${r.files.length} file · ${usd(r.usd)}\n` + r.files.map((f) => `  ${f.uri || f.rel}  (${f.path})`).join('\n'));
  } else if (cmd === 'ingest') {
    const r = G.ingestFile({file: pos[0], provider: o.provider || 'manual', kind: o.kind, prompt: o.prompt || (o['prompt-file'] ? fs.readFileSync(o['prompt-file'], 'utf8').trim() : null), model: o.model || null, title: o.title, dest: o.to || 'library', note: o.note, confirmedBy: 'cli'});
    print(o.json ? r : `✓ ${r.uri || r.rel}${r.duplicate ? ' (đã có sẵn)' : ''}\n  ${r.path}`);
  } else if (cmd === 'downloads') {
    const dir = o.dir || path.join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads'); const since = o.since ? Date.parse(o.since) : Date.now() - 3600e3;
    const files = fs.readdirSync(dir, {withFileTypes: true}).filter((e) => e.isFile() && !/\.(crdownload|tmp|part|partial)$/i.test(e.name)).map((e) => { const f = path.join(dir, e.name); const st = fs.statSync(f); return {file: f, bytes: st.size, mtime: st.mtime.toISOString(), t: Math.max(st.mtimeMs, st.birthtimeMs)}; }).filter((x) => x.t >= since).sort((a, b) => a.t - b.t).map(({t, ...x}) => x);
    print(o.json ? files : files.length ? files.map((x) => `${x.file}  (${(x.bytes / 1e6).toFixed(1)} MB, ${x.mtime})`).join('\n') : `Chưa có file mới trong ${dir}\n(Chrome còn đang tải thì file có đuôi .crdownload, chờ vài giây rồi chạy lại)`);
  } else if (cmd === 'ledger') {
    const s = G.ledgerSummary({limit: +(o.n || 15)});
    if (o.json) print(s); else { console.log(`Hôm nay ${usd(s.day)} / ${s.caps.dailyUsd} · tháng ${usd(s.month)} / ${s.caps.monthlyUsd}`); for (const r of s.recent) console.log(`  ${r.ts.slice(0, 16).replace('T', ' ')} ${r.provider.padEnd(16)} ${r.status.padEnd(5)} ${usd(r.charged)}${r.note ? '  ' + r.note.slice(0, 60) : ''}`); }
  } else {
    console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
    process.exit(cmd ? 1 : 0);
  }
} catch (e) { console.error('✗ ' + e.message); process.exit(1); }
