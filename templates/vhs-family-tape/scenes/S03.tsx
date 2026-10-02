import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useT} from '@engine/lib/useT';
import {tw, keys, rnd} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {Vhs, Osd, Snow, Scrim, VT, useCorners, timecode} from './vhs';
import {FamilyCrop} from './S02';

const SLICES = 7;

// S03 · Freeze-frame "PAUSE", then fast-forward scrub: picture tears into slices, the year rolls 1998 → 2026.
export const S03: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const cn = useCorners();
  const osd = usePick({'16:9': 60, '9:16': 58});
  const yearSize = usePick({'16:9': 300, '9:16': 250});
  const ff = t >= 20;
  const fr = Math.floor(t);
  const from = parseInt(String(COPY.S03_from), 10) || 1998;
  const to = parseInt(String(COPY.S03_to), 10) || 2026;
  const roll = keys(t, [[22, 0], [48, 0.25], [72, 0.8], [88, 1]]);
  const year = Math.round(from + (to - from) * roll);
  const land = keys(t, [[86, 1], [90, 1.08], [100, 1]]);
  const tear = ff ? Math.min(1, tw(t, 20, 10)) * (1 - tw(t, 96, 14) * 0.7) : 0;
  const crop = ff ? 2 - (Math.floor((t - 20) / 5) % 3) : 2;
  const shakeY = !ff && fr % 2 ? 3 : 0;
  const pause = !ff && Math.floor(t / 8) % 2 === 0;
  const yOn = tw(t, 20, 6);
  const lineP = tw(t, 92, 12);

  const content = () => (
    <AbsoluteFill style={{transform: `translateY(${shakeY}px)`, filter: ff ? `brightness(${1 + tear * 0.25}) saturate(${1 - tear * 0.3})` : undefined}}>
      {!ff ? (
        <FamilyCrop i={2} p={1} />
      ) : (
        Array.from({length: SLICES}).map((_, k) => {
          const h = f.h / SLICES;
          const dx = (rnd(fr * 13 + k * 7) - 0.5) * 160 * tear + (k % 2 ? 1 : -1) * 30 * tear;
          return (
            <AbsoluteFill key={k} style={{clipPath: `inset(${k * h}px 0 ${f.h - (k + 1) * h}px 0)`, transform: `translateX(${dx}px)`}}>
              <FamilyCrop i={crop} p={(t % 5) / 5} />
            </AbsoluteFill>
          );
        })
      )}
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill style={{background: C.tapeBlack}}>
      <Vhs id="s03v" render={content} split={ff ? 14 * tear + 6 : 6} jitter={ff ? 2.2 : 0} band={ff ? 1 : 0.5} bandSpeed={ff ? 48 : 0} freeze={!ff} />
      <Scrim />
      {ff && <AbsoluteFill style={{background: 'rgba(0,0,0,0.5)', opacity: yOn}} />}
      {/* OSD */}
      <Osd size={osd} style={{position: 'absolute', left: cn.side, top: cn.top, opacity: ff ? 1 : pause ? 1 : 0.2}}>{ff ? COPY.S03_ff : COPY.S03_pause}</Osd>
      <Osd size={osd * 0.85} style={{position: 'absolute', right: cn.side, top: cn.top}}>{timecode(12, ff ? 20 + (t - 20) * 60 : t)}</Osd>
      {/* big rolling year */}
      {ff && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, opacity: yOn}}>
          <div style={{display: 'flex', alignItems: 'center', gap: yearSize * 0.12, transform: `scale(${land})`}}>
            <span style={{fontFamily: VT, fontSize: yearSize * 0.55, color: C.tungsten, textShadow: '5px 5px 0 rgba(0,0,0,0.6)', opacity: Math.floor(t / 4) % 2 || t > 90 ? 1 : 0.4}}>{COPY.S03_ff}</span>
            <span style={{fontFamily: VT, fontSize: yearSize, lineHeight: 0.9, color: '#fff', textShadow: '6px 6px 0 rgba(0,0,0,0.6)', fontVariantNumeric: 'tabular-nums'}}>{year}</span>
          </div>
          <div style={{fontFamily: VT, fontSize: yearSize * 0.32, color: C.cream, textShadow: '4px 4px 0 rgba(0,0,0,0.6)', opacity: lineP, transform: `translateY(${(1 - lineP) * 30}px)`}}>{COPY.S03_line}</div>
        </AbsoluteFill>
      )}
      <Snow opacity={t > 110 ? tw(t, 110, 8) : 0} />
    </AbsoluteFill>
  );
};
