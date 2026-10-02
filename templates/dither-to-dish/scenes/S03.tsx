import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {useT} from '@engine/lib/useT';
import {tw} from '@engine/lib/anim';
import {useFormat} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {MapView, DitherFilter, Sprite, PIN, PIXEL, SANS, beatIdx} from './kit';

// S03 · The pin drops in pixel steps and lands on beat 1. On beat 2 a card opens; the photo resolves from coarse 1-bit
// dither 48 → 24 → 12 → 6 → 3 px (one step per beat), then a focal iris opens it into full colour (beat 6).
const CELLS: [number, number][] = [[30, 48], [45, 24], [60, 12], [75, 6], [90, 3]];

export const S03: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const b = beatIdx(t);
  const L = f.portrait
    ? {pinX: 540, pinY: 520, card: {x: 72, y: 560, w: 936, h: 560}, info: 170}
    : {pinX: 400, pinY: 640, card: {x: 680, y: 150, w: 1120, h: 630}, info: 160};
  const px = f.portrait ? 12 : 14;
  // pin: falls in 5 hard steps, lands at t=15 with a 3-frame squash
  const fall = Math.min(1, Math.floor(Math.max(0, t + 1) / 3) / 5);
  const pinOff = (1 - fall) * -900;
  const squash = t >= 15 && t < 19 ? 0.8 : 1;
  const pinW = 11 * px, pinH = 12 * px;
  // card opens in 3 steps on beat 2
  const open = t < 26 ? 0 : t < 28 ? 0.33 : t < 30 ? 0.66 : 1;
  const cell = CELLS.reduce((c, [s, v]) => (t >= s ? v : c), 48);
  const iris = tw(t, 90, 16);
  const blink = t >= 105 ? 1 : Math.floor(t / 4) % 2;
  const src = staticFile(COPY.S03_image || 'img/placeholder_storefront.jpg');
  const imgStyle: React.CSSProperties = {position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'};
  const nameFs = f.portrait ? 64 : 60;
  return (
    <AbsoluteFill style={{background: C.night}}>
      <MapView id="d3m" w={f.w} h={f.h} scale={4.2} cell={48} cx={L.pinX} cy={L.pinY} dim={0.12} />
      <DitherFilter id="d3p" cell={cell} gain={1.15} bias={0.04} />
      {/* card */}
      <div style={{position: 'absolute', left: L.card.x, top: L.card.y, width: L.card.w, height: (L.card.h + L.info) * open, overflow: 'hidden', background: C.night, boxShadow: `0 0 0 8px ${C.cream}, 18px 18px 0 8px ${C.signal}`, opacity: open > 0 ? 1 : 0}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: L.card.w, height: L.card.h, overflow: 'hidden'}}>
          <Img src={src} style={{...imgStyle, filter: 'url(#d3p)'}} />
          <div style={{position: 'absolute', inset: 0, clipPath: `circle(${iris * 75}% at 50% 55%)`}}>
            <Img src={src} style={imgStyle} />
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: L.card.h, height: L.info, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px', gap: 10, borderTop: `8px solid ${C.cream}`}}>
          <div style={{fontFamily: SANS(), fontWeight: 700, fontSize: nameFs, lineHeight: 1, color: C.cream, letterSpacing: '-0.03em', whiteSpace: 'nowrap', overflow: 'hidden'}}>{COPY.S03_name}</div>
          <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: PIXEL(), fontSize: f.portrait ? 28 : 26, color: C.go}}>
            <div style={{width: 18, height: 18, background: C.go, opacity: blink}} />
            {COPY.S03_status}
          </div>
        </div>
      </div>
      {/* tag */}
      <div style={{position: 'absolute', left: L.card.x, top: L.card.y - 74, background: C.go, color: C.night, fontFamily: PIXEL(), fontSize: f.portrait ? 30 : 28, padding: '8px 16px', opacity: t >= 90 ? 1 : 0}}>{COPY.S03_tag}</div>
      {/* pin */}
      <div style={{position: 'absolute', left: L.pinX - pinW / 2, top: L.pinY - pinH + pinOff, transform: `scale(${1 / squash}, ${squash})`, transformOrigin: '50% 100%'}}>
        <Sprite map={PIN} px={px} color={C.signal} shadow={C.night} />
      </div>
    </AbsoluteFill>
  );
};
