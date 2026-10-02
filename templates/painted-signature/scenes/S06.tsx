import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SamiLockup} from '@engine/components/Brand';
import {Icon} from '@engine/components/Icon';
import {useT} from '@engine/lib/useT';
import {tw, arrive} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C, F} from '@engine/theme';
import {Paper, BrushDefs, Brush, Hand, serif} from './_paint';

// S06 · SAMI end card — an ink panel is brushed in with fat alternating strokes, the SAMI lockup builds on it,
// then tagline + contact pills. Panel keeps the SAMI logo on a solid dark ground (recognisable).
export const S06: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const L = usePick({
    '16:9': {x0: 250, x1: 1670, ys: [300, 455, 610, 765], w: 210, box: [220, 860], lk: 150},
    '9:16': {x0: 70, x1: 1010, ys: [420, 600, 780, 960, 1140, 1320], w: 230, box: [330, 1420], lk: 150},
  });
  const lp = tw(t, 12, 36);
  return (
    <AbsoluteFill>
      <Paper id="s6" />
      <svg width={f.w} height={f.h} viewBox={`0 0 ${f.w} ${f.h}`} style={{position: 'absolute', inset: 0}}>
        <BrushDefs id="s6b" w={f.w} h={f.h} rough={14} />
        {L.ys.map((y, i) => {
          const a = i % 2 ? L.x1 : L.x0;
          const b = i % 2 ? L.x0 : L.x1;
          return <Brush key={i} d={`M ${a} ${y + (i % 2 ? 6 : -6)} C ${(a * 2 + b) / 3} ${y - 14} ${(a + b * 2) / 3} ${y + 16} ${b} ${y}`} w={L.w} color={C.ink} p={tw(t, -6 + i * 3, 16)} fid="s6b" dry="h" />;
        })}
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: L.box[0], height: L.box[1] - L.box[0], display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: f.portrait ? 44 : 30}}>
        <Hand text={COPY.S06_kicker} p={tw(t, 10, 16)} size={f.portrait ? 58 : 50} color={C.terracotta} />
        <div style={{transform: `scale(${1.05 - lp * 0.05})`, opacity: Math.min(1, lp * 1.6)}}>
          <SamiLockup height={L.lk} p={lp} id="ps6lk" />
        </div>
        <div style={{fontFamily: serif(), fontWeight: 400, fontSize: f.portrait ? 38 : 32, color: C.paper, textAlign: 'center', maxWidth: f.portrait ? 560 : 1200, lineHeight: 1.3, ...arrive(tw(t, 30, 16), 16, 6)}}>{COPY.S06_tagline}</div>
        <div style={{display: 'flex', flexDirection: f.portrait ? 'column' : 'row', gap: f.portrait ? 18 : 22, alignItems: 'center', marginTop: 6}}>
          {COPY.S06_phone ? (
            <div style={{...arrive(tw(t, 42, 14), 24, 6), display: 'flex', alignItems: 'center', gap: 14, background: C.paper, borderRadius: 999, padding: '16px 32px'}}>
              <Icon name="message" size={34} color={C.ink} stroke={2.2} />
              <span style={{fontFamily: F.ui, fontWeight: 700, fontSize: 36, color: C.ink}}>{COPY.S06_phone}</span>
            </div>
          ) : null}
          {COPY.S06_url ? (
            <div style={{...arrive(tw(t, 47, 14), 24, 6), display: 'flex', alignItems: 'center', gap: 14, borderRadius: 999, padding: '14px 30px', border: `3px solid ${C.terracotta}`}}>
              <Icon name="globe" size={32} color={C.terracotta} stroke={2.2} />
              <span style={{fontFamily: F.ui, fontWeight: 700, fontSize: 36, color: C.paper}}>{COPY.S06_url}</span>
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
