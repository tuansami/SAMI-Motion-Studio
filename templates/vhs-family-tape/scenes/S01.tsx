import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {useT} from '@engine/lib/useT';
import {tw, rnd} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {Vhs, Osd, Snow, Scanlines, VT, useCorners, timecode} from './vhs';

// S01 · Tape starts: blue screen "PLAY ▶" → snow burst → the tape: big year types in, REC blinks, timecode runs.
export const S01: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const cn = useCorners();
  const yearSize = usePick({'16:9': 330, '9:16': 300});
  const titleSize = usePick({'16:9': 84, '9:16': 80});
  const osd = usePick({'16:9': 64, '9:16': 60});
  const year = String(COPY.S01_year);
  const nYear = Math.max(0, Math.min(year.length, Math.floor((t - 30) / 4) + 1));
  const lines = String(COPY.S01_title).split('/').map((s) => s.trim());
  const img = COPY.S02_image;
  const blue = t < 15;
  const snow = t >= 15 && t < 25 ? 1 : t > 108 ? tw(t, 108, 6) * 0.8 : 0;
  const push = 1 + tw(t, 25, 100) * 0.06;
  const recOn = Math.floor(t / 15) % 2 === 0;

  const content = () => (
    <AbsoluteFill style={{background: C.tapeBlack}}>
      {img && <Img src={staticFile(img)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 30%', filter: 'brightness(0.32) blur(3px)', transform: `scale(${1.15 * push})`}} />}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: f.portrait ? 30 : 10}}>
        <div style={{fontFamily: VT, fontSize: yearSize, lineHeight: 0.9, color: C.cream, letterSpacing: '0.02em', transform: `scale(${push})`}}>
          {year.slice(0, nYear)}
          <span style={{opacity: nYear < year.length || Math.floor(t / 8) % 2 ? 1 : 0, color: C.tungsten}}>_</span>
        </div>
        <div style={{textAlign: 'center'}}>
          {lines.map((l, i) => {
            const p = tw(t, 62 + i * 15, 10);
            return (
              <div key={i} style={{fontFamily: VT, fontSize: titleSize, lineHeight: 1.05, color: i === lines.length - 1 ? C.tungsten : C.cream, opacity: p > 0.02 ? (rnd(Math.floor(t) + i) > 0.15 * (1 - p) ? 1 : 0.3) : 0, transform: `translateX(${(1 - p) * 30}px)`}}>
                {l}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill style={{background: C.vhsBlue}}>
      {blue ? (
        <>
          <Scanlines />
          <Osd size={osd} style={{position: 'absolute', left: cn.side, top: cn.top}}>{COPY.S01_play}</Osd>
        </>
      ) : (
        <>
          <Vhs id="s01v" render={content} split={6} band={t > 40 ? 1 : 0.4} bandSpeed={11} />
          <Osd size={osd} style={{position: 'absolute', left: cn.side, top: cn.top}}>{COPY.S01_play}</Osd>
          <div style={{position: 'absolute', right: cn.side, top: cn.top, display: 'flex', alignItems: 'center', gap: 16}}>
            <div style={{width: osd * 0.42, height: osd * 0.42, borderRadius: '50%', background: C.tungsten, opacity: recOn ? 1 : 0.15, boxShadow: '0 0 18px rgba(255,120,60,0.8)'}} />
            <Osd size={osd}>{COPY.S01_rec}</Osd>
          </div>
          <Osd size={osd * 0.8} style={{position: 'absolute', left: cn.side, bottom: cn.bottom}}>{timecode(0, Math.max(0, t - 25))}</Osd>
          <Osd size={osd * 0.8} color={C.tungsten} style={{position: 'absolute', right: cn.side, bottom: cn.bottom}}>{COPY.S01_date}</Osd>
        </>
      )}
      <Snow opacity={snow} />
    </AbsoluteFill>
  );
};
