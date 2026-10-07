// Estimated prices in USD (checked 2026-10; providers change prices, so these are ESTIMATES for the cost caps).
// When the API reports real usage (OpenAI tokens, ElevenLabs character-cost) the ledger stores the actual cost too.
// To correct a price without a release: %APPDATA%\SAMI\providers.json → opts.pricing.<path> overrides any value below.
import {load} from './config.mjs';

const BASE = {
  // ElevenLabs bills credits from the subscription. Pro: 99 USD / 500k credits ≈ 0.000198 USD per credit.
  elevenlabs: {usdPerCredit: 0.000198, ttsCreditsPerChar: {default: 1, eleven_flash_v2_5: 0.5, eleven_turbo_v2_5: 0.5}, musicCreditsPerSec: 6.5, sfxCreditsPerSec: 40, sfxCreditsAuto: 200},
  // OpenAI gpt-image-1 per image (quality × size); tokens when reported: text in 5 / image out 40 USD per 1M
  openai: {perImage: {low: {'1024x1024': 0.011, '1024x1536': 0.016, '1536x1024': 0.016}, medium: {'1024x1024': 0.042, '1024x1536': 0.063, '1536x1024': 0.063}, high: {'1024x1024': 0.167, '1024x1536': 0.25, '1536x1024': 0.25}}, tokenIn: 5e-6, tokenImgIn: 10e-6, tokenOut: 40e-6},
  // Gemini image ("nano banana"): per output image
  gemini: {perImage: {'gemini-2.5-flash-image': 0.039, 'gemini-3-pro-image-preview': 0.134}},
  // Black Forest Labs API: per image
  bfl: {perImage: {'flux-pro-1.1': 0.04, 'flux-pro-1.1-ultra': 0.06, 'flux-dev': 0.025, 'flux-kontext-pro': 0.04}},
  // fal / Replicate: only models listed here can run (per output image / per run)
  fal: {perRun: {'fal-ai/flux/schnell': 0.003, 'fal-ai/flux/dev': 0.025, 'fal-ai/flux-pro/v1.1': 0.04}},
  replicate: {perRun: {'black-forest-labs/flux-schnell': 0.003, 'black-forest-labs/flux-dev': 0.025, 'black-forest-labs/flux-1.1-pro': 0.04}},
};

const merge = (a, b) => { if (!b || typeof b !== 'object') return a; const o = {...a}; for (const [k, v] of Object.entries(b)) o[k] = v && typeof v === 'object' && !Array.isArray(v) ? merge(a?.[k] || {}, v) : v; return o; };
export const prices = () => merge(BASE, load().opts?.pricing);
