import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Words, Counter} from '@engine/components/Text';
import {useT} from '@engine/lib/useT';
import {tw, keys} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {OV} from '@engine/core/constants';
import {C} from '@engine/theme';
import {BG, VT} from './vhs';
import {Heart, Bookmark, Person} from './ui';

// S05 · Sample counters (clearly labelled "Beispielwerte"): three cards pop on the beat, numbers roll.
export const S05: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const head = usePick({'16:9': 104, '9:16': 100});
  const items = [
    {n: COPY.S05_n1, pre: COPY.S05_p1, l: COPY.S05_l1, icon: Person},
    {n: COPY.S05_n2, pre: '', l: COPY.S05_l2, icon: Heart},
    {n: COPY.S05_n3, pre: '', l: COPY.S05_l3, icon: Bookmark},
  ];
  const cw = f.portrait ? 900 : 500;
  const ch = f.portrait ? 270 : 400;
  const num = f.portrait ? 120 : 132;
  const noteP = tw(t, 70, 16);
  return (
    <AbsoluteFill style={{background: C.sky}}>
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(255,255,255,0.22) 1.4px, transparent 1.5px)', backgroundSize: '44px 44px'}} />
      <AbsoluteFill style={{flexDirection: 'column', alignItems: 'center', justifyContent: f.portrait ? 'flex-start' : 'center', paddingTop: f.portrait ? 240 : 0, gap: f.portrait ? 60 : 70}}>
        <div style={{textAlign: 'center', padding: '0 72px'}}>
          <Words text={COPY.S05_title} start={4 + OV} stagger={5} dur={18} hlColor={C.cream} style={{fontFamily: BG, fontWeight: 800, fontSize: head, color: C.tapeBlack, letterSpacing: '-0.04em', lineHeight: 1.0}} />
        </div>
        <div style={{display: 'flex', flexDirection: f.portrait ? 'column' : 'row', gap: f.portrait ? 30 : 44}}>
          {items.map((it, i) => {
            const s = 30 + i * 15;
            const pop = keys(t, [[s, 0], [s + 10, 1.06], [s + 18, 1]]);
            const val = parseInt(String(it.n).replace(/\D/g, ''), 10) || 0;
            const Ico = it.icon;
            const bar = tw(t, s + 6, 60);
            return (
              <div key={i} style={{width: cw, height: ch, borderRadius: 36, background: C.cream, boxShadow: '0 30px 60px rgba(26,20,16,0.22)', transform: `scale(${pop}) rotate(${(1 - Math.min(1, pop)) * (i - 1) * 6}deg)`, opacity: Math.min(1, pop * 2), display: 'flex', flexDirection: f.portrait ? 'row' : 'column', alignItems: f.portrait ? 'center' : 'flex-start', justifyContent: f.portrait ? 'flex-start' : 'space-between', padding: f.portrait ? '0 50px' : '44px 46px', gap: f.portrait ? 40 : 0, boxSizing: 'border-box'}}>
                <div style={{width: 96, height: 96, borderRadius: 28, background: C.tapeBlack, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                  <Ico size={54} color={C.cream} on={1} fill={C.tungsten} />
                </div>
                <div style={{flex: f.portrait ? 1 : undefined, width: f.portrait ? undefined : '100%'}}>
                  <div style={{fontFamily: BG, fontWeight: 800, fontSize: num, lineHeight: 0.95, color: C.tapeBlack, letterSpacing: '-0.045em'}}>
                    <Counter to={val} start={s + 4 + OV} dur={56} prefix={String(it.pre || '')} />
                  </div>
                  <div style={{marginTop: 10, fontFamily: BG, fontWeight: 700, fontSize: 34, color: C.tapeBlack, opacity: 0.75}}>{it.l}</div>
                  <div style={{marginTop: 16, height: 8, borderRadius: 4, background: 'rgba(26,20,16,0.12)', overflow: 'hidden'}}>
                    <div style={{width: `${bar * 100}%`, height: '100%', background: C.tungsten}} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{opacity: noteP, transform: `translateY(${(1 - noteP) * 16}px)`, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 26px', borderRadius: 999, border: `3px dashed ${C.tapeBlack}`, fontFamily: VT, fontSize: 44, color: C.tapeBlack}}>
          <span>*</span>
          <span>{COPY.S05_note}</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
