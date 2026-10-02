import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useT} from '@engine/lib/useT';
import {tw} from '@engine/lib/anim';
import {useFormat, usePick, SAFE} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {Paper, BrushDefs, Stroke, Hand, SectionTag} from './_paint';
import {Mark, Wordmark} from './_logo';

// S02 · The logo is painted stroke by stroke: wide washes first (enso, petals), then bowl, wordmark, fine detail.
// 16:9 = horizontal lockup (mark left, name right) · 9:16 = stacked lockup.
export const S02: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const safe = SAFE[f.ratio];
  const L = usePick({
    '16:9': {mx: 600, my: 545, ms: 560, wx: 1310, wt: 405, ww: 820, base: 170, nx: 1130, ny: 800, ax: [1110, 830, 860, 800]},
    '9:16': {mx: 540, my: 770, ms: 620, wx: 540, wt: 1150, ww: 900, base: 180, nx: 600, ny: 300, ax: [590, 340, 520, 470]},
  });
  const push = 1 + tw(t, -8, 200) * 0.04;
  const noteP = tw(t, 148, 18);
  const [a0, a1, a2, a3] = L.ax;
  return (
    <AbsoluteFill>
      <Paper id="s2" />
      <AbsoluteFill style={{transform: `scale(${push})`}}>
        <svg width={f.w} height={f.h} viewBox={`0 0 ${f.w} ${f.h}`} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply'}}>
          <BrushDefs id="s2b" w={f.w} h={f.h} rough={8} />
          <Mark id="m2" x={L.mx} y={L.my} size={L.ms} t={t} fid="s2b" />
          <Wordmark id="s2w" fid="s2b" cx={L.wx} top={L.wt} width={L.ww} name={COPY.S02_brand} sub={COPY.S02_brand_sub} t={t - 60} base={L.base} />
          {/* hand-drawn arrow from the note to the mark */}
          <Stroke d={`M ${a0} ${a1} C ${(a0 + a2) / 2} ${a1 + (f.portrait ? 30 : 40)} ${a2 + 30} ${(a1 + a3) / 2} ${a2} ${a3}`} w={4} color={C.ink} p={tw(t, 154, 12)} filter="s2bw" />
          <Stroke d={`M ${a2 + 24} ${a3 - 12} L ${a2} ${a3} L ${a2 + 20} ${a3 + 18}`} w={4} color={C.ink} p={tw(t, 162, 6)} filter="s2bw" />
        </svg>
        <div style={{position: 'absolute', left: L.nx, top: L.ny}}>
          <Hand text={COPY.S02_note} p={noteP} size={f.portrait ? 60 : 54} color={C.ink} />
        </div>
      </AbsoluteFill>
      <SectionTag text={COPY.S02_tag} t={t} x={safe.side} y={safe.top + (f.portrait ? 0 : 20)} size={f.portrait ? 30 : 26} />
    </AbsoluteFill>
  );
};
