import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {useT} from '@engine/lib/useT';
import {tw} from '@engine/lib/anim';
import {useFormat} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {DitherFilter, Sprite, STAR, PIXEL, SANS, beatIdx, alpha} from './kit';

// S04 · Rating: five pixel stars fill one per beat (beats 1–5) while the score ticks up in the same steps.
// Score, quote and author are SAMPLE copy (labelled in the Studio) — replace with the restaurant's real review.
export const S04: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const b = beatIdx(t);
  const target = parseFloat(String(COPY.S04_rating || '0').replace(',', '.')) || 0;
  const k = Math.max(0, Math.min(5, b));
  const shown = k === 0 ? 0 : (target * k) / 5;
  const score = shown.toFixed(1).replace('.', ',');
  const full = target * (k / 5); // stars filled so far (fractional last star hidden until beat 5)
  const sp = f.portrait ? 14 : 13;
  const photo = tw(t, -4, 10);
  const q = tw(t, 75, 12);
  const a = tw(t, 84, 12);
  const src = staticFile(COPY.S03_image || 'img/placeholder_storefront.jpg');
  const P = f.portrait ? {x: 72, y: 250, w: 936, h: 527} : {x: 110, y: 190, w: 800, h: 560};
  const R = f.portrait ? {x: 72, y: 830, w: 936} : {x: 1000, y: 210, w: 820};
  return (
    <AbsoluteFill style={{background: C.night}}>
      <DitherFilter id="d4" cell={12} />
      <div style={{position: 'absolute', inset: 0, filter: 'url(#d4)', background: `linear-gradient(${f.portrait ? 180 : 160}deg, ${C.night} 58%, ${alpha(C.cream, 0.5)} 100%)`}} />
      {/* photo, now in colour */}
      <div style={{position: 'absolute', left: P.x, top: P.y, width: P.w, height: P.h, overflow: 'hidden', boxShadow: `0 0 0 8px ${C.cream}, 18px 18px 0 8px ${C.signal}`, opacity: photo, transform: `translateY(${(1 - photo) * 30}px)`}}>
        <Img src={src} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
      {/* rating block */}
      <div style={{position: 'absolute', left: R.x, top: R.y, width: R.w, background: C.night, padding: '20px 28px 28px', boxSizing: 'border-box', boxShadow: `0 0 0 4px ${alpha(C.cream, 0.15)}`}}>
        <div style={{fontFamily: PIXEL(), fontSize: f.portrait ? 30 : 26, color: C.signal, letterSpacing: '0.04em'}}>{COPY.S04_label}</div>
        <div style={{fontFamily: SANS(), fontWeight: 700, fontSize: f.portrait ? 220 : 200, lineHeight: 0.95, color: C.cream, letterSpacing: '-0.05em', fontVariantNumeric: 'tabular-nums', marginTop: 6}}>{score}</div>
        <div style={{display: 'flex', gap: sp * 1.6, marginTop: 22}}>
          {[0, 1, 2, 3, 4].map((i) => {
            const on = full >= i + 0.5;
            const pop = on && Math.floor(full + 0.5) === i + 1 && t % 15 < 3;
            return (
              <div key={i} style={{transform: `scale(${pop ? 1.25 : 1})`}}>
                <Sprite map={STAR} px={sp} color={on ? C.signal : alpha(C.cream, 0.18)} shadow={on ? C.night : undefined} />
              </div>
            );
          })}
        </div>
        <div style={{fontFamily: SANS(), fontWeight: 500, fontSize: f.portrait ? 54 : 46, lineHeight: 1.15, color: C.cream, marginTop: f.portrait ? 44 : 36, opacity: q, transform: `translateY(${(1 - q) * 16}px)`, letterSpacing: '-0.02em'}}>{COPY.S04_quote}</div>
        <div style={{fontFamily: PIXEL(), fontSize: f.portrait ? 26 : 22, color: alpha(C.cream, 0.7), marginTop: 18, opacity: a}}>{COPY.S04_author}</div>
      </div>
    </AbsoluteFill>
  );
};
