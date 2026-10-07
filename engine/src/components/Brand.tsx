import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {media} from '../core/media';
import {C, F} from '../theme';
import {tw} from '../lib/anim';
import {useF} from '../lib/warp';

// Official SAMI mark + wordmark paths (from sami-agency.de logo-white.svg). Mark bbox x -356..644, y -444..564.
const MARK_OUTER =
  'm-68-444c-159.06 0-288 128.94-288 288s128.94 288 288 288h424c79.529 0 144 64.471 144 144s-64.471 144-144 144h-250l-75 144h325c159.06 0 288-128.94 288-288s-128.94-288-288-288h-424c-79.529 0-144-64.471-144-144s64.471-144 144-144h250l75-144z';
// the six diagonal stripes (3 top-right, 3 bottom-left), animated individually
const STRIPES = [
  'm322-444-188 360h64l188-360z',
  'm451-444-188 360h64l188-360z',
  'm580-444-188 360h64l188-360z',
  'm-168 204-188 360h64l188-360z',
  'm-39 204-188 360h64l188-360z',
  'm90 204-188 360h64l188-360z',
];
const SAMI_WORD =
  'm1010.2-193.78q-29.702 0-56.928-7.779-27.226-8.1326-43.845-20.862l19.448-43.138q15.912 11.315 37.481 18.74 21.923 7.0718 44.199 7.0718 16.972 0 27.226-3.1823 10.608-3.5359 15.558-9.547 4.9503-6.011 4.9503-13.79 0-9.9006-7.779-15.558-7.779-6.011-20.508-9.547-12.729-3.8895-28.287-7.0718-15.204-3.5359-30.762-8.4862-15.204-4.9503-27.934-12.729-12.729-7.779-20.862-20.508-7.779-12.729-7.779-32.53 0-21.215 11.315-38.541 11.669-17.68 34.652-27.934 23.337-10.608 58.342-10.608 23.337 0 45.967 5.6574 22.63 5.3039 39.956 16.265l-17.68 43.492q-17.326-9.9006-34.652-14.497-17.326-4.9503-33.945-4.9503-16.619 0-27.226 3.8895-10.608 3.8895-15.204 10.254-4.5967 6.011-4.5967 14.144 0 9.547 7.779 15.558 7.779 5.6575 20.508 9.1934 12.729 3.5359 27.934 7.0718 15.558 3.5359 30.762 8.1326 15.558 4.5967 28.287 12.376 12.729 7.779 20.508 20.508 8.1326 12.729 8.1326 32.177 0 20.862-11.668 38.188t-35.006 27.934q-22.984 10.608-58.343 10.608zm111.74-4.2431 110.32-247.51h56.574l110.67 247.51h-60.11l-90.519-218.52h22.63l-90.873 218.52zm55.16-53.039 15.204-43.492h127.29l15.558 43.492zm248.22 53.039v-247.51h47.381l105.37 174.67h-25.105l103.6-174.67h47.028l0.7072 247.51h-53.746l-0.3536-165.13h9.9005l-82.74 138.96h-25.812l-84.508-138.96h12.022v165.13zm337.68 0v-247.51h57.282v247.51z';

/**
 * The SAMI "S" mark. `p` 0..1 builds it: outer S wipes in, then stripes slide in one by one.
 * Size = rendered height in px.
 */
export const SamiMark: React.FC<{size?: number; p?: number; id?: string; mono?: string; style?: React.CSSProperties}> = ({size = 200, p = 1, id = 'sg', mono, style}) => {
  const w = (size * 1000) / 1008;
  const sp = (k: number) => Math.max(0, Math.min(1, (p - 0.35 - k * 0.07) / 0.28));
  const outerP = Math.min(1, p / 0.45);
  const fill = mono ?? `url(#${id})`;
  return (
    <svg width={w} height={size} viewBox="-356 -444 1000 1008" style={{display: 'block', overflow: 'visible', ...style}}>
      <defs>
        <linearGradient id={id} x1="-356" y1="564" x2="644" y2="-444" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={C.mint} />
          <stop offset="0.3" stopColor={C.mint} />
          <stop offset="0.55" stopColor={C.purple} />
          <stop offset="0.8" stopColor={C.mint} />
          <stop offset="1" stopColor={C.mint} />
        </linearGradient>
        <clipPath id={id + 'c'}>
          <rect x={-356} y={-444} width={1000 * outerP} height={1008} />
        </clipPath>
      </defs>
      <path d={MARK_OUTER} fill={fill} clipPath={`url(#${id}c)`} />
      {STRIPES.map((d, k) => {
        const q = sp(k);
        const dx = (k < 3 ? 1 : -1) * (1 - q) * 160;
        const dy = (k < 3 ? -1 : 1) * (1 - q) * 300;
        return <path key={k} d={d} fill={fill} opacity={q} transform={`translate(${dx} ${dy})`} />;
      })}
    </svg>
  );
};

