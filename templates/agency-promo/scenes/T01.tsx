import React from 'react';
import {AbsoluteFill} from 'remotion';
import {NavyBG} from '@engine/components/Brand';
import {Words, TypeLabel} from '@engine/components/Text';
import {useT} from '@engine/lib/useT';
import {tw} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {OV} from '@engine/core/constants';
import {C} from '@engine/theme';

// T01 · Hook — label types on, headline lands word by word on the beat, slow push-in.
export const T01: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const size = usePick({'16:9': 168, '9:16': 132, '1:1': 128});
  const push = 1 + tw(t, 0, 150) * 0.05;
  return (
    <AbsoluteFill>
      <NavyBG />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', padding: f.portrait ? 80 : 120, transform: `scale(${push})`}}>
        <div style={{textAlign: 'center'}}>
          <TypeLabel text={COPY.T01_label} start={4 + OV} cps={1.3} style={{fontSize: f.portrait ? 30 : 30, marginBottom: 36, color: C.mint}} />
          <Words text={COPY.T01_headline} start={14 + OV} stagger={7} dur={16} style={{fontSize: size, letterSpacing: '-0.045em'}} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
