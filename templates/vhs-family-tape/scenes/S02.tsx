import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {useT} from '@engine/lib/useT';
import {tw} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {Vhs, Osd, Snow, Scrim, VT, useCorners, timecode} from './vhs';

// Three crops of the same family photo (wide · faces · detail). Exported so S03 can freeze on crop 3.
export const CROPS = [
  {pos: '50% 40%', z0: 1.04, z1: 1.12},
  {pos: '28% 22%', z0: 1.65, z1: 1.8},
  {pos: '72% 62%', z0: 1.45, z1: 1.32},
];
// 9:16 crops (the frame is already a narrow slice of a landscape photo)
const CROPS_V = [
  {pos: '50% 40%', z0: 1.0, z1: 1.06},
  {pos: '34% 30%', z0: 1.12, z1: 1.22},
  {pos: '66% 55%', z0: 1.2, z1: 1.1},
];
export const FamilyCrop: React.FC<{i: number; p: number}> = ({i, p}) => {
  const f = useFormat();
  const c = (f.portrait ? CROPS_V : CROPS)[i];
  const img = COPY.S02_image;
  return (
    <AbsoluteFill style={{background: C.tapeBlack, overflow: 'hidden'}}>
      {img && <Img src={staticFile(img)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: c.pos, transform: `scale(${c.z0 + (c.z1 - c.z0) * p})`, transformOrigin: c.pos}} />}
    </AbsoluteFill>
  );
};

const CUTS = [0, 75, 150, 240];

// S02 · Founding-family stills on tape: 3 crops cut on the beat, camcorder captions type on, tracking band rolls.
export const S02: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const cn = useCorners();
  const osd = usePick({'16:9': 60, '9:16': 58});
  const capSize = usePick({'16:9': 104, '9:16': 92});
  const i = t < CUTS[1] ? 0 : t < CUTS[2] ? 1 : 2;
  const local = t - CUTS[i];
  const len = CUTS[i + 1] - CUTS[i];
  const p = Math.max(0, Math.min(1, local / len));
  const cap = String([COPY.S02_cap1, COPY.S02_cap2, COPY.S02_cap3][i] || '');
  const nCap = Math.max(0, Math.min(cap.length, Math.floor((local - 8) * 0.9)));
  const glitch = (t >= CUTS[1] - 2 && t < CUTS[1] + 2) || (t >= CUTS[2] - 2 && t < CUTS[2] + 2) ? 0.85 : 0;
  const pin = tw(t, 0, 6);

  return (
    <AbsoluteFill style={{background: C.tapeBlack}}>
      <Vhs id="s02v" render={() => <FamilyCrop i={i} p={p} />} split={8} band={1} bandSpeed={8} />
      <Scrim />
      <Osd size={osd} style={{position: 'absolute', left: cn.side, top: cn.top, opacity: pin}}>{COPY.S02_osd}</Osd>
      <Osd size={osd * 0.85} style={{position: 'absolute', right: cn.side, top: cn.top}}>{timecode(4, t)}</Osd>
      <div style={{position: 'absolute', left: cn.side, right: cn.side, bottom: cn.bottom, display: 'flex', flexDirection: f.portrait ? 'column' : 'row', alignItems: f.portrait ? 'flex-start' : 'flex-end', justifyContent: 'space-between', gap: f.portrait ? 18 : 40}}>
        <div style={{fontFamily: VT, fontSize: capSize, lineHeight: 0.95, color: C.cream, textShadow: '4px 4px 0 rgba(0,0,0,0.6)', maxWidth: f.portrait ? f.w - cn.side * 2 : f.w * 0.62}}>
          {cap.slice(0, nCap)}
          <span style={{opacity: Math.floor(t / 8) % 2 ? 1 : 0, color: C.tungsten}}>_</span>
        </div>
        <Osd size={osd * 0.85} color={C.tungsten}>{COPY.S01_date}</Osd>
      </div>
      <Snow opacity={glitch} />
    </AbsoluteFill>
  );
};
