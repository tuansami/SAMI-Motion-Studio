// Cost ledger: %APPDATA%\SAMI\ledger.jsonl — one JSON line per provider call (append only, never rewritten).
//   {ts, day, provider, model, kind, est, actual, charged, status: ok|error|blocked, sent, project, files[], confirmedBy, note}
// "charged" is what counts against the caps: actual if known, else the estimate when the request reached the
// provider (a timed-out request may still be billed), else 0.
import fs from 'fs';
import path from 'path';
import {USERDATA} from '../server/paths.mjs';
import {getCaps} from './config.mjs';

export const FILE = path.join(USERDATA, 'ledger.jsonl');
export const localDay = (d = new Date()) => d.toLocaleDateString('sv-SE'); // YYYY-MM-DD in the machine's time zone
const r4 = (x) => Math.round((+x || 0) * 10000) / 10000;

export const append = (row) => {
  const est = r4(row.est), actual = row.actual == null ? null : r4(row.actual);
  const charged = actual != null ? actual : (row.status === 'ok' || row.sent) ? est : 0;
  const line = {ts: new Date().toISOString(), day: localDay(), ...row, est, actual, charged: r4(charged)};
  fs.mkdirSync(USERDATA, {recursive: true});
  fs.appendFileSync(FILE, JSON.stringify(line) + '\n');
  return line;
};
export const rows = () => {
  try { return fs.readFileSync(FILE, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); }
  catch { return []; }
};
/** {day, month, caps, left:{day, month}} — spent in USD for today and this calendar month */
export const spent = (R = rows()) => {
  const d = localDay(), m = d.slice(0, 7);
  let day = 0, month = 0;
  for (const r of R) { const c = +r.charged || 0; if (r.day === d) day += c; if ((r.day || '').startsWith(m)) month += c; }
  const caps = getCaps();
  return {day: r4(day), month: r4(month), caps, left: {day: r4(caps.dailyUsd - day), month: r4(caps.monthlyUsd - month)}};
};
/** would an extra `usd` stay under both caps? → null or a reason (Vietnamese) */
export const capCheck = (usd, s = spent()) => {
  if (usd > 0 && s.day + usd > s.caps.dailyUsd + 1e-9) return `Vượt trần ngày: đã dùng ${s.day.toFixed(2)} / ${s.caps.dailyUsd} USD, lệnh này ≈ ${usd.toFixed(3)} USD`;
  if (usd > 0 && s.month + usd > s.caps.monthlyUsd + 1e-9) return `Vượt trần tháng: đã dùng ${s.month.toFixed(2)} / ${s.caps.monthlyUsd} USD, lệnh này ≈ ${usd.toFixed(3)} USD`;
  return null;
};
export const summary = ({limit = 50} = {}) => {
  const R = rows(); const s = spent(R); const m = localDay().slice(0, 7);
  const byProvider = {};
  for (const r of R) if ((r.day || '').startsWith(m)) { const b = (byProvider[r.provider] ||= {calls: 0, usd: 0}); b.calls++; b.usd = r4(b.usd + (+r.charged || 0)); }
  return {...s, byProvider, recent: R.slice(-limit).reverse()};
};
