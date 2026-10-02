import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SamiLockup} from '@engine/components/Brand';
import {Icon} from '@engine/components/Icon';
import {useT} from '@engine/lib/useT';
import {tw} from '@engine/lib/anim';
import {useFormat} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {SquashText, fitAnton, UI, days} from './kit';

// S05 · End card on ink: a row of 7 day-blocks fills sun-yellow one per 2 frames (beat 0), CTA squashes in,
// SAMI lockup builds (beat 1), tagline (beat 3), WhatsApp + website (beats 4–5).
export const S05: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const cta = String(COPY.S05_cta || '').toUpperCase();
  const fs = fitAnton(cta, f.portrait ? 900 : 1500, f.portrait ? 150 : 150);
  const lp = tw(t, 15, 34);
  const tag = tw(t, 45, 12);
  const pill = (s: number) => tw(t, s, 10);
  const D = days();
  const bw = f.portrait ? 110 : 120;
  return (
    <AbsoluteFill style={{background: C.ink, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: f.portrait ? 54 : 40, paddingBottom: f.portrait ? 150 : 0}}>
      <div style={{display: 'flex', gap: 10}}>
        {D.map((d, i) => {
          const p = tw(t, i * 2, 6);
          return (
            <div key={i} style={{width: bw, height: f.portrait ? 64 : 56, position: 'relative', boxShadow: `inset 0 0 0 3px ${C.paper}`}}>
              <div style={{position: 'absolute', inset: 0, background: i === D.length - 1 ? C.tomato : C.sun, transform: `scaleX(${p})`, transformOrigin: '0 50%'}} />
              <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: UI(), fontWeight: 800, fontSize: 26, color: C.ink, textTransform: 'uppercase'}}>{d}</div>
            </div>
          );
        })}
      </div>
      <SquashText text={cta} t={t} start={4} step={1} fs={fs} color={C.sun} pulses={[60, 90]} />
      <div style={{opacity: t >= 13 ? 1 : 0}}>
        <SamiLockup height={f.portrait ? 180 : 170} p={lp} id="g5lk" />
      </div>
      <div style={{fontFamily: UI(), fontWeight: 600, fontSize: f.portrait ? 34 : 30, color: C.paper, textAlign: 'center', maxWidth: f.portrait ? 900 : 1400, opacity: tag, transform: `translateY(${(1 - tag) * 14}px)`}}>{COPY.S05_tagline}</div>
      <div style={{display: 'flex', flexDirection: f.portrait ? 'column' : 'row', gap: f.portrait ? 18 : 24, alignItems: 'center'}}>
        {COPY.S05_phone ? (
          <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '16px 30px', background: C.sun, color: C.ink, opacity: pill(60), transform: `translateY(${(1 - pill(60)) * 20}px)`}}>
            <Icon name="message" size={34} color={C.ink} />
            <span style={{fontFamily: UI(), fontWeight: 800, fontSize: f.portrait ? 38 : 34}}>{COPY.S05_phone}</span>
          </div>
        ) : null}
        {COPY.S05_url ? (
          <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '13px 28px', boxShadow: `inset 0 0 0 3px ${C.paper}`, color: C.paper, opacity: pill(75), transform: `translateY(${(1 - pill(75)) * 20}px)`}}>
            <Icon name="globe" size={32} color={C.paper} />
            <span style={{fontFamily: UI(), fontWeight: 800, fontSize: f.portrait ? 38 : 34}}>{COPY.S05_url}</span>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
