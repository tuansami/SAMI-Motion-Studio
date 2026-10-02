import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Browser} from '@engine/components/Devices';
import {useT} from '@engine/lib/useT';
import {keys, tw, rnd} from '@engine/lib/anim';
import {useFormat} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {Plate, SiteHero, useSite} from './kit';

// S03 · Object carry: the plate flies in on an arc, tilting from edge-on to flat, and lands in the website hero (squash 1.06 → 1).
export const S03: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const s = useSite();
  const u = tw(t, 2, 36);
  const D = s.spot.d * 1.06;
  const x0 = -D, y0 = f.portrait ? 260 : -D * 0.6;
  const x = x0 + (s.stage.x - x0) * u;
  const y = y0 + (s.stage.y - y0) * u - Math.sin(u * Math.PI) * (f.portrait ? 260 : 220);
  const size = 760 + (D - 760) * u;
  const tilt = 0.28 + 0.72 * tw(t, 14, 24);
  const squash = keys(t, [[37, 1], [41, 0.9], [47, 1.06], [53, 1]]);
  const spin = 520 * u + t * 0.6;
  const rot = (1 - u) * -38;
  const th = Math.max(0.12, tilt);
  const spot = 1 - tw(t, 34, 6);
  const hero = tw(t, 44, 44);
  return (
    <AbsoluteFill style={{background: C.pink}}>
      <div style={{position: 'absolute', left: s.left, top: s.top}}>
        <Browser width={s.bw} height={s.bh} url={COPY.S02_url} dark={false} radius={26} style={{border: `5px solid ${C.ink}`, boxShadow: `0 16px 0 ${C.ink}`}}>
          <SiteHero p={hero} spot={spot} />
        </Browser>
      </div>
      {/* splash dots on landing */}
      {Array.from({length: 10}).map((_, i) => {
        const p = tw(t, 38, 22);
        if (p <= 0 || p >= 1) return null;
        const a = (i / 10) * Math.PI * 2 + rnd(i) * 0.4;
        const d = D * (0.55 + p * (0.35 + rnd(i + 4) * 0.25));
        const r = (16 + rnd(i + 2) * 18) * (1 - p);
        return <div key={i} style={{position: 'absolute', left: s.stage.x + Math.cos(a) * d - r, top: s.stage.y + Math.sin(a) * d - r, width: r * 2, height: r * 2, borderRadius: '50%', background: i % 2 ? C.green : C.ink}} />;
      })}
      <div style={{position: 'absolute', left: x - size / 2, top: y - (size * th) / 2, transform: `rotate(${rot}deg) scaleX(${2 - squash}) scaleY(${squash})`, transformOrigin: '50% 50%'}}>
        <Plate size={size} tilt={tilt} spin={spin} hl={-50 + t * 4} />
      </div>
    </AbsoluteFill>
  );
};
