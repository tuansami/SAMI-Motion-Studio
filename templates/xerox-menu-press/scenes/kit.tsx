import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useFormat, SAFE} from '@engine/core/format';
import {tw} from '@engine/lib/anim';
import {C, F} from '@engine/theme';

// Xerox Menu Press · shared kit — photocopy / riso filters, sheet geometry, registration marks.
// Colours come from project.json → brand.colors (paper, sheet, ink, red, blue). Fonts from brand.fonts (display, mono).

export const BEAT = 15;
/** stepped beat index (snaps, never smooth) */
export const beatIdx = (t: number) => Math.floor(Math.max(0, t) / BEAT);
export const DISPLAY = () => F.display || '"Archivo Black", sans-serif';
export const MONO = () => F.mono || '"IBM Plex Mono", monospace';

/** '#RRGGBB' → [r,g,b] 0..1 */
export const rgb = (hex: string, fb = [0, 0, 0]): number[] => {
  const h = String(hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}/.test(h)) return fb;
  const n = parseInt(h.slice(0, 6), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
/** hex colour + alpha (0..1) */
export const alpha = (hex: string, a: number) => {
  const [r, g, b] = rgb(hex);
  return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a})`;
};

/** map gray 0..1 → dark..light colour */
const Tint: React.FC<{dark: string; light: string}> = ({dark, light}) => {
  const d = rgb(dark), l = rgb(light, [1, 1, 1]);
  return (
    <feComponentTransfer>
      <feFuncR type="table" tableValues={`${d[0]} ${l[0]}`} />
      <feFuncG type="table" tableValues={`${d[1]} ${l[1]}`} />
      <feFuncB type="table" tableValues={`${d[2]} ${l[2]}`} />
    </feComponentTransfer>
  );
};

/** one halftone cell: black centre → white corners (distance field) */
const dotTile = (s: number) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><defs><radialGradient id="g" cx="50%" cy="50%" r="71%"><stop offset="0" stop-color="black"/><stop offset="1" stop-color="white"/></radialGradient></defs><rect width="${s}" height="${s}" fill="url(#g)"/></svg>`,
  );

const Thresh: React.FC = () => (
  <feComponentTransfer>
    <feFuncR type="discrete" tableValues="0 1" />
    <feFuncG type="discrete" tableValues="0 1" />
    <feFuncB type="discrete" tableValues="0 1" />
  </feComponentTransfer>
);

/**
 * All photocopy filters, referenced from HTML with style={{filter: 'url(#id)'}}.
 * - `${id}-copy`  pass 1: crushed contrast + toner noise, 1-bit
 * - `${id}-dots`  pass 2: halftone screen, 1-bit
 * - `${id}-red` / `${id}-blue`  pass 3: riso plates (multiply them over paper)
 * - `${id}-ink`   rough printed edges + speckle holes for type
 * `seed` changes per beat → the toner "boils" on the beat.
 */
