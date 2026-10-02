import React from 'react';
import {rnd} from '@engine/lib/anim';
import {C, F} from '@engine/theme';

// Dither to Dish · shared kit — ordered (Bayer 4×4) 1-bit dither as a pure SVG filter, a procedural city map,
// pixel sprites (pin, star). Colours from project.json → brand.colors (night, cream, signal, go); fonts from brand.fonts (pixel, sans).

export const BEAT = 15;
export const beatIdx = (t: number) => Math.floor(Math.max(0, t) / BEAT);
export const PIXEL = () => F.pixel || 'Silkscreen, monospace';
export const SANS = () => F.sans || '"Space Grotesk", sans-serif';

export const rgb = (hex: string, fb = [0, 0, 0]): number[] => {
  const h = String(hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}/.test(h)) return fb;
  const n = parseInt(h.slice(0, 6), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
export const alpha = (hex: string, a: number) => {
  const [r, g, b] = rgb(hex);
  return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a})`;
};

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** 4×4 Bayer tile, each threshold cell = c px. Stored INVERTED (1 − threshold) so the compare keeps alpha = 1. */
const bayerTile = (c: number) => {
  let r = '';
  BAYER.forEach((v, i) => {
    const g = Math.round((1 - (v + 0.5) / 16) * 255);
    r += `<rect x="${(i % 4) * c}" y="${Math.floor(i / 4) * c}" width="${c}" height="${c}" fill="rgb(${g},${g},${g})"/>`;
  });
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${4 * c}" height="${4 * c}" shape-rendering="crispEdges">${r}</svg>`);
};

/**
 * 1-bit ordered dither. Apply from HTML: style={{filter: `url(#${id})`}}.
 * cell = size of one dither pixel in px (48 = very coarse … 2 = fine). Pixelates first (flood + tile + dilate), then
 * compares luminance with the Bayer matrix and maps 0/1 → dark/light. `gain` lifts mid-tones.
 */
export const DitherFilter: React.FC<{id: string; cell: number; dark?: string; light?: string; gain?: number; bias?: number}> = ({id, cell, dark, light, gain = 1, bias = 0}) => {
  const c = Math.max(2, Math.round(cell));
  const h = Math.floor(c / 2);
  const d = rgb(dark || C.night), l = rgb(light || C.cream, [1, 1, 1]);
  return (
    <svg width="0" height="0" style={{position: 'absolute'}}>
      <defs>
        <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          {c > 2 ? (
            <>
              <feFlood x={h - 1} y={h - 1} width="2" height="2" floodColor="white" result="dot" />
              <feComposite in="dot" in2="dot" width={c} height={c} result="cellDot" />
              <feTile in="cellDot" result="grid" />
              <feComposite in="SourceGraphic" in2="grid" operator="in" result="samp" />
              <feMorphology in="samp" operator="dilate" radius={h} result="px" />
            </>
          ) : (
            <feOffset in="SourceGraphic" dx="0" dy="0" result="px" />
          )}
          <feColorMatrix in="px" type="matrix" values={`0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0 0 0 0 1`} result="lum0" />
          <feComponentTransfer in="lum0" result="lum">
            <feFuncR type="linear" slope={gain} intercept={bias} />
            <feFuncG type="linear" slope={gain} intercept={bias} />
            <feFuncB type="linear" slope={gain} intercept={bias} />
          </feComponentTransfer>
          <feImage href={bayerTile(c)} x="0" y="0" width={4 * c} height={4 * c} preserveAspectRatio="none" result="b" />
          <feTile in="b" result="bayer" />
          <feComposite in="lum" in2="bayer" operator="arithmetic" k1="0" k2="1" k3="1" k4="-0.5" />
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues={`${d[0]} ${l[0]}`} />
            <feFuncG type="discrete" tableValues={`${d[1]} ${l[1]}`} />
            <feFuncB type="discrete" tableValues={`${d[2]} ${l[2]}`} />
            <feFuncA type="table" tableValues="1 1" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  );
};

