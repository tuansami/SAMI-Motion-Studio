import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useT} from '@engine/lib/useT';
import {tw} from '@engine/lib/anim';
import {useFormat} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {Paper, RegMarks, PressFilters, DISPLAY, MONO, beatIdx, stamp, fitSize, alpha} from './kit';

// S04 · Price list in riso overprint: a blue plate (names, rules, halftone sun) and a red plate (title block, prices, highlight bar).
// Rows print on beats 0–3; the plates wander out of register on each beat and lock into register on beat 6.
const OFF: [number, number][] = [[26, -14], [18, 10], [-14, 8], [10, -6], [-6, 4], [4, -2], [0, 0]];

export const S04: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const b = beatIdx(t);
  const [ox, oy] = OFF[Math.min(OFF.length - 1, b)];
  const snap = tw(t, b * 15, 4); // every beat the plate jumps (fast) to its new offset
  const [px, py] = OFF[Math.max(0, Math.min(OFF.length - 1, b - 1))];
  const dx = px + (ox - px) * snap, dy = py + (oy - py) * snap;
  const items = [1, 2, 3, 4].map((i) => ({name: String(COPY[`S04_item${i}`] || ''), price: String(COPY[`S04_price${i}`] || '')}));
  const cur = COPY.S04_currency ? ` ${COPY.S04_currency}` : '';
  const W = f.portrait ? 936 : 1240;
  const left = (f.w - W) / 2;
  const top = f.portrait ? 300 : 110;
  const titleFs = fitSize([String(COPY.S04_title || '')], W, f.portrait ? 120 : 136);
  const rowH = f.portrait ? 190 : 136;
  const nameFs = fitSize(items.map((x) => x.name), W * 0.66, f.portrait ? 52 : 58);
  const priceFs = f.portrait ? 50 : 54;
  const rowsTop = top + titleFs + (f.portrait ? 110 : 80);

  // one plate = the full sheet drawn in a single colour; `part` decides which elements this plate prints
  const plate = (part: 'blue' | 'red') => {
    const col = part === 'blue' ? C.blue : C.red;
    const show = (s: number) => stamp(t, s);
    return (
      <AbsoluteFill style={{mixBlendMode: 'multiply', transform: part === 'blue' ? `translate(${dx}px, ${dy}px)` : `translate(${-dx * 0.4}px, ${-dy * 0.4}px)`}}>
        {part === 'blue' && (
          <div style={{position: 'absolute', width: f.portrait ? 520 : 620, height: f.portrait ? 520 : 620, borderRadius: '50%', right: f.portrait ? -160 : -120, top: f.portrait ? 120 : -200, backgroundImage: `radial-gradient(${col} 34%, transparent 37%)`, backgroundSize: '18px 18px', WebkitMaskImage: 'radial-gradient(closest-side, #000 40%, transparent 100%)', opacity: tw(t, 0, 10)}} />
        )}
        {/* title: red block with knocked-out letters on the red plate, solid letters on the blue plate */}
        <div style={{position: 'absolute', left, top, width: W, height: titleFs * 1.05, transform: `scaleX(${tw(t, -2, 8)})`, transformOrigin: '0 50%'}}>
          {part === 'red' ? <div style={{position: 'absolute', left: -20, right: W - (String(COPY.S04_title || '').length * titleFs * 0.78 + 20), top: titleFs * 0.5, bottom: -titleFs * 0.08, background: col, minWidth: 200}} /> : null}
          {part === 'blue' ? <div style={{position: 'absolute', left: 0, top: 0, fontFamily: DISPLAY(), fontSize: titleFs, lineHeight: 1, color: col, whiteSpace: 'nowrap'}}>{COPY.S04_title}</div> : null}
        </div>
        {items.map((it, i) => {
          const s = show(i * 15 + 4);
          const y = rowsTop + i * rowH;
          if (!s.on) return null;
          return (
            <div key={i} style={{position: 'absolute', left, width: W, top: y, height: rowH, transform: `scale(${1 + (s.scale - 1) * 0.25})`, transformOrigin: '50% 50%'}}>
              {part === 'red' && i === 1 ? <div style={{position: 'absolute', left: -24, right: -24, top: rowH * 0.12, bottom: rowH * 0.12, background: alpha(C.red, 0.85)}} /> : null}
              <div style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 20}}>
                <span style={{fontFamily: DISPLAY(), fontSize: nameFs, color: part === 'blue' ? col : 'transparent', whiteSpace: 'nowrap'}}>{it.name}</span>
                <span style={{flex: 1, height: 0, borderBottom: `5px dotted ${part === 'blue' ? col : 'transparent'}`, transform: 'translateY(14px)'}} />
                <span style={{fontFamily: MONO(), fontWeight: 600, fontSize: priceFs, color: part === 'red' ? (i === 1 ? C.sheet : col) : 'transparent', whiteSpace: 'nowrap'}}>{it.price + cur}</span>
              </div>
              {part === 'blue' ? <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: col, opacity: 0.6}} /> : null}
            </div>
          );
        })}
      </AbsoluteFill>
    );
  };

  return (
    <AbsoluteFill>
      <Paper />
      <PressFilters id="x4" seed={b + 41} />
      <RegMarks />
      <AbsoluteFill style={{filter: 'url(#x4-ink)'}}>
        {plate('blue')}
        {plate('red')}
      </AbsoluteFill>
      <div style={{position: 'absolute', left, width: W, top: rowsTop + 4 * rowH + 34, display: 'flex', justifyContent: 'space-between', fontFamily: MONO(), fontSize: f.portrait ? 26 : 22, letterSpacing: '0.12em', color: C.ink, opacity: tw(t, 60, 10)}}>
        <span>{COPY.S04_note}</span>
      </div>
    </AbsoluteFill>
  );
};
