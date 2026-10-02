import React from 'react';
import {AbsoluteFill} from 'remotion';
import {NavyBG} from '@engine/components/Brand';
import {Words, Chip} from '@engine/components/Text';
import {Icon} from '@engine/components/Icon';
import {useT} from '@engine/lib/useT';
import {tw, arrive} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {OV} from '@engine/core/constants';

// T05 · Offer — big offer line, then 3 chips land on the beat.
export const T05: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const chips = [COPY.T05_chip1, COPY.T05_chip2, COPY.T05_chip3].filter(Boolean);
  return (
    <AbsoluteFill>
      <NavyBG glow={1.2} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 56, padding: 80, transform: `scale(${1 + tw(t, 30, 120) * 0.04})`}}>
        <Words text={COPY.T05_offer} start={0 + OV} stagger={5} dur={16} style={{fontSize: usePick({'16:9': 140, '9:16': 120, '1:1': 110}), textAlign: 'center'}} />
        <div style={{display: 'flex', flexDirection: f.portrait ? 'column' : 'row', gap: 20, alignItems: 'center'}}>
          {chips.map((c, i) => (
            <div key={i} style={arrive(tw(t, 24 + i * 8, 16), 26, 8)}>
              <Chip style={{fontSize: f.portrait ? 44 : 30, padding: f.portrait ? '24px 40px' : '18px 32px', whiteSpace: 'nowrap'}}><Icon name="check" size={30} /> {c}</Chip>
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