// ───────────────────────── procedural city ─────────────────────────
export const WORLD = 4800;
export const TARGET = {x: 2400, y: 2400};
const g = (v: number) => {
  const k = Math.round(v * 255);
  return `rgb(${k},${k},${k})`;
};
type Block = {x: number; y: number; w: number; h: number; tone: number; kind: 'b' | 'park'; d: number; inner?: {x: number; y: number; w: number; h: number}[]};

const lines = (seed: number) => {
  const out: number[] = [];
  // walk outwards from the target so a street crossing sits exactly on it
  let p = TARGET.x;
  let k = 0;
  while (p < WORLD + 400) { out.push(p); p += 210 + Math.round(rnd(seed + k++) * 160); }
  p = TARGET.x;
  while (p > -400) { p -= 210 + Math.round(rnd(seed + 50 + k++) * 160); out.unshift(p); }
  return out;
};
let CACHE: Block[] | null = null;
export const cityBlocks = (): Block[] => {
  if (CACHE) return CACHE;
  const xs = lines(11), ys = lines(37);
  const blocks: Block[] = [];
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < ys.length - 1; j++) {
      const avenueX = i % 4 === 0 ? 30 : 0, avenueY = j % 4 === 0 ? 30 : 0;
      const st = 26;
      const x = xs[i] + st + avenueX, y = ys[j] + st + avenueY;
      const w = xs[i + 1] - xs[i] - st * 2 - avenueX, h = ys[j + 1] - ys[j] - st * 2 - avenueY;
      if (w < 40 || h < 40) continue;
      const s = i * 97 + j * 31;
      const park = rnd(s + 3) > 0.9;
      const cx = x + w / 2 - TARGET.x, cy = y + h / 2 - TARGET.y;
      const inner = [] as Block['inner'];
      if (!park && rnd(s + 7) > 0.35) {
        const n = 1 + Math.floor(rnd(s + 9) * 3);
        for (let q = 0; q < n; q++) {
          const iw = w * (0.18 + rnd(s + q * 5) * 0.25), ih = h * (0.18 + rnd(s + q * 7) * 0.25);
          inner!.push({x: x + 14 + rnd(s + q * 11) * (w - iw - 28), y: y + 14 + rnd(s + q * 13) * (h - ih - 28), w: iw, h: ih});
        }
      }
      blocks.push({x, y, w, h, tone: park ? 0.58 : 0.06 + rnd(s + 1) * 0.28, kind: park ? 'park' : 'b', d: Math.hypot(cx, cy), inner});
    }
  }
  CACHE = blocks;
  return blocks;
};

/**
 * The city in grey tones (the dither filter turns it into 1-bit). Drawn in world units; `reveal` = world radius
 * (blocks closer to the target than this are built). `flash` = blocks within this ring show their light "fresh" tone.
 */
export const CityMap: React.FC<{reveal?: number; flash?: number}> = ({reveal = 1e9, flash = -1}) => {
  const blocks = cityBlocks();
  return (
    <g>
      <rect x={-400} y={-400} width={WORLD + 800} height={WORLD + 800} fill={g(1)} />
      {/* river: a wide diagonal band with wave texture */}
      <path d={`M -400 ${WORLD * 0.18} C ${WORLD * 0.3} ${WORLD * 0.05}, ${WORLD * 0.55} ${WORLD * 0.42}, ${WORLD + 400} ${WORLD * 0.28}`} stroke={g(0.72)} strokeWidth={300} fill="none" />
      <path d={`M -400 ${WORLD * 0.18} C ${WORLD * 0.3} ${WORLD * 0.05}, ${WORLD * 0.55} ${WORLD * 0.42}, ${WORLD + 400} ${WORLD * 0.28}`} stroke={g(0.82)} strokeWidth={60} strokeDasharray="60 90" fill="none" />
      {blocks.map((b, i) => {
        if (b.d > reveal) return null;
        const fresh = b.d > flash && flash >= 0;
        return (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={g(fresh ? 0.55 : b.tone)} />
            {b.kind === 'park'
              ? [0, 1, 2, 3, 4, 5].map((q) => <circle key={q} cx={b.x + 20 + rnd(i * 13 + q) * (b.w - 40)} cy={b.y + 20 + rnd(i * 17 + q) * (b.h - 40)} r={18 + rnd(i + q) * 16} fill={g(0.3)} />)
              : b.inner!.map((r, q) => <rect key={q} x={r.x} y={r.y} width={r.w} height={r.h} fill={g(fresh ? 0.75 : b.tone + 0.3)} />)}
          </g>
        );
      })}
    </g>
  );
};

