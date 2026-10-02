import React from 'react';
import {AbsoluteFill} from 'remotion';
import {NavyBG} from '@engine/components/Brand';
import {Words} from '@engine/components/Text';
import {useT} from '@engine/lib/useT';
import {tw} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {OV} from '@engine/core/constants';
import {C, F, GRAD} from '@engine/theme';

// T02 · Big number — counter rolls up inside a progress ring, caption rises under it.
export const T02: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const target = parseFloat(String(COPY.T02_number).replace(',', '.')) || 0;
  const p = tw(t, 6, 30);
  const v = target * p;
  const R = usePick({'16:9': 250, '9:16': 300, '1:1': 260});
  const circ = 2 * Math.PI * R;
  const ringP = Math.min(1, (parseFloat(COPY.T02_ring) || target) / 100) * p;
  return (
    <AbsoluteFill>
      <NavyBG />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: f.portrait ? 70 : 40}}>
        <div style={{position: 'relative', width: R * 2 + 40, height: R * 2 + 40, transform: `scale(${0.92 + tw(t, 0, 20) * 0.08})`, opacity: tw(t, 0, 12)}}>
          <svg width={R * 2 + 40} height={R * 2 + 40} style={{position: 'absolute', inset: 0}}>
            <defs><linearGradient id="t2g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={C.mint} /><stop offset="1" stopColor={C.purple} /></linearGradient></defs>
            <circle cx={R + 20} cy={R + 20} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} />
            <circle cx={R + 20} cy={R + 20} r={R} fill="none" stroke="url(#t2g)" strokeWidth={10} strokeLinecap="round" strokeDasharray={`${circ * ringP} ${circ}`} transform={`rotate(-90 ${R + 20} ${R + 20})`} />
          </svg>
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.head, fontWeight: 800, letterSpacing: '-0.05em', background: GRAD, WebkitBackgroundClip: 'text', color: 'transparent'}}>
            <span style={{fontSize: R * 0.95, fontVariantNumeric: 'tabular-nums'}}>{Number.isInteger(target) ? Math.round(v) : v.toFixed(1).replace('.', ',')}</span>
            <span style={{fontSize: R * 0.42, marginTop: -R * 0.3}}>{COPY.T02_suffix}</span>
          </div>
        </div>
        <div style={{maxWidth: f.w * 0.84, textAlign: 'center'}}>
          <Words text={COPY.T02_caption} start={22 + OV} stagger={3} dur={16} style={{fontSize: usePick({'16:9': 60, '9:16': 64, '1:1': 56}), fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2}} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
