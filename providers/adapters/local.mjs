// Free generators: edge-tts (Microsoft online voices, free), synth-sfx (lib/py/sami_audio.py, offline),
// and gateways to local open-source servers: Kokoro-FastAPI (voice), ComfyUI (ACE-Step music, Stable Audio SFX).
// The gateways never download models: if the server isn't running they report "không chạy".
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {spawn} from 'child_process';
import {ROOT} from '../../server/paths.mjs';
import {childEnv} from '../../server/env.mjs';
import {bfetch, jfetch, sleep, extOf} from '../net.mjs';

const PY = process.env.SAMI_PYTHON || 'python';
const run = (cmd, args, {signal, cwd} = {}) => new Promise((ok, bad) => {
  const c = spawn(cmd, args, {windowsHide: true, env: childEnv({PYTHONIOENCODING: 'utf-8'}), cwd});
  let err = ''; c.stderr.on('data', (d) => (err = (err + d).slice(-2000))); c.stdout.on('data', () => {});
  signal?.addEventListener('abort', () => c.kill(), {once: true});
  c.on('error', bad); c.on('exit', (code) => (code === 0 ? ok() : bad(new Error(`${path.basename(cmd)} lỗi (mã ${code}): ${err.trim().split('\n').slice(-3).join(' ')}`))));
});
const up = async (url) => { try { await fetch(url, {signal: AbortSignal.timeout(1500)}); return true; } catch { return false; } };

// ── edge-tts ──────────────────────────────────────────────────────────
export const EDGE_VOICES = {'vi-VN-HoaiMyNeural': 'Hoài My (nữ, VI)', 'vi-VN-NamMinhNeural': 'Nam Minh (nam, VI)', 'de-DE-KatjaNeural': 'Katja (nữ, DE)', 'de-DE-SeraphinaMultilingualNeural': 'Seraphina (nữ, DE)', 'de-DE-ConradNeural': 'Conrad (nam, DE)', 'en-US-AriaNeural': 'Aria (nữ, EN)'};
export const edgeTts = {
  id: 'edge-tts', label: 'Edge TTS (miễn phí)', kinds: ['voice'], paid: false, free: true, voices: EDGE_VOICES, defaults: {voice: 'vi-VN-HoaiMyNeural'},
  licence: {name: 'Microsoft Edge Read Aloud (dịch vụ online miễn phí)', url: 'https://github.com/rany2/edge-tts', commercial: 'check', notes: 'Không có giấy phép thương mại rõ ràng: dùng làm giọng nháp / tạm, bản chạy quảng cáo nên dùng ElevenLabs.'},
  estimate: (req) => ({usd: 0, units: `${(req.prompt || '').length} ký tự`}),
  async run(req, ctx) {
    const voice = req.voice || this.defaults.voice; if (!/^[a-z]{2}-[A-Z]{2}-\w+Neural$/.test(voice)) throw new Error('Giọng edge-tts không hợp lệ: ' + voice);
    const txt = path.join(ctx.tmp, 'text.txt'), out = path.join(ctx.tmp, 'voice.mp3');
    fs.writeFileSync(txt, req.prompt, 'utf8');
    const rate = req.opts?.rate || '+0%'; if (!/^[+-]\d{1,2}%$/.test(rate)) throw new Error('rate dạng +10% / -5%');
    await run(PY, ['-m', 'edge_tts', '--file', txt, '--voice', voice, '--rate=' + rate, '--write-media', out], ctx);
    return {files: [{file: out, ext: '.mp3', title: req.prompt.slice(0, 60)}], model: voice};
  },
};

// ── synth-sfx (numpy) ─────────────────────────────────────────────────
export const synthSfx = {
  id: 'synth-sfx', label: 'SFX tổng hợp (offline)', kinds: ['sfx'], paid: false, free: true, local: true,
  licence: {name: 'SAMI (tự tổng hợp, không bản quyền bên thứ ba)', commercial: true},
  async names() { return new Promise((ok) => { const c = spawn(PY, [path.join(ROOT, 'lib', 'py', 'sami_audio.py'), 'list'], {windowsHide: true}); let o = ''; c.stdout.on('data', (d) => (o += d)); c.on('exit', () => ok(o.trim().split(/\s+/).filter(Boolean))); c.on('error', () => ok([])); }); },
  estimate: () => ({usd: 0, units: '1 hiệu ứng'}),
  async run(req, ctx) {
    const name = String(req.prompt || '').trim();
    const names = await this.names(); if (!names.includes(name)) throw new Error(`Tên hiệu ứng: ${names.join(', ')}`);
    const n = Math.max(1, Math.min(8, req.n || 1)); const files = [];
    for (let i = 0; i < n; i++) {
      const out = path.join(ctx.tmp, `${name}-${i + 1}.wav`);
      const args = [path.join(ROOT, 'lib', 'py', 'sami_audio.py'), 'sfx', name, out, '--seed', String((req.opts?.seed ?? 1) + i)];
      if (req.seconds) args.push('--dur', String(req.seconds)); if (req.opts?.pitch) args.push('--pitch', String(req.opts.pitch));
      await run(PY, args, ctx); files.push({file: out, ext: '.wav', title: name});
    }
    return {files, model: 'sami_audio.py'};
  },
};

