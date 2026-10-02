import React, {createContext, useContext} from 'react';

export type Ratio = '16:9' | '9:16' | '1:1' | '4:5';
export const STAGES: Record<Ratio, {w: number; h: number}> = {
  '16:9': {w: 1920, h: 1080},
  '9:16': {w: 1080, h: 1920},
  '1:1': {w: 1080, h: 1080},
  '4:5': {w: 1080, h: 1350},
};
/** output resolution multipliers applied with Remotion `scale` (renders sharp, not upscaled) */
export const RESOLUTIONS = {FHD: 1, '2K': 4 / 3, '4K': 2} as const;
export type Resolution = keyof typeof RESOLUTIONS;

export type Format = {ratio: Ratio; w: number; h: number; portrait: boolean; square: boolean; landscape: boolean; native: boolean};
const Ctx = createContext<Format>({ratio: '16:9', w: 1920, h: 1080, portrait: false, square: false, landscape: true, native: true});
export const FormatProvider: React.FC<{ratio: Ratio; native: boolean; children: React.ReactNode}> = ({ratio, native, children}) => {
  const s = STAGES[ratio];
  return <Ctx.Provider value={{ratio, ...s, portrait: s.h > s.w, square: s.h === s.w, landscape: s.w > s.h, native}}>{children}</Ctx.Provider>;
};
/** Layout info for responsive scenes: const f = useFormat(); f.portrait ? … : … */
export const useFormat = () => useContext(Ctx);
/** pick a value per ratio: pick({ '16:9': 120, '9:16': 96, '1:1': 100 }) */
export const usePick = <T,>(v: Partial<Record<Ratio, T>> & {default?: T}): T => {
  const f = useFormat();
  return (v[f.ratio] ?? v.default ?? (v['16:9'] as T)) as T;
};
/** safe areas for social platforms (px on the stage) */
export const SAFE: Record<Ratio, {top: number; bottom: number; side: number}> = {
  '16:9': {top: 60, bottom: 60, side: 96},
  '9:16': {top: 220, bottom: 380, side: 72}, // Reels/TikTok UI
  '1:1': {top: 70, bottom: 90, side: 70},
  '4:5': {top: 90, bottom: 140, side: 70},
};
