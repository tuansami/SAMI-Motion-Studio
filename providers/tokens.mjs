// Confirm tokens for paid calls + a cross-process "one paid call at a time" lock.
// A token is bound to the exact request (sha256 of its canonical form), lives 10 minutes and is burnt the moment
// a run starts (so an error never leaves a reusable token behind: no silent retries).
// Stored in %APPDATA%\SAMI\tokens.json so the UI, CLI and MCP server (separate processes) share them.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {USERDATA} from '../server/paths.mjs';

const FILE = path.join(USERDATA, 'tokens.json');
const LOCK = path.join(USERDATA, 'run.lock');
export const TTL_MS = 10 * 60 * 1000;
const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L

const canon = (v) => (Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : v && typeof v === 'object' ? '{' + Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}' : JSON.stringify(v));
export const requestHash = (req) => crypto.createHash('sha256').update(canon(req)).digest('hex');

const read = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return {}; } };
const write = (t) => { fs.mkdirSync(USERDATA, {recursive: true}); const tmp = FILE + '.' + process.pid + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(t, null, 1)); fs.renameSync(tmp, FILE); };
const prune = (t) => { const now = Date.now(); for (const k of Object.keys(t)) if (t[k].exp < now) delete t[k]; return t; };

export const issue = (req, {usd, summary}) => {
  const b = crypto.randomBytes(8); let code = '';
  for (let i = 0; i < 8; i++) code += ALPHA[b[i] % ALPHA.length];
  code = code.slice(0, 4) + '-' + code.slice(4);
  const t = prune(read()); const exp = Date.now() + TTL_MS;
  t[code] = {hash: requestHash(req), usd, summary, exp, issued: new Date().toISOString()};
  write(t);
  return {token: code, expires: new Date(exp).toISOString()};
};
/** check + burn. Throws a Vietnamese reason when the token is missing / wrong / expired / used. */
export const consume = (code, req) => {
  if (!code) throw new Error('Lệnh trả tiền cần mã xác nhận: chạy "estimate" trước, cho Tuấn xem chi phí, rồi gửi kèm mã.');
  const t = read(); const k = String(code).trim().toUpperCase(); const e = t[k];
  if (!e) throw new Error('Mã xác nhận không tồn tại hoặc đã dùng: ' + k);
  if (e.exp < Date.now()) { delete t[k]; write(prune(t)); throw new Error('Mã xác nhận đã hết hạn (10 phút). Ước tính lại để lấy mã mới.'); }
  if (e.hash !== requestHash(req)) throw new Error('Mã xác nhận không khớp yêu cầu này (prompt, số lượng hay model đã đổi). Ước tính lại.');
  delete t[k]; write(prune(t));
  return e;
};
/** open tokens WITHOUT their codes (a code is only ever shown once, to whoever asked for the estimate) */
export const pending = () => Object.values(prune(read())).map((e) => ({usd: e.usd, summary: e.summary, expires: new Date(e.exp).toISOString()}));

// ── run lock ──────────────────────────────────────────────────────────
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
export const acquire = (what) => {
  fs.mkdirSync(USERDATA, {recursive: true});
  for (let i = 0; i < 2; i++) {
    try { const fd = fs.openSync(LOCK, 'wx'); fs.writeSync(fd, JSON.stringify({pid: process.pid, what, since: new Date().toISOString()})); fs.closeSync(fd); return () => { try { const l = JSON.parse(fs.readFileSync(LOCK, 'utf8')); if (l.pid === process.pid) fs.rmSync(LOCK, {force: true}); } catch {} }; }
    catch (e) {
      if (e.code !== 'EEXIST') throw e;
      let l = null; try { l = JSON.parse(fs.readFileSync(LOCK, 'utf8')); } catch {}
      const stale = !l || !alive(l.pid) || Date.now() - Date.parse(l.since) > 30 * 60 * 1000;
      if (!stale) throw new Error(`Đang có một lệnh trả tiền khác chạy (${l.what}, từ ${new Date(l.since).toLocaleTimeString('vi-VN')}). Chờ xong rồi chạy tiếp.`);
      fs.rmSync(LOCK, {force: true});
    }
  }
  throw new Error('Không lấy được khoá chạy');
};
