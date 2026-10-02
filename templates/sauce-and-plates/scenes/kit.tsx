import React from 'react';
import {Img, staticFile} from 'remotion';
import {useT} from '@engine/lib/useT';
import {tw, keys} from '@engine/lib/anim';
import {useFormat} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';

// Shared kit for "Sauce & Plates". Palette from project.json → brand.colors (cream, pink, green, ink).
export const FR = '"Fredoka", "Nunito", sans-serif';
export const UI = 'Inter, sans-serif';

/** Overshoot pop on the one easing: 0 → 1.06 → 1 (no springs). */
export const pop = (t: number, s: number, d = 8) => keys(t, [[s, 0], [s + d, 1.06], [s + d + 7, 1]]);

/** Playful kinetic headline: words pop in on a stagger. *word* = highlighted (pink fill + ink outline). "/" = line break. */
export const PopWords: React.FC<{text: string; start: number; stagger?: number; size: number; color?: string; hl?: string; stroke?: string; out?: number; align?: 'left' | 'center'; lh?: number}> = ({text, start, stagger = 4, size, color, hl, stroke, out, align = 'left', lh = 1.02}) => {
  const t = useT();
  let on = false;
  const words = String(text || '').split(' ').filter(Boolean).map((w) => {
    let x = w;
    if (x.startsWith('*')) { on = true; x = x.slice(1); }
    const close = x.endsWith('*');
    if (close) x = x.slice(0, -1);
    const h = on && x !== '/';
    if (close) on = false;
    return {x, h};
  });
  const q = out !== undefined ? tw(t, out, 10) : 0;
  let n = 0;
  return (
    <div style={{fontFamily: FR, fontWeight: 700, fontSize: size, lineHeight: lh, color: color ?? C.ink, textAlign: align, letterSpacing: '-0.01em'}}>
      {words.map((w, i) => {
        if (w.x === '/') return <br key={i} />;
        const p = pop(t, start + n++ * stagger);
        const s = Math.max(0, p * (1 - q));
        return (
          <span key={i} style={{display: 'inline-block', marginRight: '0.24em', transform: `translateY(${(1 - Math.min(1, p)) * size * 0.4}px) scale(${s})`, opacity: Math.min(1, p * 3) * (1 - q), color: w.h ? hl ?? C.pink : undefined, WebkitTextStroke: w.h ? `${Math.max(3, size * 0.035)}px ${stroke ?? C.ink}` : undefined, paintOrder: 'stroke fill'}}>
            {w.x}
          </span>
        );
      })}
    </div>
  );
};

/**
 * Flat plate in fake 3D. `tilt` 1 = seen from above (circle), small = edge-on (ellipse squashed).
 * The photo spins inside a circular mask; a rim highlight travels round the rim (angle `hl`).
 */
export const Plate: React.FC<{size: number; tilt?: number; spin?: number; hl?: number; rim?: string; style?: React.CSSProperties}> = ({size: S, tilt = 1, spin = 0, hl = -40, rim, style}) => {
  const img = COPY.S01_image;
  const th = Math.max(0.12, Math.min(1, tilt));
  const thick = S * (0.012 + 0.05 * (1 - th));
  const bw = Math.max(4, S * 0.011);
  const r = S * 0.455;
  const a0 = ((hl - 32) * Math.PI) / 180, a1 = ((hl + 32) * Math.PI) / 180;
  const arc = `M ${S / 2 + r * Math.cos(a0)} ${S / 2 + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${S / 2 + r * Math.cos(a1)} ${S / 2 + r * Math.sin(a1)}`;
  const rimC = rim ?? C.green;
  return (
    <div style={{position: 'relative', width: S, height: S * th + thick, ...style}}>
      {/* soft floor shadow */}
      <div style={{position: 'absolute', left: S * 0.08, top: S * th * 0.55 + thick + S * 0.05, width: S * 0.84, height: S * th * 0.5, borderRadius: '50%', background: 'rgba(45,42,50,0.16)', filter: `blur(${S * 0.03}px)`}} />
      {/* plate edge (thickness) */}
      <div style={{position: 'absolute', left: 0, top: thick, width: S, height: S * th, borderRadius: '50%', background: rimC, filter: 'brightness(0.72)', border: `${bw}px solid ${C.ink}`, boxSizing: 'border-box'}} />
      {/* top face */}
      <div style={{position: 'absolute', left: 0, top: 0, width: S, height: S * th, borderRadius: '50%', overflow: 'hidden', background: rimC, border: `${bw}px solid ${C.ink}`, boxSizing: 'border-box'}}>
        <div style={{position: 'absolute', left: -bw, top: -bw, width: S, height: S, transform: `scaleY(${th})`, transformOrigin: '0 0'}}>
          <div style={{position: 'absolute', inset: S * 0.1, borderRadius: '50%', background: C.cream, border: `${bw * 0.8}px solid ${C.ink}`}} />
          <div style={{position: 'absolute', inset: S * 0.15, borderRadius: '50%', overflow: 'hidden', background: C.cream}}>
            {img && <Img src={staticFile(img)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `rotate(${spin}deg) scale(1.15)`}} />}
            <div style={{position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: `inset 0 ${S * 0.02}px ${S * 0.05}px rgba(0,0,0,0.25)`}} />
          </div>
          <svg width={S} height={S} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <path d={arc} fill="none" stroke="#fff" strokeWidth={S * 0.03} strokeLinecap="round" opacity={0.85} />
          </svg>
        </div>
      </div>
    </div>
  );
};

