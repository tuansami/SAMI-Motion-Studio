import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '@engine/theme';
import {keys, rnd} from '@engine/lib/anim';
import {useFormat} from '@engine/core/format';

// Shared look for "Paper Search Ad": kraft paper, torn-edge cut-outs, masking tape, stop-motion timing.
// Stop-motion: collage pieces read SNAPPED time (every 2nd base frame = "on twos") and boil slightly per pose.
// Fonts from project.json → brand.fonts (display / body / script).

export const dserif = () => F.display || '"DM Serif Display", serif';
export const sans = () => F.body || '"DM Sans", sans-serif';
export const hand = () => F.script || 'Caveat, cursive';

/** time on twos */
export const snap = (t: number) => Math.floor(t / 2) * 2;

/** jagged clip-path polygon (px) for a w×h piece; edges = which sides are torn ("tlbr") */
export const torn = (w: number, h: number, seed: number, amp = 7, step = 15, edges = 'tlbr') => {
  const pts: [number, number][] = [];
  let i = 0;
  const j = () => rnd(seed * 97 + i++ * 7.31) * amp;
  const e = (k: string) => edges.includes(k);
  for (let x = 0; x < w; x += step) pts.push([x, e('t') ? j() : 0]);
  for (let y = 0; y < h; y += step) pts.push([w - (e('r') ? j() : 0), y]);
  for (let x = w; x > 0; x -= step) pts.push([x, h - (e('b') ? j() : 0)]);
  for (let y = h; y > 0; y -= step) pts.push([e('l') ? j() : 0, y]);
  return `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
};

/** torn circle-ish polygon */
export const tornCircle = (d: number, seed: number, amp = 8, n = 64) => {
  const r = d / 2;
  const pts = Array.from({length: n}, (_, k) => {
    const a = (k / n) * Math.PI * 2;
    const rr = r - rnd(seed * 31 + k * 3.7) * amp;
    return `${(r + Math.cos(a) * rr).toFixed(1)}px ${(r + Math.sin(a) * rr).toFixed(1)}px`;
  });
  return `polygon(${pts.join(',')})`;
};

/** kraft (or dark) paper background with mottling + fibre specks (static) */
export const Kraft: React.FC<{id: string; dark?: boolean}> = ({id, dark}) => {
  const f = useFormat();
  return (
    <AbsoluteFill style={{background: dark ? C.ink : C.kraft}}>
      <svg width={f.w} height={f.h} viewBox={`0 0 ${f.w} ${f.h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id={id + 'm'} x="0" y="0" width="1" height="1">
            <feTurbulence type="fractalNoise" baseFrequency="0.005" numOctaves={3} seed={5} />
            <feColorMatrix type="matrix" values={dark ? '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0.05  1.3 0 0 0 -0.5' : '0 0 0 0 0.36  0 0 0 0 0.24  0 0 0 0 0.12  1.4 0 0 0 -0.52'} />
          </filter>
          <filter id={id + 'd'} x="0" y="0" width="1" height="1">
            <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={1} seed={8} />
            <feColorMatrix type="matrix" values="0 0 0 0 0.2  0 0 0 0 0.13  0 0 0 0 0.07  3 0 0 0 -1.95" />
          </filter>
          <filter id={id + 'l'} x="0" y="0" width="1" height="1">
            <feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves={1} seed={19} />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.97  0 0 0 0 0.9  0 3 0 0 -2.05" />
          </filter>
          <filter id={id + 't'} x="0" y="0" width="1" height="1">
            <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves={2} seed={3} result="n" />
            <feDiffuseLighting in="n" lightingColor="white" surfaceScale={1.3}>
              <feDistantLight azimuth={45} elevation={60} />
            </feDiffuseLighting>
          </filter>
        </defs>
        <rect width={f.w} height={f.h} filter={`url(#${id}m)`} opacity={dark ? 0.5 : 0.4} />
        <rect width={f.w} height={f.h} filter={`url(#${id}t)`} opacity={0.18} style={{mixBlendMode: 'multiply'}} />
        <rect width={f.w} height={f.h} filter={`url(#${id}d)`} opacity={dark ? 0.25 : 0.55} />
        <rect width={f.w} height={f.h} filter={`url(#${id}l)`} opacity={dark ? 0.12 : 0.35} />
      </svg>
    </AbsoluteFill>
  );
};

/** landing pose for a piece at snapped time: hidden before `at`, slaps down (scale 1.2 → 1) on twos, then boils */
export const land = (t: number, at: number, seed: number, rot = 0, boil = 0.45) => {
  const ts = snap(t);
  const k = ts - at;
  if (k < 0) return null;
  const s = keys(k, [[0, 1.22], [4, 0.97], [6, 1]]);
  const jr = (rnd(seed * 13.7 + ts * 0.5) - 0.5) * boil * 2;
  const jx = (rnd(seed * 5.1 + ts * 0.5) - 0.5) * 2.4;
  const jy = (rnd(seed * 7.9 + ts * 0.5) - 0.5) * 2.4;
  return {transform: `translate(${jx}px, ${jy}px) rotate(${rot + jr + (k < 4 ? (k < 2 ? 4 : 1.5) * (seed % 2 ? 1 : -1) : 0)}deg) scale(${s})`};
};

