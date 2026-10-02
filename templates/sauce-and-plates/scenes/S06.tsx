import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SamiLockup} from '@engine/components/Brand';
import {Icon} from '@engine/components/Icon';
import {useT} from '@engine/lib/useT';
import {tw, arrive, rnd} from '@engine/lib/anim';
import {useFormat} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {Goo, FR, UI} from './kit';

// S06 · End card: ink background, gooey sauce blobs melt together around the edges, SAMI lockup + tagline + contact.
export const S06: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const lp = tw(t, 2, 32);
  const end = tw(t, 106, 14);
  const grow = tw(t, -6, 26);
  const blobs = (seed: number, n: number) =>
    Array.from({length: n}).map((_, i) => {
      const k = seed + i;
      const edge = i % 4;
      const along = rnd(k) * (edge % 2 ? f.h : f.w);
      const wob = Math.sin(t / 18 + k) * 40;
      const x = edge === 0 ? along : edge === 2 ? along : edge === 1 ? f.w + wob - 30 : -wob + 30;
      const y = edge === 0 ? -wob + 20 : edge === 2 ? f.h + wob - 20 : along;
      const r = (90 + rnd(k + 3) * 130) * grow;
      return <circle key={i} cx={x} cy={y} r={r} />;
    });
  const pill = (s: number): React.CSSProperties => ({...arrive(tw(t, s, 16), 30, 8), display: 'flex', alignItems: 'center', gap: 14, borderRadius: 999, padding: f.portrait ? '18px 34px' : '16px 32px'});
  return (
    <AbsoluteFill style={{background: C.ink, opacity: 1 - end}}>
      <svg width={f.w} height={f.h} style={{position: 'absolute', inset: 0}}>
        <Goo id="s06goo" blur={20} />
        <g filter="url(#s06goo)" fill={C.pink}>{blobs(11, 12)}</g>
        <g filter="url(#s06goo)" fill={C.green}>{blobs(51, 8)}</g>
      </svg>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: f.portrait ? 60 : 44}}>
        <div style={{transform: `scale(${1.06 - lp * 0.06})`, opacity: Math.min(1, lp * 1.6)}}>
          <SamiLockup height={f.portrait ? 200 : 210} p={lp} id="s06sp" />
        </div>
        <div style={{fontFamily: UI, fontWeight: 600, fontSize: f.portrait ? 38 : 40, color: C.cream, textAlign: 'center', maxWidth: f.w - 160, ...arrive(tw(t, 22, 16), 18, 8)}}>{COPY.S06_tagline}</div>
        <div style={{display: 'flex', flexDirection: f.portrait ? 'column' : 'row', gap: 20, alignItems: 'center'}}>
          {COPY.S06_phone && (
            <div style={{...pill(36), background: C.pink, border: `4px solid ${C.cream}`}}>
              <Icon name="phone" size={36} color={C.ink} stroke={2.4} />
              <span style={{fontFamily: FR, fontWeight: 700, fontSize: 42, color: C.ink}}>{COPY.S06_phone}</span>
            </div>
          )}
          {COPY.S06_url && (
            <div style={{...pill(42), border: `4px solid ${C.cream}`}}>
              <Icon name="globe" size={36} color={C.cream} stroke={2.4} />
              <span style={{fontFamily: FR, fontWeight: 700, fontSize: 42, color: C.cream}}>{COPY.S06_url}</span>
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
