import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useT} from '@engine/lib/useT';
import {tw} from '@engine/lib/anim';
import {useFormat} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {Paper, RegMarks, PressFilters, DISPLAY, MONO, beatIdx, stamp, fitSize} from './kit';

// S03 · Menu typography stamps in: three words on beats 1·3·5, each with a blue plate that lands off-register and settles;
// round "NEU" stamp on beat 7, mono sub-line on beat 8. Ink texture re-seeds every beat (toner boil).
const AT = [15, 45, 75];

export const S03: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const b = beatIdx(t);
  const words = [COPY.S03_word1, COPY.S03_word2, COPY.S03_word3].map((w) => String(w || ''));
  const colW = f.portrait ? 936 : 1180;
  const fs = fitSize(words, colW, f.portrait ? 160 : 200, 0.7);
  const kick = String(COPY.S03_kicker || '');
  const kn = Math.floor(Math.max(0, t) * 1.6);
  const bd = stamp(t, 105);
  const sub = tw(t, 120, 12);
  const badgeD = f.portrait ? 250 : 300;
  const shake = [15, 45, 75, 105].some((s) => t >= s && t < s + 3) ? (b % 2 ? 4 : -4) : 0;

  const stack = (
    <div style={{display: 'flex', flexDirection: 'column', gap: fs * 0.02, width: colW, alignSelf: 'center'}}>
      {words.map((w, i) => {
        const s = stamp(t, AT[i]);
        if (!s.on) return <div key={i} style={{height: fs * 0.98}} />;
        const ghost = 4 + 16 * (1 - tw(t, AT[i] + 2, 12));
        return (
          <div key={i} style={{position: 'relative', height: fs * 0.98, transform: `scale(${s.scale})`, transformOrigin: f.portrait ? '50% 60%' : '0% 60%'}}>
            <div style={{position: 'absolute', left: 0, right: 0, top: 0, fontFamily: DISPLAY(), fontSize: fs, lineHeight: 1, color: C.blue, mixBlendMode: 'multiply', transform: `translate(${ghost}px, ${ghost * 0.6}px)`, whiteSpace: 'nowrap', textAlign: f.portrait ? 'center' : 'left', opacity: 0.9}}>
              {w}
            </div>
            <div style={{position: 'absolute', left: 0, right: 0, top: 0, fontFamily: DISPLAY(), fontSize: fs, lineHeight: 1, color: i === 2 ? C.red : C.ink, whiteSpace: 'nowrap', textAlign: f.portrait ? 'center' : 'left'}}>
              {w}
            </div>
          </div>
        );
      })}
    </div>
  );

  const badge = (
    <div style={{width: badgeD, height: badgeD, borderRadius: '50%', background: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: bd.on ? 1 : 0, transform: `scale(${bd.scale}) rotate(-12deg)`, mixBlendMode: 'multiply', boxShadow: `inset 0 0 0 ${badgeD * 0.04}px ${C.sheet}, inset 0 0 0 ${badgeD * 0.065}px ${C.red}`}}>
      <span style={{fontFamily: DISPLAY(), fontSize: fitSize([String(COPY.S03_badge || '')], badgeD * 0.7, badgeD * 0.36), color: C.sheet, lineHeight: 1}}>{COPY.S03_badge}</span>
    </div>
  );

  return (
    <AbsoluteFill>
      <Paper />
      <PressFilters id="x3" seed={b + 21} />
      <RegMarks />
      <AbsoluteFill style={{filter: 'url(#x3-ink)', transform: `translate(${shake}px, 0)`}}>
        {f.portrait ? (
          <div style={{position: 'absolute', left: 72, right: 72, top: 250, bottom: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 34}}>
            <div style={{fontFamily: MONO(), fontWeight: 600, fontSize: 28, letterSpacing: '0.22em', color: C.ink}}>{kick.slice(0, kn)}</div>
            {stack}
            {badge}
            <div style={{fontFamily: MONO(), fontSize: 32, lineHeight: 1.35, color: C.ink, textAlign: 'center', opacity: sub, transform: `translateY(${(1 - sub) * 16}px)`}}>{COPY.S03_sub}</div>
          </div>
        ) : (
          <>
            <div style={{position: 'absolute', left: 150, top: 215, fontFamily: MONO(), fontWeight: 600, fontSize: 26, letterSpacing: '0.22em', color: C.ink}}>{kick.slice(0, kn)}</div>
            <div style={{position: 'absolute', left: 150, top: 280, width: colW}}>{stack}</div>
            <div style={{position: 'absolute', right: 170, top: 330}}>{badge}</div>
            <div style={{position: 'absolute', left: 150, top: 280 + fs * 3.02 + 40, width: 1200, fontFamily: MONO(), fontSize: 30, color: C.ink, opacity: sub, transform: `translateY(${(1 - sub) * 16}px)`}}>{COPY.S03_sub}</div>
          </>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
