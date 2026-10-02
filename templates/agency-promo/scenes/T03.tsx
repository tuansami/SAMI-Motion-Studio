import React from 'react';
import {AbsoluteFill} from 'remotion';
import {NavyBG, Card} from '@engine/components/Brand';
import {Words} from '@engine/components/Text';
import {Icon} from '@engine/components/Icon';
import {useT} from '@engine/lib/useT';
import {tw, arrive} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {OV} from '@engine/core/constants';
import {C, F, GRAD} from '@engine/theme';

// T03 · Three benefits — cards arrive one per beat; row on landscape, stack on portrait.
const ICONS = ['zap', 'calendar', 'trend'];
export const T03: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const items = [COPY.T03_item1, COPY.T03_item2, COPY.T03_item3];
  const cw = usePick({'16:9': 470, '9:16': 860, '1:1': 900});
  const ch = usePick({'16:9': 340, '9:16': 250, '1:1': 170});
  return (
    <AbsoluteFill>
      <NavyBG />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: f.portrait ? 70 : 60, padding: 80}}>
        <Words text={COPY.T03_title} start={0 + OV} stagger={4} style={{fontSize: usePick({'16:9': 96, '9:16': 104, '1:1': 88}), textAlign: 'center'}} />
        <div style={{display: 'flex', flexDirection: f.landscape ? 'row' : 'column', gap: f.square ? 22 : 34}}>
          {items.map((it, i) => {
            const q = tw(t, 15 + i * 15, 18);
            return (
              <div key={i} style={arrive(q, 50, 12)}>
                <Card style={{width: cw, height: ch, padding: f.square ? '28px 36px' : 44, display: 'flex', flexDirection: f.landscape ? 'column' : 'row', alignItems: f.landscape ? 'flex-start' : 'center', gap: 28}}>
                  <div style={{width: 88, height: 88, borderRadius: 26, background: GRAD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transform: `scale(${0.6 + tw(t, 19 + i * 15, 14) * 0.4})`}}>
                    <Icon name={ICONS[i]} size={46} color={C.navyDeep} stroke={2.4} />
                  </div>
                  <div style={{fontFamily: F.head, fontWeight: 700, fontSize: f.square ? 44 : 50, lineHeight: 1.15, letterSpacing: '-0.02em', color: C.text}}>{it}</div>
                </Card>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
