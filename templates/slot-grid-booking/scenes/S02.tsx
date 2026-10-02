import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useT} from '@engine/lib/useT';
import {tw} from '@engine/lib/anim';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {GridFrame, Header, CellFill, useGrid, target, fillOrder, BOOKED, beatIdx, UI} from './kit';

// S02 · Bookings arrive: on every beat a batch of slots stretch-fills with colour blocks (3 → 28 of 35).
// The one free slot keeps blinking. Headline: "online, around the clock".
export const S02: React.FC = () => {
  const t = useT();
  const g = useGrid();
  const tg = target();
  const order = fillOrder();
  const b = beatIdx(t);
  const r = g.cell(tg.d, tg.s);
  const blink = Math.floor(t / 4) % 2 === 0 ? 1 : 0.25;
  const tag = String(COPY.S02_free || '');
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {order.map((c, i) => {
        // slot i fills on the beat whose cumulative count first covers it
        const k = BOOKED.findIndex((n) => i < n);
        if (k < 0) return null;
        const s = k * 15 + (i % 3);
        const p = tw(t, s, 6);
        if (t < s) return null;
        return <CellFill key={i} r={g.cell(c.d, c.s)} p={p} color={c.col === 'sun' ? C.sun : c.col === 'tomato' ? C.tomato : C.ink} />;
      })}
      <div style={{position: 'absolute', left: r.x + 10, top: r.y + 10, width: r.w - 20, height: r.h - 20, border: `6px dashed ${C.tomato}`, opacity: blink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: UI(), fontWeight: 800, fontSize: g.f.portrait ? 26 : 28, color: C.tomato, textTransform: 'uppercase', letterSpacing: '0.04em'}}>
        {tag}
      </div>
      <GridFrame hl={b >= 6 ? tg : null} />
      <Header text={COPY.S02_title} t={t} start={2} hlColor={C.tomato} pulses={[60, 90]} />
    </AbsoluteFill>
  );
};
