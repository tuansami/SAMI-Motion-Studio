import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useT} from '@engine/lib/useT';
import {tw, arrive, rnd} from '@engine/lib/anim';
import {useFormat, usePick, SAFE} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {Paper, BrushDefs, Brush, Hand, SectionTag, serif, script} from './_paint';

// S03 · Colour world — three fat brush strokes land on beats 0.5 / 2.5 / 4.5, name + hex follow.
// 16:9 = three vertical columns · 9:16 = three horizontal bands stacked, labels to the right.
export const S03: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const safe = SAFE[f.ratio];
  const sw = [
    {col: C.terracotta, name: COPY.S03_c1_name, hex: COPY.S03_c1_hex || C.terracotta},
    {col: C.olive, name: COPY.S03_c2_name, hex: COPY.S03_c2_hex || C.olive},
    {col: C.ink, name: COPY.S03_c3_name, hex: COPY.S03_c3_hex || C.ink},
  ];
  const push = 1 + tw(t, -8, 200) * 0.035;
  const T0 = [8, 38, 68];
  const geo = (i: number) =>
    f.portrait
      ? {d: `M 80 ${610 + i * 330} C 240 ${598 + i * 330} 400 ${624 + i * 330} 540 ${606 + i * 330}`, lx: 690, ly: 550 + i * 330, w: 210, sx: 80, sy: 610 + i * 330}
      : {d: `M ${560 + i * 400} 300 C ${574 + i * 400} 420 ${548 + i * 400} 520 ${566 + i * 400} 610`, lx: 560 + i * 400, ly: 768, w: 240, sx: 560 + i * 400, sy: 300};
  const nameSize = usePick({'16:9': 50, '9:16': 52});
  const hexSize = usePick({'16:9': 46, '9:16': 48});
  return (
    <AbsoluteFill>
      <Paper id="s3" />
      <AbsoluteFill style={{transform: `scale(${push})`}}>
        <svg width={f.w} height={f.h} viewBox={`0 0 ${f.w} ${f.h}`} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply'}}>
          <BrushDefs id="s3b" w={f.w} h={f.h} rough={11} />
          {sw.map((s, i) => {
            const g = geo(i);
            const p = tw(t, T0[i], 18);
            return (
              <g key={i}>
                <Brush d={g.d} w={g.w} color={s.col} p={p} fid="s3b" dry={f.portrait ? 'h' : 'v'} opacity={0.96} />
                {[0, 1, 2, 3, 4].map((k) => {
                  const q = tw(t, T0[i] + 1 + k, 5);
                  if (q <= 0) return null;
                  const a = rnd(i * 17 + k) * Math.PI * 2;
                  const r = g.w * (0.6 + rnd(i * 31 + k) * 0.25);
                  return <circle key={k} cx={g.sx + Math.cos(a) * r} cy={g.sy + Math.sin(a) * r * (f.portrait ? 0.6 : 1)} r={(3 + rnd(i * 7 + k) * 9) * q} fill={s.col} opacity={0.9} filter="url(#s3br)" />;
                })}
              </g>
            );
          })}
        </svg>
        {sw.map((s, i) => {
          const g = geo(i);
          const pn = tw(t, T0[i] + 14, 16);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: f.portrait ? g.lx : g.lx - 200,
                top: g.ly,
                width: f.portrait ? f.w - g.lx - safe.side + 20 : 400,
                textAlign: f.portrait ? 'left' : 'center',
                ...arrive(pn, 22, 8),
              }}
            >
              <div style={{fontFamily: serif(), fontWeight: 700, fontSize: nameSize, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.05}}>{s.name}</div>
              <div style={{fontFamily: script(), fontWeight: 700, fontSize: hexSize, color: s.col, marginTop: 6, textTransform: 'uppercase'}}>{s.hex}</div>
            </div>
          );
        })}
        <div style={{position: 'absolute', left: 0, right: 0, top: f.portrait ? 1420 : 905, display: 'flex', justifyContent: 'center'}}>
          <Hand text={COPY.S03_note} p={tw(t, 112, 24)} size={f.portrait ? 62 : 60} color={C.ink} rotate={-2} />
        </div>
      </AbsoluteFill>
      <SectionTag text={COPY.S03_tag} t={t} x={safe.side} y={safe.top + (f.portrait ? 0 : 20)} size={f.portrait ? 30 : 26} />
    </AbsoluteFill>
  );
};