/** "SAMI" wordmark (white). Height px. */
export const SamiWord: React.FC<{height?: number; color?: string}> = ({height = 80, color = '#fff'}) => {
  // word bbox x 911.9..1822.8, y -325.6..-69.6 (after translate 2.5,124.2)
  const w = (height * 911) / 256;
  return (
    <svg width={w} height={height} viewBox="911.9 -325.6 911 256" style={{display: 'block'}}>
      <g transform="translate(2.5275 124.24)">
        <path d={SAMI_WORD} fill={color} />
      </g>
    </svg>
  );
};

/** Full lockup: mark + SAMI + "LEADING DIGITAL TECHNOLOGY". p drives build. */
export const SamiLockup: React.FC<{height?: number; p?: number; id?: string}> = ({height = 220, p = 1, id = 'lk'}) => {
  const wp = Math.max(0, Math.min(1, (p - 0.45) / 0.4));
  const tp = Math.max(0, Math.min(1, (p - 0.65) / 0.35));
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: height * 0.2}}>
      <SamiMark size={height} p={p} id={id} />
      <div style={{display: 'flex', flexDirection: 'column', gap: height * 0.1}}>
        <div style={{overflow: 'hidden'}}>
          <div style={{transform: `translateY(${(1 - wp) * 110}%)`, opacity: wp}}>
            <SamiWord height={height * 0.36} />
          </div>
        </div>
        <div style={{fontFamily: F.ui, fontWeight: 600, fontSize: height * 0.095, letterSpacing: '0.32em', color: '#fff', opacity: tp, transform: `translateX(${(1 - tp) * -20}px)`, whiteSpace: 'nowrap'}}>
          LEADING DIGITAL
          <br />
          TECHNOLOGY
        </div>
      </div>
    </div>
  );
};

/** Deep navy background with two slow drifting brand glows. Never flat, never loud. */
export const NavyBG: React.FC<{glow?: number; mintPos?: [number, number]; purplePos?: [number, number]; grid?: boolean}> = ({glow = 1, mintPos, purplePos, grid = true}) => {
  const f = useF();
  const mx = mintPos?.[0] ?? 20 + Math.sin(f / 90) * 6;
  const my = mintPos?.[1] ?? 80 + Math.cos(f / 110) * 6;
  const px = purplePos?.[0] ?? 82 + Math.cos(f / 100) * 6;
  const py = purplePos?.[1] ?? 18 + Math.sin(f / 120) * 6;
  return (
    <AbsoluteFill style={{background: C.navyDeep}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 70% at ${mx}% ${my}%, rgba(8,221,164,${0.16 * glow}) 0%, rgba(8,221,164,0) 60%), radial-gradient(55% 65% at ${px}% ${py}%, rgba(118,103,254,${0.26 * glow}) 0%, rgba(118,103,254,0) 62%), ${C.navy}`,
        }}
      />
      {grid && (
        <AbsoluteFill
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1.2px, transparent 1.3px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(70% 70% at 50% 50%, #000 30%, transparent 85%)',
            WebkitMaskImage: 'radial-gradient(70% 70% at 50% 50%, #000 30%, transparent 85%)',
          }}
        />
      )}
    </AbsoluteFill>
  );
};

/** Film grain + vignette. Sits on top of EVERYTHING. */
export const FilmFinish: React.FC<{grain?: number; vignette?: number}> = ({grain = 0.05, vignette = 0.42}) => {
  const f = useCurrentFrame();
  const k = Math.floor(f / 2) % 6;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: `radial-gradient(120% 95% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${vignette}) 100%)`}} />
      <Img src={staticFile(`_engine/grain${k}.png`)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: grain, mixBlendMode: 'overlay', imageRendering: 'pixelated'}} />
    </AbsoluteFill>
  );
};

/** Card on navy with hairline border. */
export const Card: React.FC<{style?: React.CSSProperties; children?: React.ReactNode}> = ({style, children}) => (
  <div style={{background: 'rgba(22,16,58,0.72)', border: `1px solid ${C.line}`, borderRadius: 28, boxShadow: '0 40px 90px rgba(0,0,0,0.35)', backdropFilter: 'blur(10px)', ...style}}>{children}</div>
);

/** Photo with mask-wipe reveal (p 0..1) and slow Ken Burns zoom. */
export const Photo: React.FC<{src: string; p?: number; zoom?: number; style?: React.CSSProperties; dir?: 'up' | 'left' | 'right'; radius?: number; pos?: string}> = ({src, p = 1, zoom = 0, style, dir = 'up', radius = 0, pos = 'center'}) => {
  const clip =
    dir === 'up' ? `inset(${(1 - p) * 100}% 0 0 0 round ${radius}px)` : dir === 'left' ? `inset(0 ${(1 - p) * 100}% 0 0 round ${radius}px)` : `inset(0 0 0 ${(1 - p) * 100}% round ${radius}px)`;
  return (
    <div style={{overflow: 'hidden', clipPath: clip, borderRadius: radius, ...style}}>
      <Img src={media(src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, transform: `scale(${1.12 - p * 0.08 + zoom})`}} />
    </div>
  );
};
