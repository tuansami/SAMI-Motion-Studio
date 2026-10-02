import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useT} from '@engine/lib/useT';
import {tw} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {Paper, RegMarks, PressFilters, useSheet, DISPLAY, MONO, beatIdx, alpha, fitSize} from './kit';

// S01 · Blank sheet feeds out of the copier in 4 roller jerks (one per beat), already printed with the hook.
export const S01: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const sh = useSheet();
  const slotY = sh.y - 34;
  // 4 roller steps, each lands on a beat (0,15,30,45)
  const feed = [0, 1, 2, 3].reduce((a, k) => a + tw(t, k * 15 - 2, 8) * 0.25, 0);
  const y = slotY - sh.h + feed * (sh.h + 34);
  const jitter = beatIdx(t) % 2 ? 1.5 : -1.5;
  const lines = String(COPY.S01_title || '').split('/').map((s) => s.trim());
  const fs = fitSize(lines.map((l) => l.toUpperCase()), sh.w - 110, usePick({'16:9': 104, '9:16': 128}));
  const scanX = ((t % 15) / 15) * (sh.w + 200) - 100;
  const labelSize = usePick({'16:9': 22, '9:16': 26});
  return (
    <AbsoluteFill>
      <Paper />
      <PressFilters id="x1" seed={beatIdx(t) + 1} />
      <RegMarks p={tw(t, 0, 20)} />
      {/* header line */}
      <div style={{position: 'absolute', left: f.portrait ? 72 : 150, right: f.portrait ? 72 : 150, top: f.portrait ? 226 : 40, display: 'flex', justifyContent: 'space-between', fontFamily: MONO(), fontWeight: 600, fontSize: labelSize, letterSpacing: '0.16em', color: C.ink, opacity: tw(t, 0, 8)}}>
        <span>{COPY.S01_label}</span>
        <span>{COPY.S01_counter}</span>
      </div>
      {/* sheet, clipped below the output slot */}
      <div style={{position: 'absolute', left: sh.x - 30, top: slotY, width: sh.w + 60, height: f.h - slotY, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 30, top: y - slotY, width: sh.w, height: sh.h, background: C.sheet, boxShadow: `0 30px 60px ${alpha(C.ink, 0.18)}`, transform: `translateX(${jitter}px)`}}>
          <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', filter: 'url(#x1-ink)'}}>
            {lines.map((l, i) => (
              <div key={i} style={{fontFamily: DISPLAY(), fontSize: fs, lineHeight: 0.98, color: i === lines.length - 1 ? C.red : C.ink, textTransform: 'uppercase', letterSpacing: '-0.01em', whiteSpace: 'nowrap'}}>
                {l}
              </div>
            ))}
          </div>
          <div style={{position: 'absolute', left: 40, right: 40, bottom: 34, display: 'flex', justifyContent: 'space-between', fontFamily: MONO(), fontSize: 18, letterSpacing: '0.2em', color: C.ink, opacity: 0.7}}>
            <span>{COPY.S01_foot}</span>
            <span>{COPY.S01_counter}</span>
          </div>
        </div>
      </div>
      {/* copier output slot + scanning light */}
      <div style={{position: 'absolute', left: sh.x - 70, width: sh.w + 140, top: slotY - 26, height: 30, background: C.ink, borderRadius: 6, overflow: 'hidden'}}>
        <div style={{position: 'absolute', top: 10, height: 10, width: 200, left: scanX, background: `linear-gradient(90deg, transparent, ${C.blue}, transparent)`, opacity: 0.9}} />
      </div>
    </AbsoluteFill>
  );
};