/** Gooey filter (blur + alpha threshold) — blobs that touch melt together. */
export const Goo: React.FC<{id: string; blur?: number}> = ({id, blur = 16}) => (
  <svg width="0" height="0" style={{position: 'absolute'}}>
    <defs>
      <filter id={id} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="b" />
        <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" />
      </filter>
    </defs>
  </svg>
);

/** Layout of the sample website (browser frame) per ratio — shared by S02–S04 so the cut is seamless. */
export const useSite = () => {
  const f = useFormat();
  const bw = f.portrait ? 980 : 1500;
  const bh = f.portrait ? 1220 : 860;
  const left = (f.w - bw) / 2;
  const top = f.portrait ? 300 : 110;
  const ch = bh - 56;
  const nav = 90;
  const spot = f.portrait ? {x: bw / 2, y: nav + 300, d: 480} : {x: bw * 0.72, y: nav + (ch - nav) / 2, d: 520};
  return {bw, bh, left, top, ch, nav, spot, stage: {x: left + 5 + spot.x, y: top + 5 + 56 + spot.y}, portrait: f.portrait};
};

/** Site content inside the browser: nav + hero. `p` 0..1 reveals hero text; `spot` shows a dashed placeholder circle. */
export const SiteHero: React.FC<{p?: number; spot?: number; navP?: number}> = ({p = 1, spot = 0, navP = 1}) => {
  const s = useSite();
  const k = (d: number) => Math.max(0, Math.min(1, (p - d) / 0.35));
  const item = (d: number): React.CSSProperties => ({opacity: k(d), transform: `translateY(${(1 - k(d)) * 30}px)`});
  const navs = [COPY.S03_nav1, COPY.S03_nav2, COPY.S03_nav3];
  return (
    <div style={{position: 'absolute', inset: 0, background: C.cream, overflow: 'hidden'}}>
      {/* nav */}
      <div style={{height: s.nav, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: s.portrait ? '0 40px' : '0 64px', borderBottom: `3px solid ${C.ink}`, opacity: navP}}>
        <div style={{fontFamily: FR, fontWeight: 700, fontSize: 40, color: C.ink}}>{COPY.S03_brand}</div>
        {s.portrait ? (
          <div style={{display: 'flex', flexDirection: 'column', gap: 7}}>
            {[0, 1, 2].map((i) => <div key={i} style={{width: 40, height: 5, borderRadius: 3, background: C.ink}} />)}
          </div>
        ) : (
          <div style={{display: 'flex', alignItems: 'center', gap: 40, fontFamily: UI, fontWeight: 600, fontSize: 22, color: C.ink}}>
            {navs.map((n, i) => <span key={i}>{n}</span>)}
            <span style={{background: C.ink, color: C.cream, borderRadius: 999, padding: '10px 22px'}}>{COPY.S03_cta}</span>
          </div>
        )}
      </div>
      {/* sauce stripe decoration */}
      <div style={{position: 'absolute', left: s.spot.x - s.spot.d * 0.75, top: s.spot.y - s.spot.d * 0.62, width: s.spot.d * 1.5, height: s.spot.d * 1.24, borderRadius: '46% 54% 50% 50% / 52% 44% 56% 48%', background: C.green, opacity: 0.9 * Math.min(1, p * 2 + spot)}} />
      {spot > 0 && <div style={{position: 'absolute', left: s.spot.x - s.spot.d / 2, top: s.spot.y - s.spot.d / 2, width: s.spot.d, height: s.spot.d, borderRadius: '50%', border: `5px dashed ${C.ink}`, opacity: spot * 0.5, boxSizing: 'border-box'}} />}
      {/* hero text */}
      <div style={{position: 'absolute', left: s.portrait ? 50 : 90, right: s.portrait ? 50 : undefined, top: s.portrait ? s.spot.y + s.spot.d / 2 + 70 : undefined, bottom: s.portrait ? undefined : undefined, width: s.portrait ? undefined : 640, height: s.portrait ? undefined : s.ch, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: s.portrait ? 'center' : 'flex-start', textAlign: s.portrait ? 'center' : 'left', gap: 22}}>
        <div style={{...item(0), fontFamily: UI, fontWeight: 700, fontSize: 22, letterSpacing: '0.2em', color: C.ink, opacity: k(0) * 0.6}}>{COPY.S03_eyebrow}</div>
        <div style={{...item(0.1), fontFamily: FR, fontWeight: 700, fontSize: s.portrait ? 120 : 124, lineHeight: 0.95, color: C.ink}}>{COPY.S03_brand}</div>
        <div style={{...item(0.2), fontFamily: UI, fontWeight: 500, fontSize: s.portrait ? 34 : 32, color: C.ink, opacity: k(0.2) * 0.8}}>{COPY.S03_tagline}</div>
        <div style={{...item(0.3), marginTop: 12, alignSelf: s.portrait ? 'center' : 'flex-start', fontFamily: FR, fontWeight: 700, fontSize: 34, color: C.ink, background: C.pink, border: `4px solid ${C.ink}`, borderRadius: 999, padding: '16px 40px', boxShadow: `0 6px 0 ${C.ink}`}}>{COPY.S03_cta}</div>
      </div>
    </div>
  );
};
