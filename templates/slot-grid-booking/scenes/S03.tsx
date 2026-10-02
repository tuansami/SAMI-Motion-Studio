import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Icon} from '@engine/components/Icon';
import {useT} from '@engine/lib/useT';
import {tw} from '@engine/lib/anim';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {GridFrame, CellFill, SquashText, useGrid, target, fillOrder, fitAnton, UI} from './kit';

// S03 · The free slot gets booked: the cell stretches (beat 0) from its grid position to fill the whole grid,
// "Tisch für 4 · 19:30" squashes into it letter by letter (beats 1–2), then squash-pulses on beats 4·5·6·7.
// Everything is clipped inside the cell.
export const S03: React.FC = () => {
  const t = useT();
  const g = useGrid();
  const tg = target();
  const order = fillOrder();
  const from = g.cell(tg.d, tg.s);
  const to = g.f.portrait ? {x: 72, y: 230, w: 936, h: 1270} : {x: 96, y: 56, w: 1728, h: 944};
  const p = tw(t, 0, 10);
  const R = {x: from.x + (to.x - from.x) * p, y: from.y + (to.y - from.y) * p, w: from.w + (to.w - from.w) * p, h: from.h + (to.h - from.h) * p};
  const parts = String(COPY.S03_booking || '').split('·').map((s) => s.trim()).filter(Boolean);
  const l1 = (parts[0] || '').toUpperCase(), l2 = (parts[1] || '').toUpperCase();
  const iw = to.w - (g.f.portrait ? 80 : 140);
  // 9:16: line 1 stacks word by word so the type can be poster-big; 16:9: one line
  const rows1 = g.f.portrait ? l1.split(' ').reduce((a: string[], w) => (a.length && (a[a.length - 1] + ' ' + w).length <= 5 ? [...a.slice(0, -1), a[a.length - 1] + ' ' + w] : [...a, w]), []) : [l1];
  const fs1 = Math.min(...rows1.map((r) => fitAnton(r, iw, to.h * (g.f.portrait ? 0.19 : 0.3), 0.42)));
  const fs2 = l2 ? fitAnton(l2, iw, to.h * (g.f.portrait ? 0.3 : 0.45), 0.5) : 0;
  const pulses = [60, 75, 90, 105];
  const sub = tw(t, 45, 10);
  const day = tw(t, 12, 8);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {order.slice(0, 28).map((c, i) => <CellFill key={i} r={g.cell(c.d, c.s)} p={1} color={c.col === 'sun' ? C.sun : c.col === 'tomato' ? C.tomato : C.ink} />)}
      <GridFrame hl={tg} />
      <div style={{position: 'absolute', left: R.x, top: R.y, width: R.w, height: R.h, background: C.sun, overflow: 'hidden', boxShadow: `0 0 0 6px ${C.ink}`}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: to.w, height: to.h, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: to.h * 0.02}}>
          {rows1.map((r, i) => <SquashText key={i} text={r} t={t} start={10 + i * 4} step={1.2} fs={fs1} color={C.ink} pulses={pulses} style={{lineHeight: 0.95}} />)}
          {l2 ? <SquashText text={l2} t={t} start={24} step={2} fs={fs2} color={C.tomato} pulses={pulses} style={{lineHeight: 0.95}} /> : null}
        </div>
        <div style={{position: 'absolute', left: g.f.portrait ? 36 : 48, top: g.f.portrait ? 30 : 36, fontFamily: UI(), fontWeight: 800, fontSize: g.f.portrait ? 34 : 34, letterSpacing: '0.08em', color: C.ink, textTransform: 'uppercase', opacity: day, transform: `translateX(${(1 - day) * -20}px)`}}>
          {COPY.S03_day}
        </div>
        <div style={{position: 'absolute', left: g.f.portrait ? 36 : 48, bottom: g.f.portrait ? 30 : 36, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px', background: C.ink, color: C.paper, fontFamily: UI(), fontWeight: 700, fontSize: g.f.portrait ? 32 : 32, opacity: sub, transform: `translateY(${(1 - sub) * 20}px)`}}>
          <Icon name="check" size={34} color={C.sun} stroke={3} />
          {COPY.S03_sub}
        </div>
      </div>
    </AbsoluteFill>
  );
};
