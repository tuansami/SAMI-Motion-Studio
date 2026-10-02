import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useT} from '@engine/lib/useT';
import {tw} from '@engine/lib/anim';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {GridFrame, Header, useGrid, target} from './kit';

// S01 · The week grid snaps on: horizontal rules (beat 0), vertical rules + day labels (beat 1), time labels;
// headline squashes in letter by letter. The free slot blinks on beat 3.
export const S01: React.FC = () => {
  const t = useT();
  const g = useGrid();
  const tg = target();
  const r = g.cell(tg.d, tg.s);
  const blink = t >= 45 ? (Math.floor((t - 45) / 4) % 2 === 0 ? 1 : 0) : 0;
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Header text={COPY.S01_title} t={t} start={0} hlColor={C.tomato} />
      <GridFrame p={tw(t, -2, 24)} lp={tw(t, 15, 14)} />
      <div style={{position: 'absolute', left: r.x + 10, top: r.y + 10, width: r.w - 20, height: r.h - 20, border: `6px dashed ${C.tomato}`, opacity: blink}} />
    </AbsoluteFill>
  );
};
