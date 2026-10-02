import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useT} from '@engine/lib/useT';
import {tw, arrive} from '@engine/lib/anim';
import {useFormat, usePick, SAFE} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {Paper, BrushDefs, Stroke, Brush, Hand, serif, script, splitMarked, arcD} from './_paint';

// S01 · Blank canvas — pencil construction lines sketch themselves, the opening line lands on the beats,
// and the first real brush stroke (underline) is the cue into the logo painting.
export const S01: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const safe = SAFE[f.ratio];
  const cx = f.w / 2;
  const cy = f.h / 2 + (f.portrait ? -40 : 0);
  const R = usePick({'16:9': 400, '9:16': 430});
  const size = usePick({'16:9': 96, '9:16': 86});
  const push = 1 + tw(t, -8, 90) * 0.03;
  const words = splitMarked(COPY.S01_title);
  let wi = 0;
  const lines: {w: string; hl: boolean; i: number}[][] = [[]];
  for (const w of words) {
    if (w.br) { lines.push([]); continue; }
    lines[lines.length - 1].push({w: w.w, hl: w.hl, i: wi++});
  }
  const ul = tw(t, 34, 16);
  return (
    <AbsoluteFill>
      <Paper id="s1" />
      <AbsoluteFill style={{transform: `scale(${push})`}}>
        <svg width={f.w} height={f.h} viewBox={`0 0 ${f.w} ${f.h}`} style={{position: 'absolute', inset: 0}}>
          <BrushDefs id="s1b" w={f.w} h={f.h} />
          <g opacity={0.32}>
            <Stroke d={arcD(cx, cy, R, -90, 270)} w={2.2} color={C.ink} p={tw(t, -4, 34)} filter="s1bw" />
            <Stroke d={arcD(cx, cy, R * 0.62, 200, 520)} w={1.6} color={C.ink} p={tw(t, 6, 30)} filter="s1bw" opacity={0.7} />
            <Stroke d={`M ${cx - R * 1.25} ${cy} L ${cx + R * 1.25} ${cy}`} w={1.8} color={C.ink} p={tw(t, 0, 24)} filter="s1bw" />
            <Stroke d={`M ${cx} ${cy - R * 1.2} L ${cx} ${cy + R * 1.2}`} w={1.8} color={C.ink} p={tw(t, 4, 24)} filter="s1bw" />
            <Stroke d={`M ${cx - R * 0.9} ${cy - R * 0.9} L ${cx + R * 0.9} ${cy + R * 0.9}`} w={1.2} color={C.ink} p={tw(t, 10, 22)} filter="s1bw" opacity={0.6} />
          </g>
          {/* registration ticks in the corners */}
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], k) => {
            const x = cx + sx * R * 1.15;
            const y = cy + sy * R * 1.15;
            return (
              <g key={k} opacity={0.4}>
                <Stroke d={`M ${x - 22} ${y} L ${x + 22} ${y}`} w={2} color={C.ink} p={tw(t, 12 + k * 3, 10)} />
                <Stroke d={`M ${x} ${y - 22} L ${x} ${y + 22}`} w={2} color={C.ink} p={tw(t, 14 + k * 3, 10)} />
              </g>
            );
          })}
        </svg>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div style={{textAlign: 'center', marginTop: f.portrait ? -80 : 0}}>
            {lines.map((ln, li) => (
              <div key={li} style={{display: 'flex', justifyContent: 'center', alignItems: 'baseline', flexWrap: 'wrap', gap: `0 ${size * 0.26}px`, maxWidth: f.w - safe.side * 2}}>
                {ln.map((w) => {
                  const p = tw(t, 2 + w.i * 6, 14);
                  return (
                    <span key={w.i} style={{position: 'relative', display: 'inline-block', ...arrive(p, 26, 8)}}>
                      <span style={{fontFamily: w.hl ? script() : serif(), fontWeight: w.hl ? 700 : 700, fontSize: w.hl ? size * 1.42 : size, lineHeight: 1.12, letterSpacing: w.hl ? 0 : '-0.025em', color: w.hl ? C.terracotta : C.ink}}>{w.w}</span>
                      {w.hl && (
                        <svg width={size * 4} height={size * 0.5} viewBox="0 0 400 50" preserveAspectRatio="none" style={{position: 'absolute', left: '-4%', bottom: -size * 0.12, width: '108%', overflow: 'visible'}}>
                          <Stroke d="M 6 30 C 120 18 260 22 394 14" w={13} color={C.olive} p={ul} filter="s1br" />
                        </svg>
                      )}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </AbsoluteFill>
        <div style={{position: 'absolute', left: safe.side, top: safe.top + (f.portrait ? 0 : 20)}}>
          <Hand text={COPY.S01_note} p={tw(t, 8, 20)} size={f.portrait ? 54 : 48} color={C.ink} style={{opacity: 0.7}} />
        </div>
      </AbsoluteFill>
      {/* a single loaded-brush dab in the corner: the first colour on the page */}
      <svg width={f.w} height={f.h} viewBox={`0 0 ${f.w} ${f.h}`} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply'}}>
        <BrushDefs id="s1c" w={f.w} h={f.h} />
        <Brush d={`M ${f.w - safe.side - 220} ${f.h - safe.bottom - 40} C ${f.w - safe.side - 150} ${f.h - safe.bottom - 60} ${f.w - safe.side - 80} ${f.h - safe.bottom - 50} ${f.w - safe.side - 10} ${f.h - safe.bottom - 70}`} w={34} color={C.terracotta} p={tw(t, 44, 12)} fid="s1c" />
      </svg>
    </AbsoluteFill>
  );
};
