import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Phone, Touch} from '@engine/components/Devices';
import {useT} from '@engine/lib/useT';
import {keys, tw} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {FR, UI, Plate, PopWords, pop} from './kit';

// S05 · Mobile view: the same site in a phone, scrolls from hero to menu, thumb taps the sticky booking button.
export const S05: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const P = f.portrait;
  const scale = usePick({'16:9': 1.0, '9:16': 1.08});
  const title = usePick({'16:9': 116, '9:16': 104});
  const rise = keys(t, [[0, 1], [16, -0.03], [24, 0]]);
  const scroll = keys(t, [[44, 0], [70, 330]]);
  const tap = keys(t, [[92, 0], [96, 1], [102, 0]]);
  const tapShow = tw(t, 84, 6) * (1 - tw(t, 106, 8));
  const pressed = t >= 95;
  const dishes = [COPY.S04_dish1, COPY.S04_dish2, COPY.S04_dish3];
  const blob = pop(t, 4, 10);
  return (
    <AbsoluteFill style={{background: C.cream}}>
      <div style={{position: 'absolute', left: P ? f.w / 2 - 520 : 1320 - 560, top: P ? 1050 - 520 : f.h / 2 - 520, width: 1040, height: 1040, borderRadius: '48% 52% 44% 56% / 54% 46% 54% 46%', background: C.pink, transform: `scale(${blob}) rotate(${t * 0.3}deg)`}} />
      <div style={{position: 'absolute', left: P ? 72 : 130, right: P ? 72 : undefined, width: P ? undefined : 720, top: P ? 230 : 0, height: P ? undefined : f.h, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
        <PopWords text={COPY.S05_title} start={8} stagger={6} size={title} align={P ? 'center' : 'left'} />
      </div>
      <div style={{position: 'absolute', left: (P ? f.w / 2 : 1320) - (418 * scale) / 2, top: P ? 570 : (f.h - 872 * scale) / 2, transform: `translateY(${rise * 1100}px) rotate(${rise * 10}deg)`}}>
        <Phone scale={scale} screenBg={C.cream}>
          <div style={{position: 'absolute', inset: 0, transform: `translateY(${-scroll}px)`}}>
            {/* nav */}
            <div style={{position: 'absolute', top: 58, left: 0, right: 0, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', borderBottom: `3px solid ${C.ink}`}}>
              <div style={{fontFamily: FR, fontWeight: 700, fontSize: 26, color: C.ink}}>{COPY.S03_brand}</div>
              <div style={{display: 'flex', flexDirection: 'column', gap: 5}}>
                {[0, 1, 2].map((i) => <div key={i} style={{width: 26, height: 4, borderRadius: 2, background: C.ink}} />)}
              </div>
            </div>
            {/* hero */}
            <div style={{position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
              <div style={{position: 'relative'}}>
                <div style={{position: 'absolute', left: -30, top: -20, width: 340, height: 300, borderRadius: '46% 54% 50% 50% / 52% 44% 56% 48%', background: C.green}} />
                <Plate size={280} tilt={1} spin={t * 1.6} hl={-40 + t * 3} />
              </div>
              <div style={{marginTop: 8, fontFamily: UI, fontWeight: 700, fontSize: 13, letterSpacing: '0.2em', color: C.ink, opacity: 0.6}}>{COPY.S03_eyebrow}</div>
              <div style={{fontFamily: FR, fontWeight: 700, fontSize: 58, lineHeight: 1, color: C.ink}}>{COPY.S03_brand}</div>
              <div style={{fontFamily: UI, fontWeight: 500, fontSize: 18, color: C.ink, opacity: 0.8}}>{COPY.S03_tagline}</div>
            </div>
            {/* menu list */}
            <div style={{position: 'absolute', top: 640, left: 22, right: 22, display: 'flex', flexDirection: 'column', gap: 16}}>
              <div style={{fontFamily: FR, fontWeight: 700, fontSize: 34, color: C.ink}}>{COPY.S04_menu}</div>
              {dishes.map((d, i) => (
                <div key={i} style={{display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: `3px solid ${C.ink}`, borderRadius: 22, padding: 10}}>
                  <Plate size={76} tilt={1} spin={i * 100 + t} hl={-30 + i * 50} rim={i === 1 ? C.pink : C.green} />
                  <div style={{fontFamily: FR, fontWeight: 700, fontSize: 26, color: C.ink}}>{d}</div>
                </div>
              ))}
            </div>
          </div>
          {/* sticky booking button */}
          <div style={{position: 'absolute', left: 22, right: 22, bottom: 30, transform: `scale(${1 - tap * 0.06})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FR, fontWeight: 700, fontSize: 26, color: C.ink, background: pressed ? C.green : C.pink, border: `3px solid ${C.ink}`, borderRadius: 999, padding: '16px 0', boxShadow: `0 5px 0 ${C.ink}`}}>
            {pressed ? COPY.S04_done : COPY.S03_cta}
          </div>
          <Touch x={250} y={844 - 62} p={tap} show={tapShow} />
        </Phone>
      </div>
    </AbsoluteFill>
  );
};