// ───────────────────────── pixel sprites ─────────────────────────
export const PIN = ['...XXXXX...', '..XXXXXXX..', '.XXXXXXXXX.', 'XXXX...XXXX', 'XXX.....XXX', 'XXX.....XXX', 'XXXX...XXXX', '.XXXXXXXXX.', '..XXXXXXX..', '...XXXXX...', '....XXX....', '.....X.....'];
export const STAR = ['....X....', '...XXX...', '...XXX...', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..', '..XXXXX..', '.XXX.XXX.', '.XX...XX.'];
export const Sprite: React.FC<{map: string[]; px: number; color: string; shadow?: string; style?: React.CSSProperties}> = ({map, px, color, shadow, style}) => {
  const w = map[0].length * px, h = map.length * px;
  const cells: React.ReactNode[] = [];
  map.forEach((row, y) =>
    row.split('').forEach((ch, x) => {
      if (ch !== 'X') return;
      if (shadow) cells.push(<rect key={`s${x}-${y}`} x={x * px + px * 0.5} y={y * px + px * 0.5} width={px} height={px} fill={shadow} />);
    }),
  );
  map.forEach((row, y) =>
    row.split('').forEach((ch, x) => {
      if (ch === 'X') cells.push(<rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={color} />);
    }),
  );
  return (
    <svg width={w + px} height={h + px} shapeRendering="crispEdges" style={{display: 'block', overflow: 'visible', ...style}}>
      {cells}
    </svg>
  );
};

/** pixel corner brackets (crosshair / focus box) */
export const Brackets: React.FC<{w: number; h: number; px?: number; color: string}> = ({w, h, px = 8, color}) => {
  const L = px * 5;
  return (
    <svg width={w} height={h} shapeRendering="crispEdges" style={{display: 'block', overflow: 'visible'}}>
      {[
        [0, 0],
        [w - L, 0],
        [0, h - px],
        [w - L, h - px],
      ].map(([x, y], i) => <rect key={'h' + i} x={x} y={y} width={L} height={px} fill={color} />)}
      {[
        [0, 0],
        [w - px, 0],
        [0, h - L],
        [w - px, h - L],
      ].map(([x, y], i) => <rect key={'v' + i} x={x} y={y} width={px} height={L} fill={color} />)}
    </svg>
  );
};

/** full-frame dithered map. scale = screen px per world unit, centred on the target (+ optional screen offset). */
export const MapView: React.FC<{id: string; w: number; h: number; scale: number; cell: number; reveal?: number; flash?: number; cx?: number; cy?: number; dim?: number}> = ({id, w, h, scale, cell, reveal, flash, cx, cy, dim = 0}) => (
  <div style={{position: 'absolute', inset: 0}}>
    <DitherFilter id={id} cell={cell} bias={-dim} />
    <div style={{position: 'absolute', inset: 0, filter: `url(#${id})`}}>
      <svg width={w} height={h} style={{display: 'block'}}>
        <g transform={`translate(${cx ?? w / 2} ${cy ?? h / 2}) scale(${scale}) translate(${-TARGET.x} ${-TARGET.y})`}>
          <CityMap reveal={reveal} flash={flash} />
        </g>
      </svg>
    </div>
  </div>
);
