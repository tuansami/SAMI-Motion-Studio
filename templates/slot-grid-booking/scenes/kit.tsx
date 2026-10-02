import React from 'react';
import {useFormat} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {tw, rnd} from '@engine/lib/anim';
import {C, F} from '@engine/theme';

// Slot Grid Booking · shared kit — the week grid (days × time slots) in both layouts, fill order, squash letters.
// 16:9: days are columns, times are rows. 9:16: transposed (days are rows) so the grid stays tall and readable.
// Colours from project.json → brand.colors (sun, ink, paper, tomato); fonts from brand.fonts (display, ui).

export const BEAT = 15;
export const beatIdx = (t: number) => Math.floor(Math.max(0, t) / BEAT);
export const DISPLAY = () => F.display || 'Anton, sans-serif';
export const UI = () => F.ui || 'Inter, sans-serif';

export const days = (): string[] => String(COPY.S01_days || '').split(/\s+/).filter(Boolean).slice(0, 7);
export const times = (): string[] => String(COPY.S01_times || '').split(/\s+/).filter(Boolean).slice(0, 6);
/** the booked slot: day index + time index (from copy, falls back to Fr / 3rd slot) */
export const target = () => {
  const d = Math.max(0, days().indexOf(String(COPY.S03_dayshort || '')));
  const s = Math.max(0, times().indexOf(String(COPY.S03_time || '')));
  return {d: days().indexOf(String(COPY.S03_dayshort || '')) >= 0 ? d : Math.min(4, days().length - 1), s: times().indexOf(String(COPY.S03_time || '')) >= 0 ? s : Math.min(2, times().length - 1)};
};

export type Rect = {x: number; y: number; w: number; h: number};
export const useGrid = () => {
  const f = useFormat();
  const D = Math.max(1, days().length), T = Math.max(1, times().length);
  const area = f.portrait ? {x: 72, y: 540, w: 936, h: 960} : {x: 96, y: 300, w: 1728, h: 700};
  const lab = f.portrait ? {col: 128, row: 64} : {col: 190, row: 76};
  const cols = f.portrait ? T : D, rows = f.portrait ? D : T;
  const cw = (area.w - lab.col) / cols, ch = (area.h - lab.row) / rows;
  const cell = (d: number, s: number): Rect => {
    const c = f.portrait ? s : d, r = f.portrait ? d : s;
    return {x: area.x + lab.col + c * cw, y: area.y + lab.row + r * ch, w: cw, h: ch};
  };
  const dayLab = (d: number): Rect => (f.portrait ? {x: area.x, y: area.y + lab.row + d * ch, w: lab.col, h: ch} : {x: area.x + lab.col + d * cw, y: area.y, w: cw, h: lab.row});
  const timeLab = (s: number): Rect => (f.portrait ? {x: area.x + lab.col + s * cw, y: area.y, w: cw, h: lab.row} : {x: area.x, y: area.y + lab.row + s * ch, w: lab.col, h: ch});
  return {f, area, lab, cols, rows, cw, ch, cell, dayLab, timeLab, D, T};
};

/** every slot except the target, in a fixed pseudo-random order; colour per slot */
export const fillOrder = () => {
  const D = days().length, T = times().length, tg = target();
  const all: {d: number; s: number; k: number; col: 'sun' | 'tomato' | 'ink'}[] = [];
  for (let d = 0; d < D; d++) for (let s = 0; s < T; s++) if (!(d === tg.d && s === tg.s)) {
    const r = rnd(d * 31 + s * 7 + 3);
    all.push({d, s, k: rnd(d * 13 + s * 17 + 1), col: r < 0.5 ? 'sun' : r < 0.78 ? 'tomato' : 'ink'});
  }
  return all.sort((a, b) => a.k - b.k);
};
/** how many slots are booked at scene-2 time t (stepped per beat) */
export const BOOKED = [3, 7, 11, 15, 19, 23, 26, 28];
export const bookedAt = (t: number) => (t < 0 ? 0 : BOOKED[Math.min(BOOKED.length - 1, beatIdx(t))]);

