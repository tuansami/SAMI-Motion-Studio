import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useT} from '@engine/lib/useT';
import {keys, rnd} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {Plate, PopWords, pop} from './kit';

/** Background + spinning plate of S01 at scene time T. Exported so S02 starts on the exact same picture. */
export const Stage01: React.FC<{T: number}> = ({T}) => {
  const f = useFormat();
  const S = usePick({'16:9': 600, '9:16': 700});
  const cx = f.portrait ? f.w / 2 : 620;
  const cy = f.portrait ? 1130 : f.h / 2 + 30;
  const drop = keys(T, [[0, -f.h], [12, 0]]);
  const tilt = keys(T, [[0, 0.42], [13, 0.42], [30, 1], [45, 0.34], [60, 1], [75, 0.5], [90, 1]]);
  const squash = keys(T, [[11, 1], [14, 0.94], [20, 1]]);
  const spin = T * 2.4;
  const hl = -50 + T * 3.2;
  const blob = pop(T, 8, 10);
  const th = Math.max(0.12, tilt);
  return (
    <AbsoluteFill style={{background: C.cream, overflow: 'hidden'}}>
      {/* organic pink blob behind the plate */}
      <div style={{position: 'absolute', left: cx - S * 0.78, top: cy - S * 0.72, width: S * 1.56, height: S * 1.44, borderRadius: '44% 56% 52% 48% / 56% 42% 58% 44%', background: C.pink, transform: `scale(${blob}) rotate(${T * 0.4}deg)`}} />
      {/* confetti dots */}
      {Array.from({length: 9}).map((_, i) => {
        const a = rnd(i + 2) * Math.PI * 2;
        const d = S * (0.85 + rnd(i + 9) * 0.35);
        const p = pop(T, 16 + i * 2, 8);
        return <div key={i} style={{position: 'absolute', left: cx + Math.cos(a) * d, top: cy + Math.sin(a) * d * 0.8, width: 18 + rnd(i) * 26, height: 18 + rnd(i) * 26, borderRadius: '50%', background: i % 3 ? C.green : C.ink, transform: `scale(${p})`}} />;
      })}
      <div style={{position: 'absolute', left: cx - S / 2, top: cy - (S * th) / 2 + drop, transform: `scaleX(${2 - squash}) scaleY(${squash})`, transformOrigin: '50% 100%'}}>
        <Plate size={S} tilt={tilt} spin={spin} hl={hl} />
      </div>
    </AbsoluteFill>
  );
};

// S01 · Hook: a flat plate drops in and spins in fake 3D (ellipse squashes/expands on the beat), headline pops beside it.
export const S01: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const size = usePick({'16:9': 138, '9:16': 128});
  return (
    <AbsoluteFill>
      <Stage01 T={t} />
      <div style={{position: 'absolute', left: f.portrait ? 72 : 1080, right: f.portrait ? 72 : 80, top: f.portrait ? 260 : 0, height: f.portrait ? undefined : f.h, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
        <PopWords text={COPY.S01_title} start={20} stagger={7} size={size} align={f.portrait ? 'center' : 'left'} out={106} />
      </div>
    </AbsoluteFill>
  );
};