// ── Kokoro-FastAPI (OpenAI-compatible /v1/audio/speech) ──────────────
export const kokoro = {
  id: 'kokoro', label: 'Kokoro (cục bộ)', kinds: ['voice'], paid: false, free: true, local: true, defaults: {url: 'http://127.0.0.1:8880', voice: 'af_heart'},
  licence: {name: 'Apache-2.0 (Kokoro-82M)', url: 'https://huggingface.co/hexgrad/Kokoro-82M', commercial: true, notes: 'Không có tiếng Việt.'},
  async available(ctx) { const u = ctx.opts.url || this.defaults.url; return (await up(u)) ? {ok: true} : {ok: false, reason: `Kokoro-FastAPI không chạy ở ${u}`}; },
  estimate: (req) => ({usd: 0, units: `${(req.prompt || '').length} ký tự`}),
  async run(req, ctx) {
    const u = ctx.opts.url || this.defaults.url;
    const r = await bfetch(u.replace(/\/$/, '') + '/v1/audio/speech', {method: 'POST', body: {model: 'kokoro', input: req.prompt, voice: req.voice || this.defaults.voice, response_format: 'mp3', speed: req.opts?.speed || 1}, signal: ctx.signal});
    const f = path.join(ctx.tmp, 'kokoro.mp3'); fs.writeFileSync(f, r.buf);
    return {files: [{file: f, ext: '.mp3', title: req.prompt.slice(0, 60)}], model: 'kokoro:' + (req.voice || this.defaults.voice)};
  },
};

// ── ComfyUI (ACE-Step music, Stable Audio Open SFX) ─────────────────────
// Workflows: providers/workflows/<name>.json exported from ComfyUI with "Export (API)". String values may contain
// {{prompt}} {{seconds}} {{seed}} {{lyrics}}; a value that is exactly "{{seconds}}" / "{{seed}}" becomes a number.
const WF = path.join(ROOT, 'providers', 'workflows');
const WF_FOR = {music: 'ace-step-music.json', sfx: 'stable-audio-sfx.json'};
const fill = (v, vars) => {
  if (typeof v === 'string') { const m = v.match(/^\{\{(\w+)\}\}$/); if (m && typeof vars[m[1]] === 'number') return vars[m[1]]; return v.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] ?? '')); }
  if (Array.isArray(v)) return v.map((x) => fill(x, vars));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x, vars)]));
  return v;
};
export const comfyui = {
  id: 'comfyui', label: 'ComfyUI cục bộ (ACE-Step, Stable Audio)', kinds: ['music', 'sfx'], paid: false, free: true, local: true, defaults: {url: 'http://127.0.0.1:8188'},
  licence: {name: 'theo model', commercial: 'check', notes: 'ACE-Step: giấy phép mở cho thương mại (kiểm lại khi cài). Stable Audio Open: Stability AI Community License, miễn phí thương mại khi doanh thu < 1 triệu USD/năm. Tránh MusicGen, F5-TTS (trọng số cấm thương mại).'},
  workflowFile(kind, ctx) { return path.join(WF, path.basename(ctx.opts.workflows?.[kind] || WF_FOR[kind] || '')); },
  async available(ctx, kind) {
    const u = ctx.opts.url || this.defaults.url;
    if (kind && !fs.existsSync(this.workflowFile(kind, ctx))) return {ok: false, reason: `Chưa có workflow ${path.basename(this.workflowFile(kind, ctx))} (xem providers/workflows/README.md)`};
    return (await up(u)) ? {ok: true} : {ok: false, reason: `ComfyUI không chạy ở ${u}`};
  },
  estimate: (req) => ({usd: 0, units: `${req.seconds || 30} s`}),
  async run(req, ctx) {
    const u = (ctx.opts.url || this.defaults.url).replace(/\/$/, '');
    const wfFile = this.workflowFile(req.kind, ctx); if (!fs.existsSync(wfFile)) throw new Error('Thiếu workflow ' + wfFile);
    const seed = req.opts?.seed ?? crypto.randomInt(1, 2 ** 31);
    const wf = fill(JSON.parse(fs.readFileSync(wfFile, 'utf8')), {prompt: req.prompt, seconds: +(req.seconds || 30), seed, lyrics: req.opts?.lyrics || '[instrumental]'});
    const {prompt_id: id} = await jfetch(u + '/prompt', {method: 'POST', body: {prompt: wf, client_id: 'sami-studio'}, signal: ctx.signal});
    const t0 = Date.now(); let outs = null;
    while (!outs) {
      await sleep(2000, ctx.signal); ctx.onProgress?.({msg: `ComfyUI đang chạy… ${Math.round((Date.now() - t0) / 1000)} s`});
      const h = await jfetch(`${u}/history/${id}`, {signal: ctx.signal}); const e = h?.[id];
      if (e?.status?.status_str === 'error') throw new Error('ComfyUI báo lỗi workflow');
      if (e?.outputs && Object.keys(e.outputs).length) outs = e.outputs;
      if (Date.now() - t0 > 20 * 60 * 1000) throw new Error('ComfyUI quá 20 phút');
    }
    const files = [];
    for (const o of Object.values(outs)) for (const it of [...(o.audio || []), ...(o.images || []), ...(o.gifs || [])]) {
      const q = new URLSearchParams({filename: it.filename, subfolder: it.subfolder || '', type: it.type || 'output'});
      const r = await bfetch(`${u}/view?${q}`, {signal: ctx.signal}); const f = path.join(ctx.tmp, path.basename(it.filename)); fs.writeFileSync(f, r.buf);
      files.push({file: f, ext: extOf(r.type, it.filename), title: req.prompt.slice(0, 60)});
    }
    if (!files.length) throw new Error('Workflow không trả file nào');
    return {files, model: 'comfyui:' + path.basename(wfFile, '.json'), meta: {seed}};
  },
};

export default [edgeTts, synthSfx, kokoro, comfyui];
