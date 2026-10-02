import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useT} from '@engine/lib/useT';
import {tw, arrive, keys} from '@engine/lib/anim';
import {useFormat, usePick, SAFE} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {Paper, BrushDefs, Brush, Stroke, serif, script, splitMarked} from './_paint';

// S05 · Tagline — serif words land one per beat, the *script* word is written on with a brush underline,
// over a wide terracotta wash. 9:16 wraps into a stacked block.
export const S05: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const safe = SAFE[f.ratio];
  const size = usePick({'16:9': 128, '9:16': 112});
  const words = splitMarked(COPY.S05_tagline);
  let wi = 0;
  const lines: {w: string; hl: boolean; i: number}[][] = [[]];
  for (const w of words) {
    if (w.br) { lines.push([]); continue; }
    lines[lines.length - 1].push({w: w.w, hl: w.hl, i: wi++});
  }
  const n = wi;
  // one word per beat; long lines are compressed so the last word still lands by beat 4
  const step = n > 1 ? Math.min(15, 60 / (n - 1)) : 0;
  const at = (i: number) => Math.round(i * step) - 2;
  const push = 1 + tw(t, -8, 140) * 0.04;
  const washY = f.h / 2 + (f.portrait ? -30 : 10);
  const lastT = at(n - 1);
  return (
    <AbsoluteFill>
      <Paper id="s5" />
      <svg width={f.w} height={f.h} viewBox={`0 0 ${f.w} ${f.h}`} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply'}}>
        <BrushDefs id="s5b" w={f.w} h={f.h} rough={12} />
        <Brush d={`M ${f.w * 0.06} ${washY + 20} C ${f.w * 0.35} ${washY - 30} ${f.w * 0.65} ${washY + 40} ${f.w * 0.94} ${washY - 10}`} w={f.portrait ? 620 : 300} color={C.terracotta} p={tw(t, -6, 22)} fid="s5b" opacity={0.14} />
      </svg>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', padding: `${safe.top}px ${safe.side}px ${safe.bottom}px`, transform: `scale(${push})`}}>
        <div style={{textAlign: 'center', maxWidth: f.w - safe.side * 2}}>
          {lines.map((ln, li) => (
            <div key={li} style={{display: 'flex', justifyContent: 'center', alignItems: 'baseline', flexWrap: 'wrap', gap: `0 ${size * 0.28}px`}}>
              {ln.map((w) => {
                const s = at(w.i);
                if (!w.hl) {
                  return (
                    <span key={w.i} style={{display: 'inline-block', fontFamily: serif(), fontWeight: 700, fontSize: size, lineHeight: 1.14, letterSpacing: '-0.03em', color: C.ink, ...arrive(tw(t, s, 14), 34, 10)}}>
                      {w.w}
                    </span>
                  );
                }
                const pw = tw(t, s, 20);
                const pop = keys(t, [[s, 0.92], [s + 10, 1.05], [s + 18, 1]]);
                return (
                  <span key={w.i} style={{position: 'relative', display: 'inline-block', transform: `scale(${pop}) rotate(-3deg)`}}>
                    <span style={{display: 'inline-block', fontFamily: script(), fontWeight: 700, fontSize: size * 1.5, lineHeight: 1, color: C.terracotta, clipPath: `inset(-30% ${(1 - pw) * 100}% -30% -8%)`}}>{w.w}</span>
                    <svg viewBox="0 0 400 60" preserveAspectRatio="none" style={{position: 'absolute', left: '-6%', width: '112%', bottom: -size * 0.12, height: size * 0.45, overflow: 'visible'}}>
                      <Stroke d="M 6 40 C 120 24 260 30 394 16" w={14} color={C.olive} p={tw(t, s + 14, 14)} />
                      <Stroke d="M 60 52 C 160 44 260 46 340 38" w={7} color={C.olive} p={tw(t, s + 20, 12)} opacity={0.7} />
                    </svg>
                  </span>
                );
              })}
            </div>
          ))}
          <div style={{marginTop: size * 0.5, fontFamily: serif(), fontWeight: 700, fontSize: f.portrait ? 34 : 30, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.ink, opacity: 0.8, ...arrive(tw(t, lastT + 24, 18), 16, 6)}}>
            {COPY.S05_sub}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
