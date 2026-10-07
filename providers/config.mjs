// Provider config: %APPDATA%\SAMI\providers.json (outside git, outside projects)
//   {version, keys: {<keyId>: {enc, set}}, caps: {dailyUsd, monthlyUsd}, opts: {<adapterId>: {...}}}
// API keys are encrypted with Windows DPAPI (CurrentUser scope) via PowerShell ConvertFrom-SecureString:
// only this Windows user on this machine can decrypt them. The plain key travels over stdin, never argv.
// The UI and every API response only ever see "set / unset" (+ where it comes from), never the key.
import fs from 'fs';
import path from 'path';
import {spawn} from 'child_process';
import {USERDATA} from '../server/paths.mjs';

export const FILE = path.join(USERDATA, 'providers.json');
export const DEFAULT_CAPS = {dailyUsd: 2, monthlyUsd: 20}; // Tuấn, 2026-10-08

// keyId → env fallback names (first one found wins) + where to get a key
export const KEYS = {
  pexels: {env: ['PEXELS_API_KEY'], label: 'Pexels', url: 'https://www.pexels.com/api/new/', free: true},
  pixabay: {env: ['PIXABAY_API_KEY'], label: 'Pixabay', url: 'https://pixabay.com/api/docs/', free: true},
  unsplash: {env: ['UNSPLASH_ACCESS_KEY'], label: 'Unsplash (Access Key)', url: 'https://unsplash.com/oauth/applications', free: true},
  elevenlabs: {env: ['ELEVENLABS_API_KEY', 'XI_API_KEY'], label: 'ElevenLabs', url: 'https://elevenlabs.io/app/settings/api-keys'},
  openai: {env: ['OPENAI_API_KEY'], label: 'OpenAI', url: 'https://platform.openai.com/api-keys'},
  gemini: {env: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'], label: 'Google Gemini', url: 'https://aistudio.google.com/apikey'},
  bfl: {env: ['BFL_API_KEY'], label: 'Black Forest Labs (Flux)', url: 'https://api.bfl.ai/'},
  fal: {env: ['FAL_KEY'], label: 'fal.ai', url: 'https://fal.ai/dashboard/keys'},
  replicate: {env: ['REPLICATE_API_TOKEN'], label: 'Replicate', url: 'https://replicate.com/account/api-tokens'},
};

const blank = () => ({version: 1, keys: {}, caps: {...DEFAULT_CAPS}, opts: {}});
export const load = () => {
  try { const j = JSON.parse(fs.readFileSync(FILE, 'utf8')); return {...blank(), ...j, caps: {...DEFAULT_CAPS, ...(j.caps || {})}, keys: j.keys || {}, opts: j.opts || {}}; }
  catch { return blank(); }
};
const save = (c) => {
  fs.mkdirSync(USERDATA, {recursive: true});
  const tmp = FILE + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(c, null, 1)); fs.renameSync(tmp, FILE);
};

// ── DPAPI ─────────────────────────────────────────────────────────────
const ps = (script, input) => new Promise((ok, bad) => {
  const c = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {windowsHide: true});
  let out = '', err = '';
  c.stdout.on('data', (d) => (out += d)); c.stderr.on('data', (d) => (err += d));
  c.on('error', bad);
  c.on('exit', (code) => (code === 0 ? ok(out.trim()) : bad(new Error('DPAPI: ' + (err.trim().split('\n')[0] || 'mã ' + code)))));
  c.stdin.end(input, 'utf8');
});
const ENC = "[Console]::InputEncoding=[Text.Encoding]::UTF8; $s=[Console]::In.ReadToEnd(); ConvertTo-SecureString -String $s -AsPlainText -Force | ConvertFrom-SecureString";
const DEC = "[Console]::OutputEncoding=[Text.Encoding]::UTF8; $e=[Console]::In.ReadToEnd().Trim(); $ss=ConvertTo-SecureString $e; $b=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($ss); try { [Console]::Out.Write([Runtime.InteropServices.Marshal]::PtrToStringBSTR($b)) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b) }";
export const protect = async (plain) => (process.platform === 'win32' ? 'dpapi:' + (await ps(ENC, plain)) : 'b64:' + Buffer.from(plain).toString('base64'));
export const unprotect = async (enc) => {
  if (enc.startsWith('dpapi:')) return ps(DEC, enc.slice(6));
  if (enc.startsWith('b64:')) return Buffer.from(enc.slice(4), 'base64').toString('utf8');
  throw new Error('định dạng khoá lạ');
};

// ── keys ──────────────────────────────────────────────────────────────
const cache = new Map(); // keyId → plain (this process only)
const envKey = (id) => { for (const n of KEYS[id]?.env || []) if (process.env[n]) return process.env[n]; return null; };
/** where a key comes from: 'ui' | 'env' | null. Never returns the key. */
export const keySource = (id, c = load()) => (c.keys[id]?.enc ? 'ui' : envKey(id) ? 'env' : null);
export const keyStatus = () => { const c = load(); return Object.fromEntries(Object.keys(KEYS).map((id) => [id, {...KEYS[id], source: keySource(id, c), set: c.keys[id]?.set || null}])); };
export const getKey = async (id) => {
  if (cache.has(id)) return cache.get(id);
  const c = load(); let k = null;
  if (c.keys[id]?.enc) k = (await unprotect(c.keys[id].enc)).trim();
  else k = envKey(id);
  if (k) cache.set(id, k);
  return k;
};
export const setKey = async (id, plain) => {
  if (!KEYS[id]) throw new Error('Không có nguồn ' + id);
  const v = String(plain || '').trim();
  if (!v || v.length > 400 || /\s/.test(v)) throw new Error('Khoá không hợp lệ');
  const enc = await protect(v);
  const c = load(); c.keys[id] = {enc, set: new Date().toISOString()}; save(c); cache.delete(id);
  return {id, source: 'ui'};
};
export const deleteKey = (id) => { const c = load(); delete c.keys[id]; save(c); cache.delete(id); return {id, source: keySource(id)}; };

// ── caps + per-adapter options ────────────────────────────────────────
export const getCaps = () => load().caps;
export const setCaps = ({dailyUsd, monthlyUsd}) => {
  const c = load(); const d = +dailyUsd, m = +monthlyUsd;
  if (!(d >= 0 && d <= 1000) || !(m >= 0 && m <= 10000)) throw new Error('Trần chi phí không hợp lệ');
  c.caps = {dailyUsd: d, monthlyUsd: Math.max(m, d)}; save(c); return c.caps;
};
export const getOpts = (adapterId) => load().opts[adapterId] || {};
export const setOpts = (adapterId, o) => { const c = load(); c.opts[adapterId] = {...(c.opts[adapterId] || {}), ...o}; save(c); return c.opts[adapterId]; };
