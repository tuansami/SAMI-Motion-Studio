// SAMI brand system for the video. Every scene imports from here — no ad-hoc colours.
export const C: Record<string, string> = {
  // SAMI brand (from sami-agency.de: body bg rgb(12,6,40), logo gradient #08DDA4 → #7667FE)
  navy: '#0C0628',
  navyDeep: '#06031A',
  navyLift: '#16103A', // cards on navy
  line: 'rgba(255,255,255,0.10)',
  mint: '#08DDA4',
  purple: '#7667FE',
  white: '#FFFFFF',
  text: '#F4F2FF',
  muted: '#A8A3C9',
  dim: '#6E6893',
  red: '#FF5A5F', // pain / losses only
  // AN Vegan Restaurant (client, from Figma file)
  anDark: '#231A12',
  anDeep: '#15100B',
  anGold: '#C0A076',
  anGoldDeep: '#8C6E4A',
  anCream: '#E5DDD2',
  // Generic maps UI
  mapBg: '#EEF1F4',
  mapRoad: '#FFFFFF',
  mapPark: '#CDEBD3',
  mapWater: '#B7D9F2',
  pinRed: '#EA4335',
};

export let GRAD = `linear-gradient(120deg, ${C.mint} 0%, ${C.purple} 100%)`;

/** Apply a project's brand (project.json → brand) at render time. */
const DEFAULT_C = {...C};
export const applyBrand = (b?: {colors?: Record<string, string>; fonts?: Record<string, string>; gradient?: string}) => {
  Object.assign(C, DEFAULT_C, b?.colors || {});
  if (b?.fonts) Object.assign(F, b.fonts);
  GRAD = b?.gradient || `linear-gradient(120deg, ${C.mint} 0%, ${C.purple} 100%)`;
};

export const F: Record<string, string> = {
  head: '"Be Vietnam Pro", Inter, sans-serif', // Vietnamese kinetic headlines
  ui: 'Inter, "Be Vietnam Pro", sans-serif', // UI text
  mono: '"JetBrains Mono", monospace',
  serif: '"Playfair Display", serif', // AN website
  cormorant: 'Cormorant, serif', // VinRice / Mizuki websites
};

export const W = 1920;
export const H = 1080;
export const FPS = 30;
