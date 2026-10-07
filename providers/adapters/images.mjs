// Paid image APIs: OpenAI gpt-image, Gemini "nano banana", Black Forest Labs Flux, fal, Replicate.
// Multiple images are requested one call after another (never in parallel). Images never carry on-screen text:
// copy lives in project.json, so prompts get a "no text" suffix unless opts.allowText.
import fs from 'fs';
import path from 'path';
import {jfetch, bfetch, download, sleep, extOf} from '../net.mjs';

const r4 = (x) => Math.round(x * 10000) / 10000;
const nOf = (req, max = 10) => { const n = Math.round(+(req.n || 1)); if (!(n >= 1 && n <= max)) throw new Error(`Số ảnh 1 đến ${max}`); return n; };
const needKey = (ctx, label) => { if (!ctx.key) throw new Error(`Chưa có khoá ${label}. Nhập trong Studio → "Nguồn & AI" → Khoá API.`); return ctx.key; };
const noText = (req) => (req.opts?.allowText ? req.prompt : `${req.prompt.trim().replace(/[.\s]+$/, '')}. No text, no letters, no logos, no watermark.`);
const needPrompt = (req) => { if (!String(req.prompt || '').trim()) throw new Error('Chưa có prompt'); if (req.prompt.length > 4000) throw new Error('Prompt quá dài (tối đa 4000 ký tự)'); };
const portrait = (r) => ['9:16', '4:5', '2:3', '3:4'].includes(r), landscape = (r) => ['16:9', '3:2', '4:3', '21:9'].includes(r);

// ── OpenAI ────────────────────────────────────────────────────────────
const oaiSize = (r) => (portrait(r) ? '1024x1536' : landscape(r) ? '1536x1024' : '1024x1024');
export const openaiImage = {
  id: 'openai-image', label: 'OpenAI gpt-image', kinds: ['img'], paid: true, keyId: 'openai', models: ['gpt-image-1'], defaults: {model: 'gpt-image-1', quality: 'medium', ratio: '1:1'},
  licence: {name: 'OpenAI Terms: người dùng sở hữu đầu ra', url: 'https://openai.com/policies/terms-of-use', commercial: true},
  estimate(req, ctx) {
    needPrompt(req); const n = nOf(req); const q = req.opts?.quality || this.defaults.quality; const size = oaiSize(req.ratio || this.defaults.ratio);
    const per = ctx.prices.openai.perImage[q]?.[size]; if (per == null) throw new Error('quality: low | medium | high');
    return {usd: r4(per * n), units: `${n} ảnh ${size} ${q}`, notes: req.model && req.model !== 'gpt-image-1' ? 'Giá ước tính theo gpt-image-1.' : undefined};
  },
  async run(req, ctx) {
    const n = nOf(req); const size = oaiSize(req.ratio || this.defaults.ratio); const prompt = noText(req);
    const j = await jfetch('https://api.openai.com/v1/images/generations', {method: 'POST', headers: {Authorization: 'Bearer ' + needKey(ctx, 'OpenAI')}, body: {model: req.model || this.defaults.model, prompt, n, size, quality: req.opts?.quality || this.defaults.quality}, signal: ctx.signal, timeout: 300000});
    const files = (j.data || []).map((d, i) => { const f = path.join(ctx.tmp, `openai-${i + 1}.png`); fs.writeFileSync(f, Buffer.from(d.b64_json, 'base64')); return {file: f, ext: '.png', title: req.prompt.slice(0, 60)}; });
    const u = j.usage; const P = ctx.prices.openai;
    const usd = u ? r4((u.input_tokens_details?.text_tokens ?? u.input_tokens ?? 0) * P.tokenIn + (u.input_tokens_details?.image_tokens ?? 0) * P.tokenImgIn + (u.output_tokens ?? 0) * P.tokenOut) : undefined;
    return {files, model: req.model || this.defaults.model, usd, meta: {size, finalPrompt: prompt, usage: u || null}};
  },
};