export const PressFilters: React.FC<{id: string; seed: number; dot?: number}> = ({id, seed, dot = 14}) => (
  <svg width="0" height="0" style={{position: 'absolute'}}>
    <defs>
      <filter id={`${id}-copy`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0" in="SourceGraphic" result="g" />
        <feComponentTransfer in="g" result="c">
          <feFuncR type="linear" slope="2.4" intercept="-0.45" />
          <feFuncG type="linear" slope="2.4" intercept="-0.45" />
          <feFuncB type="linear" slope="2.4" intercept="-0.45" />
        </feComponentTransfer>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed={seed} result="n" />
        <feColorMatrix in="n" type="saturate" values="0" result="ng" />
        <feComposite in="c" in2="ng" operator="arithmetic" k1="0" k2="1" k3="0.55" k4="-0.27" />
        <Thresh />
        <Tint dark={C.ink} light={C.sheet} />
      </filter>
      <filter id={`${id}-dots`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0" in="SourceGraphic" />
        <feGaussianBlur stdDeviation="1.6" />
        <feComponentTransfer result="c">
          <feFuncR type="linear" slope="1.35" intercept="-0.1" />
          <feFuncG type="linear" slope="1.35" intercept="-0.1" />
          <feFuncB type="linear" slope="1.35" intercept="-0.1" />
        </feComponentTransfer>
        <feImage href={dotTile(dot)} x="0" y="0" width={dot} height={dot} preserveAspectRatio="none" result="cell" />
        <feTile in="cell" result="screen" />
        <feComposite in="c" in2="screen" operator="arithmetic" k1="0" k2="1" k3="1" k4="-0.5" />
        <Thresh />
        <Tint dark={C.ink} light={C.sheet} />
      </filter>
      {(['red', 'blue'] as const).map((pl, k) => {
        const s = k ? dot + 4 : dot - 2;
        return (
          <filter key={pl} id={`${id}-${pl}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            {/* red plate pulls warm tones (inverted cyan-ish channel), blue plate pulls the shadows */}
            <feColorMatrix
              type="matrix"
              in="SourceGraphic"
              values={k ? '0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0 0 0 1 0' : '-0.2 0.9 0.3 0 0  -0.2 0.9 0.3 0 0  -0.2 0.9 0.3 0 0  0 0 0 1 0'}
            />
            <feGaussianBlur stdDeviation="1.4" />
            <feComponentTransfer result="c">
              <feFuncR type="linear" slope={k ? 1.5 : 1.25} intercept={k ? 0.05 : 0.02} />
              <feFuncG type="linear" slope={k ? 1.5 : 1.25} intercept={k ? 0.05 : 0.02} />
              <feFuncB type="linear" slope={k ? 1.5 : 1.25} intercept={k ? 0.05 : 0.02} />
            </feComponentTransfer>
            <feImage href={dotTile(s)} x={k ? s / 2 : 0} y={k ? s / 2 : 0} width={s} height={s} preserveAspectRatio="none" result="cell" />
            <feTile in="cell" result="screen" />
            <feComposite in="c" in2="screen" operator="arithmetic" k1="0" k2="1" k3="1" k4="-0.5" />
            <Thresh />
            <Tint dark={k ? C.blue : C.red} light="#ffffff" />
          </filter>
        );
      })}
      <filter id={`${id}-ink`} x="-4%" y="-8%" width="108%" height="116%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed={seed} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" result="d" />
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="1" seed={seed + 11} result="sp" />
        <feColorMatrix in="sp" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  13 0 0 0 -8.9" result="holes" />
        <feComposite in="d" in2="holes" operator="out" />
      </filter>
    </defs>
  </svg>
);

/** The printed sheet — same place in S01 and S02 so the cut feels continuous. */
export const useSheet = () => {
  const f = useFormat();
  return f.portrait ? {x: 160, y: 340, w: 760, h: 1020} : {x: 650, y: 96, w: 620, h: 880};
};

/** paper background + faint fibre texture (static) */
export const Paper: React.FC<{color?: string}> = ({color}) => (
  <AbsoluteFill style={{background: color || C.paper}}>
    <AbsoluteFill style={{backgroundImage: `radial-gradient(${alpha(C.ink, 0.05)} 1px, transparent 1.2px)`, backgroundSize: '7px 7px', opacity: 0.6}} />
  </AbsoluteFill>
);

/** printer's registration marks in the safe corners; `p` 0..1 draws them */
export const RegMarks: React.FC<{p?: number; color?: string}> = ({p = 1, color}) => {
  const f = useFormat();
  const s = SAFE[f.ratio];
  const pad = f.portrait ? 40 : 34;
  const pts: [number, number][] = [
    [s.side * 0.55 + pad, s.top * (f.portrait ? 0.62 : 0.6) + pad],
    [f.w - s.side * 0.55 - pad, s.top * (f.portrait ? 0.62 : 0.6) + pad],
    [s.side * 0.55 + pad, f.h - s.bottom * (f.portrait ? 0.45 : 0.6) - pad],
    [f.w - s.side * 0.55 - pad, f.h - s.bottom * (f.portrait ? 0.45 : 0.6) - pad],
  ];
  const col = color || C.ink;
  return (
    <svg width={f.w} height={f.h} style={{position: 'absolute', inset: 0, opacity: 0.55}}>
      {pts.map(([x, y], i) => {
        const q = Math.max(0, Math.min(1, p * 1.4 - i * 0.12));
        return (
          <g key={i} transform={`translate(${x} ${y})`} opacity={q}>
            <circle r={13 * q} fill="none" stroke={col} strokeWidth={2} />
            <line x1={-24 * q} x2={24 * q} y1={0} y2={0} stroke={col} strokeWidth={2} />
            <line y1={-24 * q} y2={24 * q} x1={0} x2={0} stroke={col} strokeWidth={2} />
          </g>
        );
      })}
    </svg>
  );
};

/** stamp: snaps from big to 1 in 5 frames (lands exactly on the beat it starts) */
export const stamp = (t: number, s: number) => {
  const p = tw(t, s, 5);
  return {p, on: t >= s, scale: 1.32 - 0.32 * p};
};

/** fit font size so the longest line fits `w` (Archivo Black ≈ 0.78 em per uppercase glyph) */
export const fitSize = (lines: string[], w: number, max: number, em = 0.78) => {
  const n = Math.max(1, ...lines.map((l) => l.length));
  return Math.min(max, Math.floor(w / (n * em)));
};
