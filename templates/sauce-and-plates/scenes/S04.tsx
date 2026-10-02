import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Cursor} from '@engine/components/Devices';
import {Icon} from '@engine/components/Icon';
import {useT} from '@engine/lib/useT';
import {keys, tw} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {FR, UI, Plate, PopWords, pop} from './kit';

const card = (): React.CSSProperties => ({position: 'relative', background: C.cream, border: `5px solid ${C.ink}`, borderRadius: 36, boxShadow: `0 14px 0 ${C.ink}`, boxSizing: 'border-box', overflow: 'hidden'});
const Head: React.FC<{icon: string; text: string; bg: string; size: number}> = ({icon, text, bg, size}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: size * 0.35}}>
    <div style={{width: size * 1.35, height: size * 1.35, borderRadius: '50%', background: bg, border: `4px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
      <Icon name={icon} size={size * 0.75} color={C.ink} stroke={2.4} />
    </div>
    <div style={{fontFamily: FR, fontWeight: 700, fontSize: size, color: C.ink, lineHeight: 1}}>{text}</div>
  </div>
);

// S04 · The site's sections pop out as cards on the beat: menu, table booking (button gets clicked), map with a dropping pin.
export const S04: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const P = f.portrait;
  const title = usePick({'16:9': 86, '9:16': 78});
  const cw = P ? 920 : 540;
  const ch = P ? 300 : 620;
  const hs = P ? 40 : 46;
  const dishes = [COPY.S04_dish1, COPY.S04_dish2, COPY.S04_dish3];
  const press = keys(t, [[118, 1], [122, 0.92], [128, 1.06], [134, 1]]);
  const done = t >= 122;
  const cur = tw(t, 96, 22);
  const pinY = keys(t, [[62, -400], [74, 8], [80, 0]]);
  const pinS = keys(t, [[73, 1], [76, 0.86], [82, 1]]);
  const cards = [0, 1, 2].map((i) => pop(t, 15 + i * 15, 9));
  const tiltDeg = [-3, 2, -2];

  const menu = (
    <div style={{...card(), width: cw, height: ch, padding: P ? '24px 34px' : '40px 40px', display: 'flex', flexDirection: 'column', gap: P ? 16 : 34}}>
      <Head icon="book" text={COPY.S04_menu} bg={C.pink} size={hs} />
      <div style={{display: 'flex', flexDirection: P ? 'row' : 'column', gap: P ? 20 : 30, justifyContent: P ? 'space-between' : 'flex-start'}}>
        {dishes.map((d, i) => {
          const p = pop(t, 30 + i * 6, 7);
          return (
            <div key={i} style={{display: 'flex', flexDirection: P ? 'column' : 'row', alignItems: 'center', gap: P ? 8 : 24, transform: `scale(${p})`, flex: P ? 1 : undefined}}>
              <Plate size={P ? 120 : 110} tilt={1} spin={i * 90 + t * 1.5} hl={-40 + i * 60} rim={i === 1 ? C.pink : C.green} />
              <div style={{fontFamily: FR, fontWeight: 700, fontSize: P ? 30 : 38, color: C.ink, whiteSpace: 'nowrap'}}>{d}</div>
              {!P && <div style={{flex: 1, borderBottom: `4px dotted ${C.ink}`, opacity: 0.35, minWidth: 30}} />}
            </div>
          );
        })}
      </div>
    </div>
  );

  const pills = [
    {i: 'calendar', v: COPY.S04_day},
    {i: 'clock', v: COPY.S04_time},
    {i: 'users', v: COPY.S04_people},
  ];
  const booking = (
    <div style={{...card(), width: cw, height: ch, padding: P ? '24px 34px' : '40px 40px', display: 'flex', flexDirection: 'column', gap: P ? 16 : 26}}>
      <Head icon="calendar" text={COPY.S04_book} bg={C.green} size={hs} />
      <div style={{display: 'flex', flexDirection: P ? 'row' : 'column', gap: P ? 14 : 16}}>
        {pills.map((p, k) => (
          <div key={k} style={{display: 'flex', alignItems: 'center', gap: 12, border: `4px solid ${C.ink}`, borderRadius: 999, padding: P ? '8px 18px' : '14px 24px', fontFamily: UI, fontWeight: 600, fontSize: P ? 24 : 30, color: C.ink, background: '#fff', transform: `scale(${pop(t, 36 + k * 5, 6)})`, transformOrigin: 'left center'}}>
            <Icon name={p.i} size={P ? 24 : 30} color={C.ink} stroke={2.4} />
            <span style={{whiteSpace: 'nowrap'}}>{p.v}</span>
          </div>
        ))}
      </div>
      <div style={{position: 'relative', marginTop: P ? 0 : 'auto', alignSelf: 'stretch'}}>
        <div style={{transform: `scale(${press})`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, fontFamily: FR, fontWeight: 700, fontSize: P ? 32 : 38, color: C.ink, background: done ? C.green : C.pink, border: `4px solid ${C.ink}`, borderRadius: 999, padding: P ? '10px 0' : '18px 0', boxShadow: `0 6px 0 ${C.ink}`}}>
          {done && <Icon name="check" size={P ? 32 : 38} color={C.ink} stroke={3} />}
          <span>{done ? COPY.S04_done : COPY.S04_btn}</span>
        </div>
        {t > 90 && t < 160 && <Cursor x={cw * 0.55 + (1 - cur) * 220} y={(P ? 20 : 30) + (1 - cur) * 160} press={t >= 118 && t < 126 ? 1 : 0} opacity={Math.min(1, tw(t, 92, 6)) * (1 - tw(t, 146, 10))} scale={1.4} />}
      </div>
    </div>
  );

  const map = (
    <div style={{...card(), width: cw, height: ch, padding: P ? '24px 34px' : '40px 40px', display: 'flex', flexDirection: P ? 'row' : 'column', gap: P ? 26 : 26}}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 16, width: P ? 380 : undefined, justifyContent: 'center'}}>
        <Head icon="pin" text={COPY.S04_map} bg={C.pink} size={P ? 34 : hs} />
        <div style={{fontFamily: UI, fontWeight: 600, fontSize: P ? 26 : 28, color: C.ink, opacity: 0.75}}>{COPY.S04_addr}</div>
      </div>
      <div style={{position: 'relative', flex: 1, borderRadius: 24, border: `4px solid ${C.ink}`, background: '#fff', overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: '-10%', top: '55%', width: '60%', height: '70%', borderRadius: '50%', background: C.green, opacity: 0.7}} />
        <div style={{position: 'absolute', right: '-15%', top: '-20%', width: '45%', height: '60%', borderRadius: '50%', background: C.pink, opacity: 0.35}} />
        <div style={{position: 'absolute', left: '-10%', right: '-10%', top: '46%', height: 18, background: C.cream, borderTop: `3px solid ${C.ink}`, borderBottom: `3px solid ${C.ink}`, transform: 'rotate(-12deg)'}} />
        <div style={{position: 'absolute', top: '-10%', bottom: '-10%', left: '58%', width: 16, background: C.cream, borderLeft: `3px solid ${C.ink}`, borderRight: `3px solid ${C.ink}`, transform: 'rotate(8deg)'}} />
        <div style={{position: 'absolute', left: '50%', top: '42%', transform: `translate(-50%, -100%) translateY(${pinY}px) scaleY(${pinS})`, transformOrigin: '50% 100%'}}>
          <svg width={P ? 60 : 80} height={P ? 78 : 104} viewBox="0 0 40 52">
            <path d="M20 50C20 50 4 32 4 19a16 16 0 0 1 32 0c0 13-16 31-16 31z" fill={C.pink} stroke={C.ink} strokeWidth="3.5" strokeLinejoin="round" />
            <circle cx="20" cy="19" r="6" fill={C.cream} stroke={C.ink} strokeWidth="3" />
          </svg>
        </div>
      </div>
    </div>
  );

  const els = [menu, booking, map];
  return (
    <AbsoluteFill style={{background: C.green}}>
      <AbsoluteFill style={{backgroundImage: `radial-gradient(rgba(45,42,50,0.12) 3px, transparent 3.5px)`, backgroundSize: '56px 56px'}} />
      <div style={{position: 'absolute', left: 72, right: 72, top: P ? 230 : 70}}>
        <PopWords text={COPY.S04_title} start={0} stagger={4} size={title} align="center" />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: P ? 530 : 330, display: 'flex', flexDirection: P ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: P ? 34 : 46}}>
        {els.map((el, i) => (
          <div key={i} style={{transform: `scale(${cards[i]}) rotate(${tiltDeg[i] * Math.min(1, cards[i])}deg)`, opacity: Math.min(1, cards[i] * 3)}}>
            {el}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
