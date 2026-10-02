import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Words} from '@engine/components/Text';
import {useT} from '@engine/lib/useT';
import {tw, keys, rnd} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {OV} from '@engine/core/constants';
import {C} from '@engine/theme';
import {BG} from './vhs';
import {Heart, Bubble, Plane, Bookmark} from './ui';

const CROPS = ['50% 35%', '20% 60%', '80% 45%'];

/** One vertical reel frame: photo, progress bars, action column, handle + caption. Clean and sharp. */
const Reel: React.FC<{w: number; crop: string; caption: string; t: number; front?: boolean; seg: number}> = ({w, crop, caption, t, front, seg}) => {
  const h = w * (16 / 9);
  const u = w / 400; // unit
  const img = COPY.S04_image;
  const tap = front ? keys(t, [[105, 0], [111, 1.06], [118, 1], [140, 1], [150, 0]]) : 0;
  const liked = front && t >= 107 ? 1 : 0;
  const saved = front && t >= 150 ? 1 : 0;
  const savePop = front ? keys(t, [[150, 1], [155, 1.25], [162, 1]]) : 1;
  const likePop = front ? keys(t, [[107, 1], [112, 1.3], [120, 1]]) : 1;
  const prog = Math.max(0, Math.min(1, (t - 10) / 200));
  return (
    <div style={{width: w, height: h, borderRadius: 28 * u, overflow: 'hidden', position: 'relative', background: C.tapeBlack, boxShadow: `0 ${30 * u}px ${70 * u}px rgba(26,20,16,0.35), 0 0 0 ${2 * u}px rgba(255,255,255,0.6) inset`}}>
      {img && <Img src={staticFile(img)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: crop, transform: `scale(${1.08 + prog * 0.06})`}} />}
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)'}} />
      {/* story-style progress */}
      <div style={{position: 'absolute', top: 16 * u, left: 16 * u, right: 16 * u, display: 'flex', gap: 6 * u}}>
        {[0, 1, 2].map((k) => (
          <div key={k} style={{flex: 1, height: 4 * u, borderRadius: 2 * u, background: 'rgba(255,255,255,0.4)', overflow: 'hidden'}}>
            <div style={{width: `${(k < seg ? 1 : k === seg ? prog : 0) * 100}%`, height: '100%', background: '#fff'}} />
          </div>
        ))}
      </div>
      {/* action column */}
      <div style={{position: 'absolute', right: 18 * u, bottom: 120 * u, display: 'flex', flexDirection: 'column', gap: 26 * u, alignItems: 'center'}}>
        <div style={{transform: `scale(${likePop})`}}><Heart size={44 * u} on={liked} fill={C.tungsten} /></div>
        <Bubble size={42 * u} />
        <Plane size={42 * u} />
        <div style={{transform: `scale(${savePop})`}}><Bookmark size={42 * u} on={saved} fill={C.sky} /></div>
      </div>
      {/* handle + caption */}
      <div style={{position: 'absolute', left: 20 * u, right: 90 * u, bottom: 26 * u, fontFamily: BG, color: '#fff'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12 * u}}>
          <div style={{width: 40 * u, height: 40 * u, borderRadius: '50%', border: `${3 * u}px solid ${C.tungsten}`, background: C.cream}} />
          <span style={{fontWeight: 700, fontSize: 21 * u}}>{COPY.S04_handle}</span>
        </div>
        <div style={{marginTop: 10 * u, fontWeight: 400, fontSize: 22 * u, lineHeight: 1.25}}>{caption}</div>
      </div>
      {/* double-tap heart */}
      {tap > 0 && (
        <div style={{position: 'absolute', left: '50%', top: '42%', transform: `translate(-50%,-50%) scale(${tap})`, opacity: Math.min(1, tap), filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.35))'}}>
          <Heart size={150 * u} on={1} color="#fff" fill="#fff" />
        </div>
      )}
      {/* floating hearts */}
      {front &&
        Array.from({length: 6}).map((_, k) => {
          const s = 110 + k * 9;
          const p = tw(t, s, 40);
          if (p <= 0 || p >= 1) return null;
          return (
            <div key={k} style={{position: 'absolute', right: (26 + (rnd(k + 3) - 0.5) * 40) * u, bottom: (330 + p * 360) * u, opacity: 1 - p, transform: `translateX(${Math.sin(p * 6 + k) * 18 * u}px) scale(${0.6 + rnd(k) * 0.5})`}}>
              <Heart size={34 * u} on={1} fill={k % 2 ? C.tungsten : C.sky} />
            </div>
          );
        })}
    </div>
  );
};

// S04 · The hard contrast: from tape noise to crisp, sharp social content — three reels fan out, a like lands on the beat.
export const S04: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const w = usePick({'16:9': 400, '9:16': 420});
  const spread = usePick({'16:9': 0.56, '9:16': 0.5});
  const flash = 1 - tw(t, 0, 10);
  const head = usePick({'16:9': 90, '9:16': 104});
  const subP = tw(t, 40, 18);
  const cx = f.portrait ? f.w / 2 : 1390;
  const cy = f.portrait ? 1080 : f.h / 2 + 20;
  const open = tw(t, 30, 30) + tw(t, 175, 40) * 0.12;
  const cards = [
    {k: 1, side: -1, start: 12, cap: COPY.S04_cap2},
    {k: 2, side: 1, start: 18, cap: COPY.S04_cap3},
    {k: 0, side: 0, start: 4, cap: COPY.S04_cap1},
  ];
  return (
    <AbsoluteFill style={{background: C.cream}}>
      {/* subtle modern grid */}
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(26,20,16,0.12) 1.4px, transparent 1.5px)', backgroundSize: '44px 44px'}} />
      {/* headline */}
      <div style={{position: 'absolute', left: f.portrait ? 72 : 120, right: f.portrait ? 72 : undefined, top: f.portrait ? 230 : undefined, bottom: f.portrait ? undefined : undefined, width: f.portrait ? undefined : 730, height: f.portrait ? undefined : f.h, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: f.portrait ? 'center' : 'left'}}>
        <Words text={COPY.S04_title} start={10 + OV} stagger={5} dur={18} hlColor={C.vhsBlue} style={{fontFamily: BG, fontWeight: 800, fontSize: head, color: C.tapeBlack, letterSpacing: '-0.04em', lineHeight: 1.0}} />
        <div style={{marginTop: 30, fontFamily: BG, fontWeight: 400, fontSize: f.portrait ? 36 : 36, lineHeight: 1.3, color: C.tapeBlack, opacity: subP * 0.8, transform: `translateY(${(1 - subP) * 20}px)`}}>{COPY.S04_sub}</div>
      </div>
      {/* fan of reels */}
      {cards.map((c) => {
        const p = tw(t, c.start, 20);
        const x = cx + c.side * w * spread * open - w / 2;
        const y = cy - (w * 16) / 9 / 2 + (1 - p) * 700 + Math.abs(c.side) * 40 * open;
        const rot = c.side * 7 * open + (1 - p) * c.side * 14 + Math.sin((t + c.k * 40) / 50) * 1.2;
        const s = c.side === 0 ? 1 : 0.9;
        return (
          <div key={c.k} style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${s})`, transformOrigin: '50% 100%', opacity: Math.min(1, p * 2)}}>
            <Reel w={w} crop={CROPS[c.k]} caption={c.cap} t={t} front={c.side === 0} seg={c.k} />
          </div>
        );
      })}
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
    </AbsoluteFill>
  );
};