const SHADOW = 'drop-shadow(0 6px 5px rgba(40,25,10,0.28)) drop-shadow(0 18px 22px rgba(40,25,10,0.18))';

/** a torn paper cut-out positioned by its top-left (x,y) with size w×h */
export const Piece: React.FC<{
  x: number; y: number; w: number; h: number; t: number; at: number; seed: number; rot?: number; bg?: string; rim?: boolean;
  edges?: string; amp?: number; shape?: 'rect' | 'circle'; shadow?: boolean; style?: React.CSSProperties; children?: React.ReactNode;
}> = ({x, y, w, h, t, at, seed, rot = 0, bg, rim, edges = 'tlbr', amp = 7, shape = 'rect', shadow = true, style, children}) => {
  const pose = land(t, at, seed, rot);
  if (!pose) return null;
  const clip = (ww: number, hh: number, sd: number) => (shape === 'circle' ? tornCircle(ww, sd, amp) : torn(ww, hh, sd, amp, 15, edges));
  const R = 6;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, filter: shadow ? SHADOW : undefined, ...pose, ...style}}>
      {rim ? <div style={{position: 'absolute', left: -R, top: -R, width: w + R * 2, height: h + R * 2, background: C.paper, opacity: 0.9, clipPath: clip(w + R * 2, h + R * 2, seed + 50)}} /> : null}
      <div style={{position: 'absolute', inset: 0, background: bg ?? C.paper, clipPath: clip(w, h, seed), overflow: 'hidden'}}>{children}</div>
    </div>
  );
};

/** translucent masking tape strip centred at (x,y) */
export const Tape: React.FC<{x: number; y: number; t: number; at: number; seed: number; w?: number; h?: number; rot?: number}> = ({x, y, t, at, seed, w = 170, h = 48, rot = -8}) => {
  const pose = land(t, at, seed, rot, 0.3);
  if (!pose) return null;
  const pts: string[] = [];
  const n = 6;
  for (let k = 0; k <= n; k++) pts.push(`${(rnd(seed + k) * 9).toFixed(1)}px ${((k / n) * h).toFixed(1)}px`);
  for (let k = n; k >= 0; k--) pts.push(`${(w - rnd(seed * 3 + k) * 9).toFixed(1)}px ${((k / n) * h).toFixed(1)}px`);
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, ...pose}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: `polygon(${pts.join(',')})`,
          background: 'linear-gradient(180deg, rgba(250,246,232,0.78), rgba(236,228,205,0.66))',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)',
        }}
      />
      <div style={{position: 'absolute', inset: 0, clipPath: `polygon(${pts.join(',')})`, backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0 3px, transparent 3px 9px)'}} />
    </div>
  );
};

/** split "*…*" markup; "/" = line break */
export const marked = (s: string) => {
  let on = false;
  return (s || '').split(' ').filter(Boolean).map((w) => {
    let x = w;
    if (x.startsWith('*')) { on = true; x = x.slice(1); }
    const close = x.endsWith('*');
    if (close) x = x.slice(0, -1);
    const r = {w: x, hl: on && x !== '/', br: x === '/'};
    if (close) on = false;
    return r;
  });
};

/** ransom-note headline: every word its own torn slip, styles alternate, *marked* words go red */
export const Slips: React.FC<{text: string; t: number; at: number; step?: number; size: number; seed: number; align?: 'center' | 'left'; maxWidth?: number; gap?: number}> = ({text, t, at, step = 6, size, seed, align = 'center', maxWidth, gap}) => {
  const words = marked(text);
  let wi = 0;
  const STY = [
    {bg: C.paper, color: C.ink, font: dserif(), weight: 400, up: false, k: 1},
    {bg: C.ink, color: C.paper, font: sans(), weight: 700, up: true, k: 0.78},
    {bg: C.paper, color: C.ink, font: hand(), weight: 700, up: false, k: 1.15},
  ];
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start', alignItems: 'center', gap: gap ?? size * 0.16, maxWidth}}>
      {words.map((w, i) => {
        if (w.br) return <div key={i} style={{flexBasis: '100%', height: 0}} />;
        const idx = wi++;
        const st = w.hl ? {bg: C.accent, color: C.paper, font: dserif(), weight: 400, up: false, k: 1.05} : STY[idx % 3];
        const pose = land(t, at + idx * step, seed + idx, (rnd(seed + idx * 3) - 0.5) * 6);
        const fs = size * st.k;
        return (
          <div key={i} style={{position: 'relative', visibility: pose ? 'visible' : 'hidden', filter: 'drop-shadow(0 4px 3px rgba(40,25,10,0.3))', ...(pose || {})}}>
            <div
              style={{
                background: st.bg,
                color: st.color,
                fontFamily: st.font,
                fontWeight: st.weight,
                fontSize: fs,
                lineHeight: 1,
                textTransform: st.up ? 'uppercase' : 'none',
                letterSpacing: st.up ? '0.02em' : '-0.01em',
                padding: `${fs * 0.16}px ${fs * 0.22}px ${fs * 0.2}px`,
                clipPath: torn(Math.ceil(w.w.length * fs * 0.62 + fs * 0.6), Math.ceil(fs * 1.4), seed + idx * 11, Math.max(3, fs * 0.06), 12),
                whiteSpace: 'nowrap',
              }}
            >
              {w.w}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** five-point star polygon (CSS clip-path) */
export const STAR = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
