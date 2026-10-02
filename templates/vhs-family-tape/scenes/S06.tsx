import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SamiLockup} from '@engine/components/Brand';
import {Icon} from '@engine/components/Icon';
import {useT} from '@engine/lib/useT';
import {tw, keys, arrive, rnd} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {Osd, Scanlines, Snow, VT, BG, useCorners} from './vhs';

// S06 · End card on the VCR blue screen: SAMI lockup builds, tagline in OSD type, CTA pops, contact pills.
export const S06: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const cn = useCorners();
  const osd = usePick({'16:9': 60, '9:16': 58});
  const lp = tw(t, 6, 34);
  const fr = Math.floor(t);
  const settle = 1 - tw(t, 0, 16);
  const jx = (rnd(fr * 7 + 3) - 0.5) * 30 * settle;
  const cta = keys(t, [[60, 0], [70, 1.06], [78, 1]]);
  const end = tw(t, 222, 16);
  const pill = (s: number): React.CSSProperties => ({...arrive(tw(t, s, 18), 30, 8), display: 'flex', alignItems: 'center', gap: 14, borderRadius: 999, padding: f.portrait ? '18px 34px' : '16px 32px'});
  return (
    <AbsoluteFill style={{background: C.vhsBlue, opacity: 1 - end}}>
      <AbsoluteFill style={{background: 'radial-gradient(70% 60% at 50% 45%, rgba(255,255,255,0.12), transparent 70%)'}} />
      <Scanlines />
      <Osd size={osd} style={{position: 'absolute', left: cn.side, top: cn.top}}>{COPY.S06_osd}</Osd>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: f.portrait ? 54 : 40, transform: `translateX(${jx}px)`, paddingTop: f.portrait ? 0 : 30}}>
        <div style={{transform: `scale(${1.06 - lp * 0.06})`, opacity: Math.min(1, lp * 1.6)}}>
          <SamiLockup height={f.portrait ? 200 : 220} p={lp} id="s06lk" />
        </div>
        <div style={{fontFamily: VT, fontSize: f.portrait ? 52 : 60, color: C.cream, textAlign: 'center', maxWidth: f.w - cn.side * 2, lineHeight: 1.05, textShadow: '3px 3px 0 rgba(0,0,0,0.4)', ...arrive(tw(t, 30, 18), 18, 6)}}>{COPY.S06_tagline}</div>
        {COPY.S06_cta && (
          <div style={{transform: `scale(${cta})`, opacity: Math.min(1, cta * 2), fontFamily: BG, fontWeight: 800, fontSize: f.portrait ? 58 : 62, color: C.tapeBlack, background: C.tungsten, borderRadius: 999, padding: '20px 54px', letterSpacing: '-0.02em', boxShadow: '0 8px 0 rgba(0,0,0,0.25)'}}>
            {COPY.S06_cta}
          </div>
        )}
        <div style={{display: 'flex', flexDirection: f.portrait ? 'column' : 'row', gap: 20, alignItems: 'center'}}>
          {COPY.S06_phone && (
            <div style={{...pill(88), background: '#fff'}}>
              <Icon name="phone" size={34} color={C.vhsBlue} />
              <span style={{fontFamily: BG, fontWeight: 700, fontSize: f.portrait ? 40 : 44, color: C.tapeBlack}}>{COPY.S06_phone}</span>
            </div>
          )}
          {COPY.S06_url && (
            <div style={{...pill(94), border: `3px solid ${C.cream}`}}>
              <Icon name="globe" size={34} color={C.cream} />
              <span style={{fontFamily: BG, fontWeight: 700, fontSize: f.portrait ? 40 : 44, color: '#fff'}}>{COPY.S06_url}</span>
            </div>
          )}
        </div>
      </AbsoluteFill>
      <Snow opacity={t < 4 ? 0.7 : 0} />
    </AbsoluteFill>
  );
};