// ── Gemini (nano banana) ──────────────────────────────────────────────
export const geminiImage = {
  id: 'gemini-image', label: 'Gemini nano banana', kinds: ['img'], paid: true, keyId: 'gemini', models: ['gemini-2.5-flash-image', 'gemini-3-pro-image-preview'], defaults: {model: 'gemini-2.5-flash-image', ratio: '1:1'},
  licence: {name: 'Google Gemini API Terms (đầu ra có watermark SynthID ẩn)', url: 'https://ai.google.dev/gemini-api/terms', commercial: true},
  estimate(req, ctx) {
    needPrompt(req); const n = nOf(req, 8); const m = req.model || this.defaults.model; const per = ctx.prices.gemini.perImage[m];
    if (per == null) throw new Error('Chưa có giá cho model ' + m); return {usd: r4(per * n), units: `${n} ảnh ${req.ratio || this.defaults.ratio}`};
  },
  async run(req, ctx) {
    const n = nOf(req, 8); const m = req.model || this.defaults.model; const prompt = noText(req); const files = [];
    for (let i = 0; i < n; i++) {
      const j = await jfetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`, {method: 'POST', headers: {'x-goog-api-key': needKey(ctx, 'Gemini')}, body: {contents: [{parts: [{text: prompt}]}], generationConfig: {responseModalities: ['IMAGE'], imageConfig: {aspectRatio: req.ratio || this.defaults.ratio}}}, signal: ctx.signal, timeout: 180000});
      const part = (j.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData?.data);
      if (!part) throw Object.assign(new Error('Gemini không trả ảnh (' + (j.candidates?.[0]?.finishReason || 'không rõ') + ')'), {sent: true, done: files.length});
      const f = path.join(ctx.tmp, `gemini-${i + 1}${extOf(part.inlineData.mimeType)}`); fs.writeFileSync(f, Buffer.from(part.inlineData.data, 'base64'));
      files.push({file: f, ext: extOf(part.inlineData.mimeType), title: req.prompt.slice(0, 60)}); ctx.onProgress?.({msg: `Ảnh ${i + 1}/${n}`});
    }
    return {files, model: m, meta: {finalPrompt: prompt}};
  },
};

// ── Black Forest Labs (Flux) ──────────────────────────────────────────
const bflWH = (r) => ({'9:16': [768, 1344], '16:9': [1344, 768], '4:5': [1024, 1280], '2:3': [832, 1248], '3:2': [1248, 832], '1:1': [1024, 1024]}[r] || [1024, 1024]);
export const bflFlux = {
  id: 'bfl-flux', label: 'Flux (Black Forest Labs)', kinds: ['img'], paid: true, keyId: 'bfl', models: ['flux-pro-1.1', 'flux-pro-1.1-ultra', 'flux-dev'], defaults: {model: 'flux-pro-1.1', ratio: '1:1'},
  licence: {name: 'BFL API Terms: dùng thương mại đầu ra', url: 'https://bfl.ai/legal/terms-of-service', commercial: true},
  estimate(req, ctx) { needPrompt(req); const n = nOf(req, 8); const m = req.model || this.defaults.model; const per = ctx.prices.bfl.perImage[m]; if (per == null) throw new Error('Chưa có giá cho model ' + m); return {usd: r4(per * n), units: `${n} ảnh ${m}`}; },
  async run(req, ctx) {
    const n = nOf(req, 8); const m = req.model || this.defaults.model; const key = needKey(ctx, 'BFL'); const prompt = noText(req); const files = [];
    for (let i = 0; i < n; i++) {
      const [w, h] = bflWH(req.ratio || this.defaults.ratio);
      const body = m.endsWith('ultra') ? {prompt, aspect_ratio: req.ratio || '1:1'} : {prompt, width: w, height: h};
      const j = await jfetch(`https://api.bfl.ai/v1/${m}`, {method: 'POST', headers: {'x-key': key, accept: 'application/json'}, body, signal: ctx.signal});
      const t0 = Date.now(); let url = null;
      while (!url) {
        await sleep(1500, ctx.signal);
        const p = await jfetch(j.polling_url, {headers: {'x-key': key}, signal: ctx.signal});
        if (p.status === 'Ready') url = p.result?.sample;
        else if (/error|failed|moderated/i.test(p.status)) throw Object.assign(new Error('Flux: ' + p.status), {sent: true});
        if (Date.now() - t0 > 300000) throw Object.assign(new Error('Flux quá 5 phút'), {sent: true});
      }
      const r = await download(url, path.join(ctx.tmp, `flux-${i + 1}`), {signal: ctx.signal});
      files.push({file: r.file, ext: extOf(r.type, url), title: req.prompt.slice(0, 60)}); ctx.onProgress?.({msg: `Ảnh ${i + 1}/${n}`});
    }
    return {files, model: m, meta: {finalPrompt: prompt}};
  },
};

