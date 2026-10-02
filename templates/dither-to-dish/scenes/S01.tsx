import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Words} from '@engine/components/Text';
import {useT} from '@engine/lib/useT';
import {tw} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {OV} from '@engine/core/constants';
import {C} from '@engine/theme';
import {MapView, Sprite, PIXEL, SANS, beatIdx} from './kit';

const LENS = ['.XXX.', 'X...X', 'X...X', 'X...X', '.XXX.', '....X'];

// S01 · A 1-bit city map builds itself from code, ring by ring on every beat, around a search "ping".
// Search query types into a pixel bar; the headline lands in a solid panel.
export const S01: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const b = beatIdx(t);
  const ring = 380;
  const reveal = (b + 1) * ring;
  const q = String(COPY.S01_search || '');
  const typed = q.slice(0, Math.max(0, Math.floor((t - 4) * 1.3)));
  const caret = Math.floor(t / 8) % 2 === 0;
  const ping = (t % 15) / 15; // grows over each beat, steps of 3 frames
  const pingR = Math.floor(ping * 5) * 36 + 24;
  const bar = tw(t, -2, 8);
  const fs = usePick({'16:9': 34, '9:16': 36});
  const cell = usePick({'16:9': 8, '9:16': 8});
  return (
    <AbsoluteFill style={{background: C.night}}>
      <MapView id="d1" w={f.w} h={f.h} scale={0.55} cell={cell} reveal={reveal} flash={reveal - ring} />
      {/* search ping */}
      <svg width={f.w} height={f.h} style={{position: 'absolute', inset: 0}} shapeRendering="crispEdges">
        <rect x={f.w / 2 - pingR} y={f.h / 2 - pingR} width={pingR * 2} height={pingR * 2} fill="none" stroke={C.signal} strokeWidth={8} opacity={1 - ping} />
        <rect x={f.w / 2 - 16} y={f.h / 2 - 16} width={32} height={32} fill={C.signal} stroke={C.night} strokeWidth={6} />
      </svg>
      {/* search bar */}
      <div style={{position: 'absolute', left: f.portrait ? 72 : 460, right: f.portrait ? 72 : 460, top: f.portrait ? 240 : 70, height: f.portrait ? 110 : 96, background: C.cream, boxShadow: `0 0 0 6px ${C.night}, 12px 12px 0 6px ${C.signal}`, display: 'flex', alignItems: 'center', gap: 22, padding: '0 30px', transform: `scaleX(${bar})`, transformOrigin: '0 50%'}}>
        <Sprite map={LENS} px={7} color={C.night} />
        <span style={{fontFamily: PIXEL(), fontSize: fs, color: C.night, whiteSpace: 'nowrap', overflow: 'hidden'}}>
          {typed}
          <span style={{opacity: caret ? 1 : 0, color: C.signal}}>{'█'}</span>
        </span>
      </div>
      {/* headline panel */}
      <div style={{position: 'absolute', left: f.portrait ? 72 : 96, right: f.portrait ? 72 : undefined, bottom: f.portrait ? 400 : 80, background: C.night, padding: f.portrait ? '40px 44px' : '34px 44px', boxShadow: `0 0 0 4px ${C.cream}`, opacity: t >= 20 ? 1 : 0}}>
        <Words text={COPY.S01_title} start={OV + 22} stagger={5} hlColor={C.signal} style={{fontFamily: SANS(), fontWeight: 700, fontSize: f.portrait ? 84 : 80, color: C.cream, letterSpacing: '-0.03em', lineHeight: 1.02}} />
      </div>
    </AbsoluteFill>
  );
};
