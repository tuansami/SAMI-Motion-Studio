import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {useT} from '@engine/lib/useT';
import {rnd} from '@engine/lib/anim';
import {useFormat, SAFE} from '@engine/core/format';
import {C} from '@engine/theme';

// Shared VHS toolkit for the "Family Tape" template. Colours come from project.json → brand.colors.
export const VT = '"VT323", "JetBrains Mono", monospace';
export const BG = '"Bricolage Grotesque", Inter, sans-serif';

/** OSD text like a 90s VCR: VT323, white, hard drop shadow. */
export const Osd: React.FC<{children?: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({children, size = 64, color = '#fff', style}) => (
  <div style={{fontFamily: VT, fontSize: size, lineHeight: 1, color, textShadow: '3px 3px 0 rgba(0,0,0,0.55), 0 0 12px rgba(255,255,255,0.25)', letterSpacing: '0.04em', whiteSpace: 'nowrap', ...style}}>{children}</div>
);

/** Corner positions that respect the platform safe zones (9:16: Reels UI). */
export const useCorners = () => {
  const f = useFormat();
  const s = SAFE[f.ratio];
  const side = f.portrait ? s.side + 8 : 110;
  const top = f.portrait ? s.top : 80;
  const bottom = f.portrait ? s.bottom : 80;
  return {side, top, bottom};
};

/** Timecode string from scene time, e.g. "SP 0:12:07". */
export const timecode = (base: number, t: number) => {
  const s = Math.max(0, Math.floor(base + t / 30));
  const p = (n: number) => String(n).padStart(2, '0');
  return `SP ${Math.floor(s / 3600)}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`;
};

/** Static snow (engine grain tiles, pixel-scaled). */
export const Snow: React.FC<{opacity?: number}> = ({opacity = 1}) => {
  const t = useT();
  const k = ((Math.floor(t) % 6) + 6) % 6;
  return opacity <= 0 ? null : (
    <AbsoluteFill style={{opacity, background: '#000', overflow: 'hidden'}}>
      <Img src={staticFile(`_engine/grain${k}.png`)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated', filter: 'grayscale(1) contrast(3.2) brightness(1.15)', transform: `scale(${2 + (k % 3) * 0.3})`}} />
    </AbsoluteFill>
  );
};

/** Horizontal noise streaks inside a band (tracking error). */
const Streaks: React.FC<{y: number; h: number; seed: number; w: number; n?: number}> = ({y, h, seed, w, n = 16}) => (
  <>
    {Array.from({length: n}).map((_, i) => {
      const r1 = rnd(seed * 31 + i * 7.1), r2 = rnd(seed * 17 + i * 3.3), r3 = rnd(seed * 5 + i * 11.7);
      return <div key={i} style={{position: 'absolute', left: r1 * w * 0.9 - w * 0.1, top: y + r2 * h, width: (0.08 + r3 * 0.45) * w, height: 1 + Math.round(r3 * 3), background: '#fff', opacity: 0.35 + r2 * 0.6, filter: 'blur(0.6px)'}} />;
    })}
  </>
);

/**
 * The VHS look around any content: RGB split (3 tinted copies, screen blend), horizontal jitter,
 * tracking band rolling down, head-switching noise at the bottom, scanlines, tungsten grade.
 * `render` must be pure (called several times per frame).
 */
export const Vhs: React.FC<{
  id: string;
  render: () => React.ReactNode;
  split?: number;
  jitter?: number;
  band?: number; // 0..1 strength of the tracking band
  bandSpeed?: number;
  grade?: number;
  freeze?: boolean;
}> = ({id, render, split = 7, jitter = 1, band = 1, bandSpeed = 9, grade = 1, freeze = false}) => {
  const t = useT();
  const f = useFormat();
  const fr = freeze ? 3 : Math.floor(t);
  const big = rnd(Math.floor(fr / 6) * 13 + 2) > 0.82 ? (rnd(fr * 5 + 1) - 0.5) * 22 : 0;
  const jx = ((rnd(fr * 3 + 1) - 0.5) * 5 + big) * jitter;
  const cycle = f.h + 420;
  const by = ((t * bandSpeed + 160) % cycle) - 210;
  const bh = f.portrait ? 120 : 90;
  const sp = split * (1 + Math.abs(big) / 18);
  const mat = {r: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', g: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0', b: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0'};
  const chan = (k: 'r' | 'g' | 'b', dx: number) => (
    <AbsoluteFill style={{filter: `url(#${id}${k})`, mixBlendMode: 'screen', transform: `translateX(${dx}px)`}}>{render()}</AbsoluteFill>
  );
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <svg width="0" height="0" style={{position: 'absolute'}}>
        <defs>
          {(['r', 'g', 'b'] as const).map((k) => (
            <filter key={k} id={id + k} colorInterpolationFilters="sRGB">
              <feColorMatrix type="matrix" values={mat[k]} />
            </filter>
          ))}
        </defs>
      </svg>
      <AbsoluteFill style={{background: '#000', isolation: 'isolate', transform: `translateX(${jx}px) scale(1.03)`, filter: `sepia(${0.3 * grade}) saturate(${1 + 0.25 * grade}) contrast(1.06) blur(0.8px)`}}>
        {chan('r', sp)}
        {chan('g', 0)}
        {chan('b', -sp * 0.8)}
      </AbsoluteFill>
      {/* tracking band: displaced slice + streaks */}
      {band > 0 && (
        <>
          <AbsoluteFill style={{clipPath: `inset(${Math.max(0, by)}px 0 ${Math.max(0, f.h - by - bh)}px 0)`, transform: `translateX(${(18 + rnd(fr) * 26) * band}px)`, opacity: 0.9 * band, filter: 'brightness(1.35) saturate(0.6) blur(1.2px)'}}>
            {render()}
          </AbsoluteFill>
          <div style={{position: 'absolute', left: 0, right: 0, top: by, height: bh, opacity: band}}>
            <Streaks y={0} h={bh} seed={fr} w={f.w} />
          </div>
        </>
      )}
      {/* head-switching noise at the bottom */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 16, background: 'rgba(0,0,0,0.55)', overflow: 'hidden'}}>
        <Streaks y={0} h={14} seed={fr + 500} w={f.w} n={8} />
      </div>
      {/* tungsten grade + scanlines */}
      <AbsoluteFill style={{background: C.tungsten, mixBlendMode: 'soft-light', opacity: 0.28 * grade}} />
      <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(to bottom, rgba(0,0,0,0.26) 0px, rgba(0,0,0,0.26) 2px, transparent 2px, transparent 4px)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.5) 100%)'}} />
    </AbsoluteFill>
  );
};

/** Dark scrims top + bottom so OSD / captions stay readable on bright photos. */
export const Scrim: React.FC<{k?: number}> = ({k = 1}) => (
  <AbsoluteFill style={{background: `linear-gradient(180deg, rgba(0,0,0,${0.55 * k}) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 58%, rgba(0,0,0,${0.75 * k}) 100%)`}} />
);

/** Scanlines only (for clean OSD-on-colour screens). */
export const Scanlines: React.FC<{opacity?: number}> = ({opacity = 1}) => (
  <AbsoluteFill style={{opacity, backgroundImage: 'repeating-linear-gradient(to bottom, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 2px, transparent 2px, transparent 4px)'}} />
);
