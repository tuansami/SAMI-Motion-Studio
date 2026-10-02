import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useT} from '@engine/lib/useT';
import {tw} from '@engine/lib/anim';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {GridFrame, CellFill, SquashText, useGrid, target, fillOrder, fitAnton, UI} from './kit';

// S04 · Full house: tomato floods outward from the booked slot ring by ring (beat 0), then swallows the frame (beat 1).
// "Ausgebucht." squashes in, stretched tall, and pulses on beats 3–7. Sub-line on an ink strip.
export const S04: React.FC = () => {
  const t = useT();
  const g = useGrid();
  const f = g.f;
  const tg = target();
  const order = fillOrder();
  const from = g.cell(tg.d, tg.s);
  const fp = tw(t, 13, 9);
  const flood = {x: from.x * (1 - fp), y: from.y * (1 - fp), w: from.w + (f.w - from.w) * fp, h: from.h + (f.h - from.h) * fp};
  const word = String(COPY.S04_title || '').toUpperCase();
  const sy = f.portrait ? 2.5 : 1.35;
  const fs = fitAnton(word, f.w - (f.portrait ? 120 : 200), f.portrait ? 260 : 380);
  const base = f.portrait ? 1180 : 760; // baseline of the stretched word
  const sub = tw(t, 45, 10);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {order.map((c, i) => {
        const ring = Math.abs(c.d - tg.d) + Math.abs(c.s - tg.s);
        const k = 0 + ring * 2;
        const r = g.cell(c.d, c.s);
        return (
          <React.Fragment key={i}>
            {i < 28 ? <CellFill r={r} p={1} color={c.col === 'sun' ? C.sun : c.col === 'tomato' ? C.tomato : C.ink} /> : null}
            {t >= k ? <CellFill r={r} p={tw(t, k, 4)} color={C.tomato} /> : null}
          </React.Fragment>
        );
      })}
      <CellFill r={from} p={1} color={C.tomato} />
      <GridFrame />
      <div style={{position: 'absolute', left: flood.x, top: flood.y, width: flood.w, height: flood.h, background: C.tomato, opacity: t >= 13 ? 1 : 0}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: base - fs, height: fs, display: 'flex', justifyContent: 'center'}}>
        <SquashText text={word} t={t} start={20} step={1.5} fs={fs} color={C.ink} sy={sy} pulses={[45, 60, 75, 90, 105]} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: base + (f.portrait ? 60 : 50), display: 'flex', justifyContent: 'center', opacity: sub, transform: `translateY(${(1 - sub) * 24}px)`}}>
        <div style={{background: C.ink, color: C.sun, fontFamily: UI(), fontWeight: 800, fontSize: f.portrait ? 40 : 42, padding: f.portrait ? '18px 30px' : '16px 34px', textAlign: 'center', maxWidth: f.w - 144, letterSpacing: '-0.01em'}}>{COPY.S04_sub}</div>
      </div>
    </AbsoluteFill>
  );
};
