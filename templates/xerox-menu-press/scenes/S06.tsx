import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SamiLockup} from '@engine/components/Brand';
import {Icon} from '@engine/components/Icon';
import {useT} from '@engine/lib/useT';
import {tw} from '@engine/lib/anim';
import {useFormat} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {Paper, RegMarks, PressFilters, DISPLAY, MONO, beatIdx, stamp, fitSize, alpha} from './kit';

// S06 · End card: CTA line stamps on beat 0, the SAMI lockup builds on a solid ink panel (beat 1),
// tagline beat 3, WhatsApp + website beats 4–5. Holds for reading.
export const S06: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const b = beatIdx(t);
  const cta = stamp(t, 0);
  const panel = stamp(t, 15);
  const lp = tw(t, 17, 34);
  const tag = tw(t, 45, 12);
  const pill = (s: number) => tw(t, s, 10);
  const pw = f.portrait ? 900 : 980;
  const ctaFs = fitSize([String(COPY.S06_cta || '').toUpperCase()], pw, f.portrait ? 76 : 70);
  const ghost = 3 + 12 * (1 - tw(t, 2, 12));
  return (
    <AbsoluteFill>
      <Paper />
      <PressFilters id="x6" seed={b + 81} />
      <RegMarks />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: f.portrait ? 50 : 36, paddingTop: f.portrait ? 60 : 0, paddingBottom: f.portrait ? 200 : 0}}>
        <div style={{position: 'relative', filter: 'url(#x6-ink)', transform: `scale(${cta.scale})`, opacity: cta.on ? 1 : 0, textAlign: 'center', width: pw}}>
          <div style={{position: 'absolute', left: 0, right: 0, fontFamily: DISPLAY(), fontSize: ctaFs, lineHeight: 1.05, color: C.blue, textTransform: 'uppercase', transform: `translate(${ghost}px, ${ghost * 0.6}px)`, mixBlendMode: 'multiply', whiteSpace: 'nowrap'}}>{COPY.S06_cta}</div>
          <div style={{position: 'relative', fontFamily: DISPLAY(), fontSize: ctaFs, lineHeight: 1.05, color: C.red, textTransform: 'uppercase', mixBlendMode: 'multiply', whiteSpace: 'nowrap'}}>{COPY.S06_cta}</div>
        </div>
        <div style={{width: pw, padding: f.portrait ? '70px 0' : '60px 0', background: C.ink, display: 'flex', justifyContent: 'center', transform: `scale(${panel.scale})`, opacity: panel.on ? 1 : 0, boxShadow: `14px 14px 0 ${C.red}`}}>
          <SamiLockup height={f.portrait ? 190 : 180} p={lp} id="x6lk" />
        </div>
        <div style={{fontFamily: MONO(), fontWeight: 600, fontSize: f.portrait ? 30 : 26, letterSpacing: '0.06em', color: C.ink, textAlign: 'center', maxWidth: f.portrait ? 900 : 1400, opacity: tag, transform: `translateY(${(1 - tag) * 14}px)`}}>{COPY.S06_tagline}</div>
        <div style={{display: 'flex', flexDirection: f.portrait ? 'column' : 'row', gap: f.portrait ? 18 : 24, alignItems: 'center'}}>
          {COPY.S06_phone ? (
            <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '16px 30px', background: C.red, color: C.sheet, opacity: pill(60), transform: `translateY(${(1 - pill(60)) * 20}px)`}}>
              <Icon name="message" size={34} color={C.sheet} />
              <span style={{fontFamily: MONO(), fontWeight: 600, fontSize: f.portrait ? 38 : 34}}>{COPY.S06_phone}</span>
            </div>
          ) : null}
          {COPY.S06_url ? (
            <div style={{display: 'flex', alignItems: 'center', gap: 14, padding: '14px 28px', border: `3px solid ${C.ink}`, color: C.ink, opacity: pill(75), transform: `translateY(${(1 - pill(75)) * 20}px)`, background: alpha(C.sheet, 0.6)}}>
              <Icon name="globe" size={32} color={C.ink} />
              <span style={{fontFamily: MONO(), fontWeight: 600, fontSize: f.portrait ? 38 : 34}}>{COPY.S06_url}</span>
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