/** grid rules + labels. p = 0..1 draw-on of the rules; labels fade in by `lp` */
export const GridFrame: React.FC<{p?: number; lp?: number; color?: string; hl?: {d: number; s: number} | null}> = ({p = 1, lp = 1, color, hl}) => {
  const g = useGrid();
  const col = color || C.ink;
  const lw = 6;
  const hs: React.ReactNode[] = [];
  for (let r = 0; r <= g.rows; r++) {
    const y = g.area.y + g.lab.row + r * g.ch;
    hs.push(<div key={'h' + r} style={{position: 'absolute', left: g.area.x, top: y - lw / 2, width: g.area.w, height: lw, background: col, transform: `scaleX(${tw(p * 30, r * 1.2, 8)})`, transformOrigin: '0 50%'}} />);
  }
  for (let c = 0; c <= g.cols; c++) {
    const x = g.area.x + g.lab.col + c * g.cw;
    hs.push(<div key={'v' + c} style={{position: 'absolute', top: g.area.y, left: x - lw / 2, height: g.area.h, width: lw, background: col, transform: `scaleY(${tw(p * 30, 6 + c * 1.2, 8)})`, transformOrigin: '50% 0'}} />);
  }
  const fs = g.f.portrait ? 40 : 44;
  const tfs = g.f.portrait ? 30 : 34;
  return (
    <>
      {hs}
      {days().map((d, i) => {
        const r = g.dayLab(i);
        const on = hl && hl.d === i;
        return (
          <div key={'d' + i} style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, display: 'flex', alignItems: 'center', justifyContent: g.f.portrait ? 'flex-start' : 'center', fontFamily: DISPLAY(), fontSize: fs, color: on ? C.tomato : col, opacity: Math.min(1, Math.max(0, lp * 8 - i)), textTransform: 'uppercase'}}>
            {d}
          </div>
        );
      })}
      {times().map((tm, i) => {
        const r = g.timeLab(i);
        const on = hl && hl.s === i;
        return (
          <div key={'t' + i} style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, display: 'flex', alignItems: 'center', justifyContent: g.f.portrait ? 'center' : 'flex-start', fontFamily: UI(), fontWeight: 800, fontSize: tfs, color: on ? C.tomato : col, opacity: Math.min(1, Math.max(0, lp * 6 - i)), letterSpacing: '-0.02em'}}>
            {tm}
          </div>
        );
      })}
    </>
  );
};

/** one booked cell: colour block that stretch-fills from the left edge (p 0..1) */
export const CellFill: React.FC<{r: Rect; p: number; color: string; inset?: number}> = ({r, p, color, inset = 3}) => (
  <div style={{position: 'absolute', left: r.x + inset, top: r.y + inset, width: r.w - inset * 2, height: r.h - inset * 2, background: color, transform: `scaleX(${p})`, transformOrigin: '0 50%'}} />
);

/**
 * Squash/stretch type: each letter enters tall and thin (scaleY ↑, scaleX ↓) and snaps to normal; on every `pulses`
 * frame the letters squash flat for a few frames (landing on the beat). `sy` = resting vertical stretch.
 */
export const SquashText: React.FC<{text: string; t: number; start: number; step?: number; fs: number; color: string; sy?: number; pulses?: number[]; style?: React.CSSProperties}> = ({text, t, start, step = 1.5, fs, color, sy = 1, pulses = [], style}) => {
  const chars = Array.from(text);
  return (
    <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: DISPLAY(), fontSize: fs, lineHeight: 1, color, whiteSpace: 'pre', ...style}}>
      {chars.map((ch, i) => {
        const s = start + i * step;
        const p = tw(t, s, 7);
        let pul = 0;
        for (const q of pulses) {
          const k = t - q - (i % 3);
          if (k >= 0 && k < 10) pul = Math.max(pul, k < 3 ? k / 3 : 1 - (k - 3) / 7);
        }
        const scY = sy * (2.3 - 1.3 * p) * (1 - 0.22 * pul);
        const scX = (0.35 + 0.65 * p) * (1 + 0.12 * pul);
        return (
          <span key={i} style={{display: 'inline-block', opacity: t >= s ? 1 : 0, transform: `scale(${scX}, ${scY})`, transformOrigin: '50% 100%'}}>
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/** Anton ≈ 0.46 em per uppercase glyph → font size that fits `w` */
export const fitAnton = (text: string, w: number, max: number, em = 0.46) => Math.min(max, Math.floor(w / (Math.max(1, Array.from(text).length) * em)));

/** header band above the grid: 1–2 lines (split by /), squash-in per letter */
export const Header: React.FC<{text: string; t: number; start?: number; color?: string; hlColor?: string; pulses?: number[]}> = ({text, t, start = 0, color, hlColor, pulses = []}) => {
  const f = useFormat();
  const lines = String(text || '').split('/').map((s) => s.trim()).filter(Boolean);
  const box = f.portrait ? {x: 72, y: 230, w: 936, h: 270} : {x: 96, y: 56, w: 1728, h: 200};
  const n = lines.length;
  const max = f.portrait ? (n > 1 ? 120 : 200) : n > 1 ? 100 : 170;
  const fs = Math.min(...lines.map((l) => fitAnton(l.toUpperCase(), box.w, max)));
  let k = 0;
  return (
    <div style={{position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: f.portrait ? 'center' : 'flex-start', gap: fs * 0.04}}>
      {lines.map((l, i) => {
        const s = start + k;
        k += Array.from(l).length * 1 + 4;
        return <SquashText key={i} text={l.toUpperCase()} t={t} start={s} step={1} fs={fs} color={i === n - 1 && n > 1 ? hlColor || color || C.ink : color || C.ink} pulses={pulses} style={{justifyContent: f.portrait ? 'center' : 'flex-start', lineHeight: 0.92}} />;
      })}
    </div>
  );
};
