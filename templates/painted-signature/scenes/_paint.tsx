import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '@engine/theme';
import {clamp01, tw} from '@engine/lib/anim';
import {useFormat} from '@engine/core/format';

// Shared look for "Painted Signature": warm paper, brush strokes drawn on with stroke-dash,
// rough edges via feTurbulence + feDisplacementMap, dry-brush streaks via a stretched noise mask.
// Fonts come from project.json → brand.fonts (display / script) so they can be swapped in one place.

export const serif = () => F.display || 'Fraunces, serif';
export const script = () => F.script || 'Caveat, cursive';

/** Warm paper: tonal blotches + embossed tooth + fibre specks (static, no per-frame change). */
export const Paper: React.FC<{id: string}> = ({id}) => {
  const f = useFormat();
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <svg width={f.w} height={f.h} viewBox={`0 0 ${f.w} ${f.h}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id={id + 'pb'} x="0" y="0" width="1" height="1">
            <feTurbulence type="fractalNoise" baseFrequency="0.0032" numOctaves={3} seed={7} />
            <feColorMatrix type="matrix" values="0 0 0 0 0.48  0 0 0 0 0.33  0 0 0 0 0.2  1.25 0 0 0 -0.48" />
          </filter>
          <filter id={id + 'pt'} x="0" y="0" width="1" height="1">
            <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves={2} seed={3} result="n" />
            <feDiffuseLighting in="n" lightingColor="white" surfaceScale={1.5}>
              <feDistantLight azimuth={50} elevation={62} />
            </feDiffuseLighting>
          </filter>
          <filter id={id + 'ps'} x="0" y="0" width="1" height="1">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={1} seed={11} />
            <feColorMatrix type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0 0.12  2.8 0 0 0 -1.78" />
          </filter>
        </defs>
        <rect width={f.w} height={f.h} filter={`url(#${id}pb)`} opacity={0.34} />
        <rect width={f.w} height={f.h} filter={`url(#${id}pt)`} opacity={0.2} style={{mixBlendMode: 'multiply'}} />
        <rect width={f.w} height={f.h} filter={`url(#${id}ps)`} opacity={0.5} />
      </svg>
    </AbsoluteFill>
  );
};

/**
 * Brush filters for one <svg>. Use inside <svg>: <BrushDefs id="s2" w={f.w} h={f.h} />, then
 * filter ids: `${id}r` rough edge · `${id}h` dry brush (horizontal streaks) · `${id}v` dry brush (vertical) · `${id}w` light wobble (text, pencil).
 */
export const BrushDefs: React.FC<{id: string; w: number; h: number; rough?: number; x?: number; y?: number}> = ({id, w, h, rough = 9, x = -200, y = -200}) => {
  const reg = {filterUnits: 'userSpaceOnUse' as const, x, y, width: w + 400, height: h + 400};
  const dry = (dir: 'h' | 'v') => (
    <filter id={id + dir} {...reg}>
      <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={3} seed={4} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={rough * 1.5} xChannelSelector="R" yChannelSelector="G" result="d" />
      <feTurbulence type="fractalNoise" baseFrequency={dir === 'h' ? '0.0035 0.21' : '0.21 0.0035'} numOctaves={2} seed={9} result="s0" />
      <feColorMatrix in="s0" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  4.2 0 0 0 -2.55" result="s" />
      <feComposite in="d" in2="s" operator="out" />
    </filter>
  );
  return (
    <defs>
      <filter id={id + 'r'} {...reg}>
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={3} seed={4} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={rough} xChannelSelector="R" yChannelSelector="G" />
      </filter>
      {dry('h')}
      <filter id={id + 'g'} {...reg}>
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={3} seed={4} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={rough * 1.3} xChannelSelector="R" yChannelSelector="G" result="d" />
        <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves={2} seed={15} result="s0" />
        <feColorMatrix in="s0" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  4.5 0 0 0 -2.9" result="s" />
        <feComposite in="d" in2="s" operator="out" />
      </filter>
      {dry('v')}
      <filter id={id + 'w'} {...reg}>
        <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves={2} seed={12} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={3.5} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  );
};

/** One brush stroke drawn on along its path. p 0..1 (already eased). */
export const Stroke: React.FC<{d: string; w: number; color: string; p: number; filter?: string; opacity?: number; cap?: 'round' | 'butt' | 'square'}> = ({d, w, color, p, filter, opacity = 1, cap = 'round'}) => {
  if (p <= 0.002) return null;
  return (
    <path
      d={d}
      pathLength={1}
      fill="none"
      stroke={color}
      strokeWidth={w}
      strokeLinecap={cap}
      strokeLinejoin="round"
      strokeDasharray="1 2"
      strokeDashoffset={1 - clamp01(p)}
      opacity={opacity}
      filter={filter ? `url(#${filter})` : undefined}
    />
  );
};

/** Fat brush: main stroke + two thinner bristle passes that lag a little → uneven, loaded-brush edges. */
export const Brush: React.FC<{d: string; w: number; color: string; p: number; fid: string; dry?: 'h' | 'v' | 'g'; opacity?: number}> = ({d, w, color, p, fid, dry = 'h', opacity = 1}) => {
  const o = dry === 'v' ? [w * 0.2, 0] : [0, w * 0.2];
  return (
    <g opacity={opacity}>
      <Stroke d={d} w={w} color={color} p={p} filter={fid + dry} />
      <g transform={`translate(${o[0]} ${o[1]})`}>
        <Stroke d={d} w={w * 0.55} color={color} p={p * 0.97} filter={fid + 'r'} opacity={0.55} />
      </g>
      <g transform={`translate(${-o[0] * 0.9} ${-o[1] * 0.9})`}>
        <Stroke d={d} w={w * 0.45} color={color} p={p * 0.94} filter={fid + 'r'} opacity={0.45} />
      </g>
    </g>
  );
};

/** Arc path (degrees, 0 = right, clockwise) for enso-like circles. */
export const arcD = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const pt = (a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / 90));
  let d = `M ${pt(a0).join(' ')}`;
  for (let i = 1; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    d += ` A ${r} ${r} 0 0 ${a1 > a0 ? 1 : 0} ${pt(a).join(' ')}`;
  }
  return d;
};

