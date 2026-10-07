// ElevenLabs (paid, credits from Tuấn's Pro plan): text-to-speech, music, sound effects.
// No image generation here on purpose (house rule: never generate images with ElevenLabs unless Tuấn asks in text).
import fs from 'fs';
import path from 'path';
import {bfetch} from '../net.mjs';

const API = 'https://api.elevenlabs.io/v1';
export const VOICES = {FRYq6nepIbR0lbu7Lus4: 'Anh Thu (nữ miền Nam, quảng cáo)', pGapy9MNHCukzJtjavF0: 'TVC Ái Hạnh (nữ miền Bắc)'};
const LIC = {name: 'ElevenLabs Terms (gói trả phí)', url: 'https://elevenlabs.io/terms-of-use', commercial: true, notes: 'Dùng thương mại khi tạo bằng gói trả phí (Tuấn: Pro).'};
const key = (ctx) => { if (!ctx.key) throw new Error('Chưa có khoá ElevenLabs. Nhập trong Studio → "Nguồn & AI" → Khoá API.'); return ctx.key; };
const r4 = (x) => Math.round(x * 10000) / 10000;

export const elevenTts = {
  id: 'elevenlabs-tts', label: 'ElevenLabs giọng đọc', kinds: ['voice'], paid: true, keyId: 'elevenlabs', voices: VOICES, licence: LIC,
  models: ['eleven_v4', 'eleven_v3', 'eleven_multilingual_v2', 'eleven_flash_v2_5'], defaults: {model: 'eleven_v4', voice: 'FRYq6nepIbR0lbu7Lus4'},
  estimate(req, ctx) {
    const P = ctx.prices.elevenlabs; const model = req.model || this.defaults.model; const chars = [...(req.prompt || '')].length;
    if (!chars) throw new Error('Chưa có lời thoại'); if (chars > 5000) throw new Error('Tối đa 5000 ký tự mỗi lệnh');
    const credits = chars * (P.ttsCreditsPerChar[model] ?? P.ttsCreditsPerChar.default);
    return {usd: r4(credits * P.usdPerCredit), units: `${chars} ký tự ≈ ${Math.round(credits)} credit`, notes: 'Trừ vào credit gói Pro; số USD là quy đổi ước tính.'};
  },
  async run(req, ctx) {
    const model = req.model || this.defaults.model, voice = req.voice || this.defaults.voice;
    if (!/^\w{10,40}$/.test(voice)) throw new Error('voice_id không hợp lệ');
    const body = {text: req.prompt, model_id: model}; if (req.opts?.voice_settings) body.voice_settings = req.opts.voice_settings;
    const r = await bfetch(`${API}/text-to-speech/${voice}?output_format=mp3_44100_128`, {method: 'POST', headers: {'xi-api-key': key(ctx), Accept: 'audio/mpeg'}, body, signal: ctx.signal});
    const f = path.join(ctx.tmp, 'tts.mp3'); fs.writeFileSync(f, r.buf);
    const cc = +(r.headers.get('character-cost') || r.headers.get('x-character-count') || NaN);
    return {files: [{file: f, ext: '.mp3', title: req.prompt.slice(0, 60)}], model: `${model}:${VOICES[voice] || voice}`, usd: Number.isFinite(cc) ? r4(cc * ctx.prices.elevenlabs.usdPerCredit) : undefined, meta: {voice_id: voice, credits: Number.isFinite(cc) ? cc : null}};
  },
};

export const elevenMusic = {
  id: 'elevenlabs-music', label: 'ElevenLabs nhạc', kinds: ['music'], paid: true, keyId: 'elevenlabs', licence: LIC, models: ['music_v1'], defaults: {model: 'music_v1', seconds: 30},
  estimate(req, ctx) {
    const s = +(req.seconds || this.defaults.seconds); if (!(s >= 10 && s <= 300)) throw new Error('Độ dài nhạc 10 đến 300 s');
    const P = ctx.prices.elevenlabs; const credits = s * P.musicCreditsPerSec;
    return {usd: r4(credits * P.usdPerCredit), units: `${s} s ≈ ${Math.round(credits)} credit`, notes: 'Giá nhạc là ước tính thô (900 credit / 140 s đo ngày 2026-10-02).'};
  },
  async run(req, ctx) {
    const s = +(req.seconds || this.defaults.seconds);
    const body = {prompt: req.prompt, music_length_ms: Math.round(s * 1000), model_id: req.model || this.defaults.model}; if (req.opts?.instrumental !== false) body.force_instrumental = true;
    const r = await bfetch(`${API}/music?output_format=mp3_44100_128`, {method: 'POST', headers: {'xi-api-key': key(ctx)}, body, signal: ctx.signal, timeout: 600000});
    const f = path.join(ctx.tmp, 'music.mp3'); fs.writeFileSync(f, r.buf);
    return {files: [{file: f, ext: '.mp3', title: req.prompt.slice(0, 60)}], model: body.model_id, meta: {seconds: s}};
  },
};

export const elevenSfx = {
  id: 'elevenlabs-sfx', label: 'ElevenLabs hiệu ứng', kinds: ['sfx'], paid: true, keyId: 'elevenlabs', licence: LIC, defaults: {},
  estimate(req, ctx) {
    const P = ctx.prices.elevenlabs; const n = Math.max(1, Math.min(4, req.n || 1)); const s = req.seconds ? +req.seconds : null;
    if (s != null && !(s >= 0.5 && s <= 30)) throw new Error('Độ dài SFX 0,5 đến 30 s');
    const credits = n * (s ? s * P.sfxCreditsPerSec : P.sfxCreditsAuto);
    return {usd: r4(credits * P.usdPerCredit), units: `${n} × ${s ? s + ' s' : 'tự động'} ≈ ${Math.round(credits)} credit`};
  },
  async run(req, ctx) {
    const n = Math.max(1, Math.min(4, req.n || 1)); const files = [];
    for (let i = 0; i < n; i++) { // one at a time (never parallel)
      const body = {text: req.prompt, prompt_influence: req.opts?.prompt_influence ?? 0.4}; if (req.seconds) body.duration_seconds = +req.seconds;
      const r = await bfetch(`${API}/sound-generation?output_format=mp3_44100_128`, {method: 'POST', headers: {'xi-api-key': key(ctx)}, body, signal: ctx.signal});
      const f = path.join(ctx.tmp, `sfx-${i + 1}.mp3`); fs.writeFileSync(f, r.buf); files.push({file: f, ext: '.mp3', title: req.prompt.slice(0, 60)});
      ctx.onProgress?.({msg: `SFX ${i + 1}/${n}`});
    }
    return {files, model: 'sound-generation'};
  },
};

export default [elevenTts, elevenMusic, elevenSfx];
