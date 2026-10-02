import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {NavyBG} from '@engine/components/Brand';
import {Words} from '@engine/components/Text';
import {Phone} from '@engine/components/Devices';
import {useT} from '@engine/lib/useT';
import {tw, keys} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {OV} from '@engine/core/constants';
import {C, F} from '@engine/theme';

// T04 · Product/website showcase — phone rises with the client's screenshot or photo, which scrolls; headline beside/above.
export const T04: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const rise = tw(t, 4, 26);
  const scroll = keys(t, [[30, 0], [150, 1]]);
  const scale = usePick({'16:9': 1.05, '9:16': 1.3, '1:1': 0.78});
  const img = COPY.T04_image || 'img/placeholder.jpg';
  return (
    <AbsoluteFill>
      <NavyBG />
      <AbsoluteFill style={{flexDirection: f.landscape ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: f.landscape ? 140 : 60, padding: f.portrait ? '200px 60px' : 80}}>
        <div style={{maxWidth: f.landscape ? 760 : f.w * 0.86, textAlign: f.landscape ? 'left' : 'center'}}>
          <Words text={COPY.T04_headline} start={0 + OV} stagger={4} style={{fontSize: usePick({'16:9': 96, '9:16': 92, '1:1': 76})}} />
          <div style={{marginTop: 30, fontFamily: F.ui, fontSize: f.square ? 32 : 38, color: C.muted, opacity: tw(t, 20, 16), transform: `translateY(${(1 - tw(t, 20, 16)) * 20}px)`}}>{COPY.T04_sub}</div>
        </div>
        <div style={{transform: `translateY(${(1 - rise) * 500}px) rotate(${(1 - rise) * 6}deg)`, opacity: rise}}>
          <Phone scale={scale} screenBg="#111">
            <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
              <Img src={staticFile(img)} style={{width: '100%', position: 'absolute', top: 0, transform: `translateY(${-scroll * 35}%)`}} />
            </div>
          </Phone>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