/** Small section tag "01 · Logo" with a short brush dash, top-left inside the safe area. */
export const SectionTag: React.FC<{text: string; t: number; x: number; y: number; size?: number}> = ({text, t, x, y, size = 30}) => {
  const p = tw(t, 2, 16);
  const dash = tw(t, 6, 14);
  return (
    <div style={{position: 'absolute', left: x, top: y, display: 'flex', alignItems: 'center', gap: size * 0.6, opacity: p, transform: `translateX(${(1 - p) * -24}px)`}}>
      <div style={{width: size * 2.2 * dash, height: size * 0.22, borderRadius: 99, background: C.terracotta}} />
      <div style={{fontFamily: serif(), fontWeight: 700, fontSize: size, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.ink}}>{text}</div>
    </div>
  );
};

/** Handwritten note (script font) revealed left→right like it is being written. */
export const Hand: React.FC<{text: string; p: number; size: number; color?: string; style?: React.CSSProperties; rotate?: number}> = ({text, p, size, color, style, rotate = -3}) => (
  <div
    style={{
      fontFamily: script(),
      fontWeight: 700,
      fontSize: size,
      lineHeight: 1.05,
      color: color ?? C.ink,
      whiteSpace: 'nowrap',
      padding: '0 0.35em',
      margin: '0 -0.35em',
      clipPath: `inset(-20% ${(1 - clamp01(p)) * 100}% -20% 0%)`,
      transform: `rotate(${rotate}deg)`,
      ...style,
    }}
  >
    {text}
  </div>
);

/** Split "*…*" markup into words with a script flag; "/" = line break. */
export const splitMarked = (s: string) => {
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
