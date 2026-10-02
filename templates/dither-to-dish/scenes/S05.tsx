import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SamiLockup} from '@engine/components/Brand';
import {Words} from '@engine/components/Text';
import {Icon} from '@engine/components/Icon';
import {useT} from '@engine/lib/useT';
import {tw} from '@engine/lib/anim';
import {useFormat} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {OV} from '@engine/core/constants';
import {C} from '@engine/theme';
import {DitherFilter, PIXEL, SANS, beatIdx, alpha} from './kit';

// S05 · End card: a dithered glow behind resolves 24 → 12 → 6 px on beats 0–2; CTA, SAMI lockup, tagline, contacts.
export const S05: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const b = beatIdx(t);
  const cell = [24, 12, 6, 4][Math.min(3, b)];
  const lp = tw(t, 10, 34);
  const tag = tw(t, 45, 12);
  const pill = (s: number) => tw(t, s, 10);
  return (
    <AbsoluteFill style={{background: C.night}}>
      <DitherFilter id="d5" cell={cell} />
      <div style={{position: 'absolute', inset: 0, filter: 'url(#d5)', background: `radial-gradient(60% 50% at 50% ${f.portrait ? 46 : 50}%, ${alpha(C.signal, 0.0)} 0%, ${C.night} 55%), radial-gradient(90% 80% at 50% 50%, ${C.night} 45%, ${alpha(C.cream, 0.42)} 100%)`}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: f.portrait ? 54 : 40, paddingBottom: f.portrait ? 160 : 0}}>
        <div style={{background: C.night, padding: '6px 24px', textAlign: 'center'}}>
          <Words text={COPY.S05_cta} start={OV} stagger={6} hlColor={C.signal} style={{fontFamily: SANS(), fontWeight: 700, fontSize: f.portrait ? 96 : 92, color: C.cream, letterSpacing: '-0.04em', lineHeight: 1}} />
        </div>
        <div style={{background: C.night, padding: '30px 50px', boxShadow: `0 0 0 6px ${C.cream}`, opacity: t >= 8 ? 1 : 0}}>
          <SamiLockup height={f.portrait ? 180 : 170} p={lp} id="d5lk" />
        </div>
        <div style={{fontFamily: SANS(), fontWeight: 500, fontSize: f.portrait ? 34 : 30, color: C.cream, textAlign: 'center', maxWidth: f.portrait ? 900 : 1400, background: C.night, padding: '4px 12px', opacity: tag, transform: `translateY(${(1 - tag) * 14}px)`}}>{COPY.S05_tagline}</div>
        <div style={{display: 'flex', flexDirection: f.portrait ? 'column' : 'row', gap: f.portrait ? 18 : 24, alignItems: 'center'}}>
          {COPY.S05_phone ? (
            <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '16px 30px', background: C.signal, color: C.night, opacity: pill(60), transform: `translateY(${(1 - pill(60)) * 20}px)`}}>
              <Icon name="message" size={34} color={C.night} />
              <span style={{fontFamily: PIXEL(), fontSize: f.portrait ? 36 : 32}}>{COPY.S05_phone}</span>
            </div>
          ) : null}
          {COPY.S05_url ? (
            <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '14px 28px', background: C.night, boxShadow: `0 0 0 4px ${C.cream}`, color: C.cream, opacity: pill(75), transform: `translateY(${(1 - pill(75)) * 20}px)`}}>
              <Icon name="globe" size={32} color={C.cream} />
              <span style={{fontFamily: PIXEL(), fontSize: f.portrait ? 36 : 32}}>{COPY.S05_url}</span>
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