// ── fal.ai (queue API) ────────────────────────────────────────────────
const falSize = (r) => ({'9:16': 'portrait_16_9', '16:9': 'landscape_16_9', '4:5': 'portrait_4_3', '3:4': 'portrait_4_3', '4:3': 'landscape_4_3', '1:1': 'square_hd'}[r] || 'square_hd');
export const fal = {
  id: 'fal', label: 'fal.ai', kinds: ['img'], paid: true, keyId: 'fal', defaults: {model: 'fal-ai/flux/dev', ratio: '1:1'},
  licence: {name: 'theo model trên fal.ai', url: 'https://fal.ai/terms', commercial: 'check', notes: 'Flux dev: đầu ra dùng thương mại được qua API trả phí; kiểm giấy phép từng model.'},
  estimate(req, ctx) { needPrompt(req); const n = nOf(req, 8); const m = req.model || this.defaults.model; const per = ctx.prices.fal.perRun[m]; if (per == null) throw new Error(`Chưa có giá cho ${m}. Chỉ chạy model có trong bảng giá: ${Object.keys(ctx.prices.fal.perRun).join(', ')}`); return {usd: r4(per * n), units: `${n} ảnh ${m}`}; },
  async run(req, ctx) {
    const m = req.model || this.defaults.model; if (!/^[\w-]+\/[\w./-]+$/.test(m)) throw new Error('model fal không hợp lệ');
    const n = nOf(req, 8); const key = needKey(ctx, 'fal'); const H = {Authorization: 'Key ' + key}; const prompt = noText(req); const files = [];
    for (let i = 0; i < n; i++) {
      const q = await jfetch(`https://queue.fal.run/${m}`, {method: 'POST', headers: H, body: {prompt, image_size: falSize(req.ratio || '1:1'), num_images: 1, enable_safety_checker: true}, signal: ctx.signal});
      const t0 = Date.now(); let st;
      do { await sleep(1500, ctx.signal); st = await jfetch(q.status_url, {headers: H, signal: ctx.signal}); if (Date.now() - t0 > 600000) throw Object.assign(new Error('fal quá 10 phút'), {sent: true}); } while (st.status !== 'COMPLETED');
      const out = await jfetch(q.response_url, {headers: H, signal: ctx.signal});
      for (const im of out.images || []) { const r = await download(im.url, path.join(ctx.tmp, `fal-${files.length + 1}`), {signal: ctx.signal}); files.push({file: r.file, ext: extOf(r.type || im.content_type, im.url), title: req.prompt.slice(0, 60)}); }
      ctx.onProgress?.({msg: `Ảnh ${i + 1}/${n}`});
    }
    return {files, model: m, meta: {finalPrompt: prompt}};
  },
};

// ── Replicate ─────────────────────────────────────────────────────────
export const replicate = {
  id: 'replicate', label: 'Replicate', kinds: ['img'], paid: true, keyId: 'replicate', defaults: {model: 'black-forest-labs/flux-dev', ratio: '1:1'},
  licence: {name: 'theo model trên Replicate', url: 'https://replicate.com/terms', commercial: 'check'},
  estimate(req, ctx) { needPrompt(req); const n = nOf(req, 8); const m = req.model || this.defaults.model; const per = ctx.prices.replicate.perRun[m]; if (per == null) throw new Error(`Chưa có giá cho ${m}. Chỉ chạy: ${Object.keys(ctx.prices.replicate.perRun).join(', ')}`); return {usd: r4(per * n), units: `${n} ảnh ${m}`}; },
  async run(req, ctx) {
    const m = req.model || this.defaults.model; if (!/^[\w-]+\/[\w.-]+$/.test(m)) throw new Error('model Replicate không hợp lệ');
    const n = nOf(req, 8); const H = {Authorization: 'Bearer ' + needKey(ctx, 'Replicate'), Prefer: 'wait=60'}; const prompt = noText(req); const files = [];
    for (let i = 0; i < n; i++) {
      let p = await jfetch(`https://api.replicate.com/v1/models/${m}/predictions`, {method: 'POST', headers: H, body: {input: {prompt, aspect_ratio: req.ratio || '1:1', output_format: 'png'}}, signal: ctx.signal, timeout: 120000});
      const t0 = Date.now();
      while (!['succeeded', 'failed', 'canceled'].includes(p.status)) { await sleep(2000, ctx.signal); p = await jfetch(p.urls.get, {headers: {Authorization: H.Authorization}, signal: ctx.signal}); if (Date.now() - t0 > 600000) throw Object.assign(new Error('Replicate quá 10 phút'), {sent: true}); }
      if (p.status !== 'succeeded') throw Object.assign(new Error('Replicate: ' + (p.error || p.status)), {sent: true});
      for (const url of [].concat(p.output || [])) { const r = await download(url, path.join(ctx.tmp, `replicate-${files.length + 1}`), {signal: ctx.signal}); files.push({file: r.file, ext: extOf(r.type, url), title: req.prompt.slice(0, 60)}); }
      ctx.onProgress?.({msg: `Ảnh ${i + 1}/${n}`});
    }
    return {files, model: m, meta: {finalPrompt: prompt}};
  },
};

export default [openaiImage, geminiImage, bflFlux, fal, replicate];
