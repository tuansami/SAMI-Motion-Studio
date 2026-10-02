import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {useT} from '@engine/lib/useT';
import {tw, keys} from '@engine/lib/anim';
import {useFormat, usePick, SAFE} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {Paper, BrushDefs, Brush, Stroke, Hand, SectionTag, serif} from './_paint';
import {Mark} from './_logo';

// S04 · Identity applied — paper bag, coffee cup and hanging shop sign are drawn as flat illustrations
// (ink outline → fill rises → logo paints itself on), then handwritten labels land on the beats.

type ObjP = {x: number; y: number; s: number; t: number; id: string; fid: string; name: string};

const fillClip = (id: string, top: number, bottom: number, p: number) => (
  <clipPath id={id}>
    <rect x={-400} y={bottom - (bottom - top + 40) * p} width={800} height={(bottom - top + 40) * p + 20} />
  </clipPath>
);

const serr = () => {
  let d = 'M -160 0 L -160 -380';
  for (let i = 1; i <= 16; i++) d += ` L ${-160 + i * 20} ${i % 2 ? -392 : -380}`;
  return d + ' L 160 0 Z';
};
const BAG = serr();

const Bag: React.FC<ObjP> = ({x, y, s, t, id, fid, name}) => {
  const out = tw(t, 0, 24);
  const fill = tw(t, 16, 16);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={6} rx={190 * out} ry={16} fill={C.ink} opacity={0.12} />
      <defs>{fillClip(id + 'c', -400, 0, fill)}</defs>
      <g clipPath={`url(#${id}c)`}>
        <path d={BAG} fill={C.olive} />
        <rect x={-160} y={-392} width={320} height={60} fill={C.ink} opacity={0.14} />
        <path d="M 160 0 L 160 -332 L 128 -332 L 134 0 Z" fill={C.ink} opacity={0.1} />
      </g>
      <Stroke d={BAG} w={5} color={C.ink} p={out} filter={fid + 'w'} />
      <Stroke d="M -160 -332 L 160 -332" w={3} color={C.ink} p={tw(t, 18, 12)} opacity={0.55} filter={fid + 'w'} />
      <Stroke d="M -64 -388 C -66 -486 66 -486 64 -388" w={8} color={C.ink} p={tw(t, 12, 16)} filter={fid + 'w'} />
      <Mark id={id + 'm'} x={0} y={-196} size={200} t={t - 30} speed={3} fid={fid} cols={{wash: C.paper, petal: C.terracotta, bowl: C.paper, fine: C.paper, hi: C.olive}} washOpacity={0.55} />
      <text x={0} y={-58} textAnchor="middle" fontFamily={serif()} fontWeight={900} fontSize={42} fill={C.paper} opacity={tw(t, 62, 12)}>
        {name}
      </text>
    </g>
  );
};

const CUP = 'M -90 0 L -115 -300 L 115 -300 L 90 0 Z';
const Cup: React.FC<ObjP> = ({x, y, s, t, id, fid}) => {
  const out = tw(t, 0, 24);
  const fill = tw(t, 16, 16);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={6} rx={130 * out} ry={14} fill={C.ink} opacity={0.12} />
      <defs>{fillClip(id + 'c', -380, 0, fill)}</defs>
      <g clipPath={`url(#${id}c)`}>
        <path d={CUP} fill={C.paper} />
        <path d="M 60 0 L 76 -300 L 115 -300 L 90 0 Z" fill={C.ink} opacity={0.07} />
        <path d="M -99 -110 L -109 -232 L 109 -232 L 99 -110 Z" fill={C.terracotta} />
        <rect x={-126} y={-332} width={252} height={34} rx={12} fill={C.ink} />
        <path d="M -112 -330 C -104 -376 104 -376 112 -330 Z" fill={C.ink} />
      </g>
      <Stroke d={CUP} w={5} color={C.ink} p={out} filter={fid + 'w'} />
      <Mark id={id + 'm'} x={0} y={-171} size={118} t={t - 28} speed={3} fid={fid} cols={{wash: C.paper, petal: C.paper, bowl: C.ink, fine: C.ink}} washOpacity={0.5} />
      <Stroke d="M -30 -400 C -44 -420 -16 -436 -30 -458" w={5} color={C.ink} p={tw(t, 64, 14)} opacity={0.5} filter={fid + 'w'} />
      <Stroke d="M 10 -404 C -4 -424 24 -440 10 -466" w={5} color={C.ink} p={tw(t, 68, 14)} opacity={0.45} filter={fid + 'w'} />
      <Stroke d="M 48 -398 C 34 -418 62 -432 48 -452" w={5} color={C.ink} p={tw(t, 72, 14)} opacity={0.4} filter={fid + 'w'} />
    </g>
  );
};

