import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Browser} from '@engine/components/Devices';
import {useT} from '@engine/lib/useT';
import {keys, tw, rnd} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {Goo, PopWords, SiteHero, useSite, pop} from './kit';
import {Stage01} from './S01';

const N = 9;

// S02 · Gooey sauce drips down and floods the frame (SVG blur + alpha-threshold filter), headline on the sauce, browser drops in.
export const S02: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const s = useSite();
  const size = usePick({'16:9': 120, '9:16': 104});
  const front = keys(t, [[0, -260], [16, f.h * 0.35], [40, f.h + 420]]);
  const grow = tw(t, 0, 18);
  const covered = t >= 40;
  const by = keys(t, [[68, f.h], [84, -24], [92, 0]]);
  const spot = pop(t, 92, 8);
  return (
    <AbsoluteFill style={{background: C.pink}}>
      {!covered && <Stage01 T={t + 120} />}
      {!covered && (
        <svg width={f.w} height={f.h} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <Goo id="s02goo" blur={18} />
          <g filter="url(#s02goo)" fill={C.pink}>
            <rect x={-200} y={-600} width={f.w + 400} height={Math.max(0, front + 600)} />
            {Array.from({length: N}).map((_, i) => {
              const x = ((i + 0.5) / N) * f.w + (rnd(i + 1) - 0.5) * (f.w / N) * 0.6;
              const r = (f.portrait ? 34 : 42) + rnd(i + 7) * 36;
              const len = (90 + rnd(i + 3) * 300) * grow;
              const drop = (rnd(i + 5) * 120 + 60) * grow;
              return (
                <g key={i}>
                  <rect x={x - r * 0.55} y={front - 30} width={r * 1.1} height={len + 30} rx={r * 0.5} />
                  <circle cx={x} cy={front + len} r={r} />
                  <circle cx={x + r * 0.2} cy={front + len + r + drop} r={r * 0.55} />
                </g>
              );
            })}
          </g>
        </svg>
      )}
      {/* headline on the sauce */}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', padding: f.portrait ? '0 70px' : '0 160px'}}>
        <PopWords text={COPY.S02_title} start={24} stagger={5} size={size} align="center" hl={C.cream} out={64} />
      </AbsoluteFill>
      {/* browser drops in */}
      <div style={{position: 'absolute', left: s.left, top: s.top + by, transform: `rotate(${(by / f.h) * -6}deg)`}}>
        <Browser width={s.bw} height={s.bh} url={COPY.S02_url} urlTyped={(t - 84) * 0.8} dark={false} radius={26} style={{border: `5px solid ${C.ink}`, boxShadow: `0 16px 0 ${C.ink}`}}>
          <SiteHero p={0} spot={spot} />
        </Browser>
      </div>
    </AbsoluteFill>
  );
};
