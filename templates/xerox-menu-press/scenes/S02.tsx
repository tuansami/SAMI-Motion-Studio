import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Words} from '@engine/components/Text';
import {useT} from '@engine/lib/useT';
import {tw} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {OV} from '@engine/core/constants';
import {C} from '@engine/theme';
import {Paper, RegMarks, PressFilters, useSheet, DISPLAY, MONO, beatIdx, alpha, fitSize} from './kit';

// S02 · The dish goes through 3 copy passes, each one lands on a beat:
// pass 1 (beat 2) crushed photocopy · pass 2 (beat 5) halftone dots · pass 3 (beat 8) two riso plates that drift out of register (beats 9–11).
const PASS = [30, 75, 120];

export const S02: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const sh = useSheet();
  const b = beatIdx(t);
  const src = staticFile(COPY.S02_image || 'img/placeholder_dish.jpg');
  const state = t >= PASS[2] ? 3 : t >= PASS[1] ? 2 : t >= PASS[0] ? 1 : 0;
  // scanner bar sweeps during the beat BEFORE each pass; region above the bar already shows the next state
  const scanK = PASS.findIndex((p) => t >= p - 15 && t < p);
  const scanP = scanK >= 0 ? (t - (PASS[scanK] - 15)) / 15 : 0;
  // riso plates drift out of register, one step per beat
  const off = [0, 7, 14, 22][Math.max(0, Math.min(3, b - 8))] * (t >= PASS[2] ? 1 : 0);
  const pad = 36;
  const pw = sh.w - pad * 2;
  const ph = Math.round(pw * (f.portrait ? 1.0 : 1.02));
  const kick = 1 + 0.025 * [0, 1, 2, 3][state];
  const jit = (PASS.some((p) => t >= p && t < p + 3) ? 3 : 0) * (b % 2 ? 1 : -1);

  const layer = (s: number) => {
    const base: React.CSSProperties = {position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'};
    if (s === 0) return <Img src={src} style={base} />;
    if (s === 1) return <Img src={src} style={{...base, filter: 'url(#x2-copy)'}} />;
    if (s === 2) return <Img src={src} style={{...base, filter: 'url(#x2-dots)'}} />;
    return (
      <div style={{position: 'absolute', inset: 0, background: C.sheet}}>
        <Img src={src} style={{...base, filter: 'url(#x2-blue)', mixBlendMode: 'multiply', transform: `translate(${off}px, ${off * 0.5}px)`}} />
        <Img src={src} style={{...base, filter: 'url(#x2-red)', mixBlendMode: 'multiply', transform: `translate(${-off}px, ${-off * 0.4}px)`}} />
      </div>
    );
  };
  const prev = scanK >= 0 ? scanK : -1;

  const counter = (
    <div style={{fontFamily: MONO(), color: C.ink}}>
      <div style={{fontSize: usePick({'16:9': 22, '9:16': 26}), fontWeight: 600, letterSpacing: '0.2em'}}>{COPY.S02_pass}</div>
      <div style={{fontFamily: DISPLAY(), fontSize: usePick({'16:9': 150, '9:16': 64}), lineHeight: 1, marginTop: 8, display: 'flex'}}>
        <span style={{color: state === 3 ? C.red : C.ink}}>{Math.max(1, state)}</span>
        <span style={{opacity: 0.35}}>/3</span>
      </div>
    </div>
  );

  return (
    <AbsoluteFill>
      <Paper />
      <PressFilters id="x2" seed={b + 3} dot={f.portrait ? 15 : 13} />
      <RegMarks />
      {/* sheet */}
      <div style={{position: 'absolute', left: sh.x, top: sh.y, width: sh.w, height: sh.h, background: C.sheet, boxShadow: `0 30px 60px ${alpha(C.ink, 0.18)}`, transform: `translate(${jit}px, 0) scale(${kick})`}}>
        <div style={{position: 'absolute', left: pad, top: pad, width: pw, height: ph, overflow: 'hidden', background: C.sheet}}>
          {state === 0 && t < PASS[0] - 15 ? layer(0) : null}
          {prev >= 0 ? (
            <>
              {layer(prev)}
              <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 0 ${(1 - scanP) * 100}% 0)`}}>{layer(prev + 1)}</div>
              <div style={{position: 'absolute', left: -20, right: -20, top: `${scanP * 100}%`, height: 46, marginTop: -23, background: `linear-gradient(180deg, transparent, ${alpha(C.blue, 0.55)}, transparent)`}} />
            </>
          ) : state > 0 ? (
            layer(state)
          ) : null}
        </div>
        <div style={{position: 'absolute', left: pad, right: pad, top: pad + ph + 22, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontFamily: MONO(), fontSize: 18, fontWeight: 600, letterSpacing: '0.18em', color: C.ink, opacity: 0.75}}>
          <span>{COPY.S01_counter}</span>
          <span>{`${COPY.S02_pass} ${Math.max(1, state)}/3`}</span>
        </div>
        <div style={{position: 'absolute', left: pad, right: pad, top: pad + ph + 62, fontFamily: DISPLAY(), fontSize: fitSize([String(COPY.S02_dish || '')], pw, f.portrait ? 92 : 76), lineHeight: 1, color: state === 3 ? C.red : C.ink, whiteSpace: 'nowrap', filter: 'url(#x2-ink)'}}>
          {COPY.S02_dish}
        </div>
        <div style={{position: 'absolute', left: pad, right: pad, bottom: pad, height: 10, background: state === 3 ? C.red : C.ink, transform: `scaleX(${state / 3})`, transformOrigin: '0 50%'}} />
      </div>
      {/* side columns (16:9) / top + bottom bands (9:16) */}
      {f.portrait ? (
        <>
          <div style={{position: 'absolute', left: 72, top: 226, opacity: tw(t, 0, 10)}}>
            <div style={{display: 'flex', gap: 18, alignItems: 'baseline', fontFamily: MONO(), fontWeight: 600, fontSize: 26, letterSpacing: '0.2em', color: C.ink}}>
              <span>{COPY.S02_pass}</span>
              <span style={{color: state === 3 ? C.red : C.ink}}>{`${Math.max(1, state)}/3`}</span>
            </div>
          </div>
          <div style={{position: 'absolute', left: 72, right: 72, top: sh.y + sh.h + 44}}>
            <Words text={COPY.S02_caption} start={OV + 6} stagger={5} hlColor={C.red} style={{fontFamily: DISPLAY(), fontWeight: 400, fontSize: 64, color: C.ink, letterSpacing: '-0.01em', lineHeight: 1.02}} />
          </div>
        </>
      ) : (
        <>
          <div style={{position: 'absolute', left: 120, top: 380, opacity: tw(t, 0, 10)}}>{counter}</div>
          <div style={{position: 'absolute', left: sh.x + sh.w + 70, right: 96, top: 380}}>
            <Words text={COPY.S02_caption} start={OV + 6} stagger={5} hlColor={C.red} style={{fontFamily: DISPLAY(), fontWeight: 400, fontSize: 52, color: C.ink, letterSpacing: '-0.01em', lineHeight: 1.04}} />
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