/** hanging round sign; (x,y) = bracket hook point, wall plate at wx */
const Sign: React.FC<ObjP & {wx: number}> = ({x, y, s, t, id, fid, name, wx}) => {
  const arm = tw(t, 0, 18);
  const out = tw(t, 12, 22);
  const fill = tw(t, 26, 14);
  const swing = Math.sin((t - 40) / 24) * 2.2 * tw(t, 40, 40);
  const dir = wx > x ? 1 : -1;
  const ax = (wx - x) / s;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={dir > 0 ? ax - 6 : ax - 22} y={-40} width={28} height={150} rx={6} fill={C.ink} opacity={arm} />
      <Stroke d={`M ${ax} 0 L ${-dir * 110} 0`} w={11} color={C.ink} p={arm} filter={fid + 'w'} />
      <Stroke d={`M ${ax} 90 C ${ax * 0.55} 80 ${ax * 0.25} 40 ${dir * 30} 2`} w={7} color={C.ink} p={tw(t, 8, 16)} filter={fid + 'w'} />
      <Stroke d={`M ${-dir * 110} 0 C ${-dir * 140} 0 ${-dir * 140} -34 ${-dir * 116} -30`} w={7} color={C.ink} p={tw(t, 14, 10)} filter={fid + 'w'} />
      <g transform={`rotate(${swing})`}>
        <Stroke d="M -64 0 L -64 103" w={4} color={C.ink} p={tw(t, 10, 12)} />
        <Stroke d="M 64 0 L 64 103" w={4} color={C.ink} p={tw(t, 12, 12)} />
        <defs>{fillClip(id + 'c', 80, 420, fill)}</defs>
        <g clipPath={`url(#${id}c)`}>
          <circle cx={0} cy={250} r={165} fill={C.ink} />
          <circle cx={0} cy={250} r={146} fill="none" stroke={C.paper} strokeWidth={3} opacity={0.5} />
        </g>
        <Stroke d="M 0 85 A 165 165 0 1 1 -0.1 85" w={5} color={C.ink} p={out} filter={fid + 'w'} />
        <Mark id={id + 'm'} x={0} y={222} size={176} t={t - 38} speed={3} fid={fid} cols={{wash: C.olive, petal: C.terracotta, bowl: C.paper, fine: C.paper, hi: C.ink}} washOpacity={0.95} />
        <text x={0} y={352} textAnchor="middle" fontFamily={serif()} fontWeight={900} fontSize={40} fill={C.paper} opacity={tw(t, 66, 12)}>
          {name}
        </text>
      </g>
    </g>
  );
};

export const S04: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const safe = SAFE[f.ratio];
  const L = usePick({
    '16:9': {floor: 840, fx: [260, 1660], bag: [470, 0.98], cup: [900, 1.1], sign: [1420, 250, 0.98, 1720], notes: [[470, 880], [900, 880], [1420, 690]]},
    '9:16': {floor: 1350, fx: [90, 990], bag: [310, 0.9], cup: [770, 1.02], sign: [540, 400, 0.95, 990], notes: [[310, 1392], [770, 1392], [540, 836]]},
  });
  const push = 1 + tw(t, -8, 250) * 0.035;
  const img = COPY.S04_image;
  const nSize = usePick({'16:9': 56, '9:16': 58});
  const notes = [COPY.S04_note_bag, COPY.S04_note_cup, COPY.S04_note_sign];
  const NT = [150, 165, 180];
  return (
    <AbsoluteFill>
      <Paper id="s4" />
      {img ? (
        <AbsoluteFill style={{opacity: 0.16 * tw(t, -8, 40), mixBlendMode: 'multiply', WebkitMaskImage: 'radial-gradient(70% 65% at 50% 45%, #000 20%, transparent 80%)', maskImage: 'radial-gradient(70% 65% at 50% 45%, #000 20%, transparent 80%)'}}>
          <Img src={staticFile(img)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) sepia(0.55) blur(2px) contrast(0.9)', transform: `scale(${1.08 - tw(t, 0, 240) * 0.05})`}} />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{transform: `scale(${push})`}}>
        <svg width={f.w} height={f.h} viewBox={`0 0 ${f.w} ${f.h}`} style={{position: 'absolute', inset: 0}}>
          <BrushDefs id="s4b" w={f.w} h={f.h} rough={7} />
          <BrushDefs id="s4o" x={-700} y={-900} w={1000} h={1100} rough={7} />
          <g style={{mixBlendMode: 'multiply'}}>
            <Brush d={`M ${L.fx[0]} ${L.floor + 8} C ${(L.fx[0] + L.fx[1]) / 2 - 200} ${L.floor - 6} ${(L.fx[0] + L.fx[1]) / 2 + 200} ${L.floor + 14} ${L.fx[1]} ${L.floor + 2}`} w={44} color={C.olive} p={tw(t, 0, 20)} fid="s4b" opacity={0.38} />
          </g>
          <Bag x={L.bag[0]} y={L.floor} s={L.bag[1]} t={t - 6} id="s4bag" fid="s4o" name={COPY.S02_brand} />
          <Cup x={L.cup[0]} y={L.floor} s={L.cup[1]} t={t - 30} id="s4cup" fid="s4o" name={COPY.S02_brand} />
          <Sign x={L.sign[0]} y={L.sign[1]} s={L.sign[2]} wx={L.sign[3]} t={t - 54} id="s4sig" fid="s4o" name={COPY.S02_brand} />
          {L.notes.map(([nx, ny], i) => (
            <Stroke key={i} d={`M ${nx} ${ny + 4} L ${nx} ${ny - 26} M ${nx - 12} ${ny - 14} L ${nx} ${ny - 28} L ${nx + 12} ${ny - 14}`} w={4} color={C.terracotta} p={tw(t, NT[i] - 4, 10)} filter="s4bw" />
          ))}
        </svg>
        {L.notes.map(([nx, ny], i) => {
          const p = tw(t, NT[i], 14);
          return (
            <div key={i} style={{position: 'absolute', left: nx - 300, width: 600, top: ny + 8, display: 'flex', justifyContent: 'center', transform: `scale(${keys(t, [[NT[i], 0.9], [NT[i] + 8, 1.04], [NT[i] + 14, 1]])})`}}>
              <Hand text={notes[i]} p={p} size={nSize} color={C.ink} rotate={i === 1 ? 2 : -3} />
            </div>
          );
        })}
      </AbsoluteFill>
      <SectionTag text={COPY.S04_tag} t={t} x={safe.side} y={safe.top + (f.portrait ? 0 : 20)} size={f.portrait ? 30 : 26} />
    </AbsoluteFill>
  );
};
