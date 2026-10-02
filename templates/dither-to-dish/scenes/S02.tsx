import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Words} from '@engine/components/Text';
import {useT} from '@engine/lib/useT';
import {tw} from '@engine/lib/anim';
import {useFormat} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {OV} from '@engine/core/constants';
import {C} from '@engine/theme';
import {MapView, Brackets, PIXEL, SANS, beatIdx} from './kit';

// S02 · Zoom to the street in 4 snaps (beats 1–4); on every snap the dither pixels get coarser (8 → 32 px).
// Beats 4–6: pixel focus brackets close in on the spot; headline in the panel.
const SCALE = [0.55, 1.0, 1.7, 2.8, 4.2];
const CELL = [8, 12, 16, 24, 32];
const BOX = [760, 600, 460, 340, 260, 220, 200];

export const S02: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const b = beatIdx(t);
  const k = Math.min(4, b);
  const prev = Math.max(0, k - 1);
  const snap = k === 0 ? 1 : tw(t, k * 15, 6);
  const scale = SCALE[prev] + (SCALE[k] - SCALE[prev]) * snap;
  const cell = CELL[k];
  const box = BOX[Math.min(BOX.length - 1, b)];
  const lock = t >= 75;
  const mk = 32 + k * 6;
  return (
    <AbsoluteFill style={{background: C.night}}>
      <MapView id="d2" w={f.w} h={f.h} scale={scale} cell={cell} />
      <div style={{position: 'absolute', left: f.w / 2 - box / 2, top: f.h / 2 - box / 2}}>
        <Brackets w={box} h={box} px={10} color={lock ? C.signal : C.cream} />
      </div>
      <div style={{position: 'absolute', left: f.w / 2 - mk / 2, top: f.h / 2 - mk / 2, width: mk, height: mk, background: C.signal, boxShadow: `0 0 0 6px ${C.night}`}} />
      <div style={{position: 'absolute', left: f.w / 2 + box / 2 + 18, top: f.h / 2 - box / 2, background: lock ? C.signal : C.night, color: lock ? C.night : C.cream, fontFamily: PIXEL(), fontSize: f.portrait ? 26 : 24, padding: '8px 14px', whiteSpace: 'nowrap', opacity: t >= 60 ? 1 : 0, ...(f.portrait ? {left: f.w / 2 - box / 2, top: f.h / 2 + box / 2 + 18} : {})}}>
        {COPY.S02_lock}
      </div>
      <div style={{position: 'absolute', left: f.portrait ? 72 : 96, right: f.portrait ? 72 : undefined, bottom: f.portrait ? 400 : 80, background: C.night, padding: f.portrait ? '40px 44px' : '34px 44px', boxShadow: `0 0 0 4px ${C.cream}`}}>
        <Words text={COPY.S02_title} start={OV + 4} stagger={5} hlColor={C.signal} style={{fontFamily: SANS(), fontWeight: 700, fontSize: f.portrait ? 84 : 80, color: C.cream, letterSpacing: '-0.03em', lineHeight: 1.02}} />
      </div>
    </AbsoluteFill>
  );
};
