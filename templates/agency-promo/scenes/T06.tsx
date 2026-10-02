import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {NavyBG, SamiLockup} from '@engine/components/Brand';
import {Icon, WhatsApp} from '@engine/components/Icon';
import {useT} from '@engine/lib/useT';
import {tw, arrive} from '@engine/lib/anim';
import {useFormat} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C, F} from '@engine/theme';

// T06 · End card — logo (client logo image, or the SAMI lockup), tagline, contact pills. Fades out at the very end.
export const T06: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const lp = tw(t, -4, 30);
  const logo = COPY.T06_logo;
  const end = tw(t, 135, 14);
  return (
    <AbsoluteFill style={{opacity: 1 - end}}>
      <NavyBG glow={1.1} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: f.portrait ? 70 : 44, transform: `scale(${1 + tw(t, 20, 130) * 0.03})`}}>
        <div style={{transform: `scale(${1.06 - lp * 0.06})`, opacity: Math.min(1, lp * 1.5)}}>
          {logo ? <Img src={staticFile(logo)} style={{height: f.portrait ? 240 : 200, objectFit: 'contain'}} /> : <SamiLockup height={f.portrait ? 200 : 190} p={lp} id="t6lk" />}
        </div>
        <div style={{fontFamily: F.ui, fontWeight: 600, fontSize: f.portrait ? 40 : 34, color: C.text, textAlign: 'center', maxWidth: f.w * 0.86, ...arrive(tw(t, 24, 18), 18, 8)}}>{COPY.T06_tagline}</div>
        <div style={{display: 'flex', flexDirection: f.portrait ? 'column' : 'row', gap: 20, alignItems: 'center', marginTop: 20}}>
          {COPY.T06_phone && (
            <div style={{...arrive(tw(t, 45, 18), 30, 8), display: 'flex', alignItems: 'center', gap: 14, background: '#fff', borderRadius: 999, padding: '18px 34px'}}>
              <WhatsApp size={40} /><span style={{fontFamily: F.ui, fontWeight: 700, fontSize: 38, color: C.navy}}>{COPY.T06_phone}</span>
            </div>
          )}
          {COPY.T06_url && (
            <div style={{...arrive(tw(t, 49, 18), 30, 8), display: 'flex', alignItems: 'center', gap: 14, borderRadius: 999, padding: '18px 34px', border: `2px solid ${C.mint}`}}>
              <Icon name="globe" size={34} color={C.mint} /><span style={{fontFamily: F.ui, fontWeight: 700, fontSize: 38, color: C.text}}>{COPY.T06_url}</span>
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
