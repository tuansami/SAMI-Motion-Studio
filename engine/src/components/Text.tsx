import React from 'react';
import {useF} from '../lib/warp';
import {tw} from '../lib/anim';
import {C, F, GRAD} from '../theme';

/**
 * Kinetic headline. Words rise out of a mask with a blur-to-sharp, staggered.
 * - `start`: frame the first word starts (relative to the enclosing Sequence)
 * - `stagger`: frames between words (use 15 = one beat to land each word on the music)
 * - `hl`: indices of words painted with the SAMI gradient
 * - `at`: optional explicit start frame per word (overrides stagger) for beat-exact timing
 * - `out`: frame at which all words leave (rise up + blur)
 */
export const Words: React.FC<{
  text: string;
  start?: number;
  stagger?: number;
  dur?: number;
  at?: number[];
  hl?: number[];
  hlColor?: string;
  out?: number;
  outDur?: number;
  style?: React.CSSProperties;
  wordStyle?: (i: number) => React.CSSProperties;
}> = ({text, start = 0, stagger = 4, dur = 20, at, hl = [], hlColor, out, outDur = 14, style, wordStyle}) => {
  const f = useF();
  // *word* markup = highlighted (gradient). Several words: *thiết kế theo gu riêng.*
  const raw = text.split(' ');
  const mk: number[] = [];
  let on = false;
  const words = raw.map((w, i) => {
    let x = w;
    if (x.startsWith('*')) { on = true; x = x.slice(1); }
    const close = x.endsWith('*');
    if (close) x = x.slice(0, -1);
    if (on && x !== '/') mk.push(i);
    if (close) on = false;
    return x;
  });
  const hlAll = [...hl, ...mk];
  // explicit `at` shorter than the word list → continue with `stagger` after the last given time
  const timeOf = (i: number) => {
    if (at && i < at.length) return at[i];
    if (at && at.length) { const last = Math.max(...at); return last + (i - at.length + 1) * stagger; }
    return start + i * stagger;
  };
  const pout = out !== undefined ? tw(f, out, outDur) : 0;
  return (
    <div
      style={{
        fontFamily: F.head,
        fontWeight: 800,
        color: C.text,
        letterSpacing: '-0.035em',
        lineHeight: 1.08,
        ...style,
      }}
    >
      {words.map((w, i) => {
        if (w === '/') return <br key={i} />;
        const s = timeOf(i);
        const p = tw(f, s, dur);
        const isHl = hlAll.includes(i);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              overflow: 'hidden',
              verticalAlign: 'top',
              paddingTop: '0.14em',
              marginTop: '-0.14em',
              paddingBottom: '0.24em',
              marginBottom: '-0.24em',
              paddingRight: '0.05em',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                transform: `translateY(${(1 - p) * 105 + pout * -105}%)`,
                opacity: Math.min(p * 1.6, 1) * (1 - pout),
                filter: p < 0.99 || pout > 0.01 ? `blur(${(1 - p) * 10 + pout * 10}px)` : undefined,
                ...(isHl
                  ? hlColor
                    ? {color: hlColor}
                    : {background: GRAD, WebkitBackgroundClip: 'text', color: 'transparent'}
                  : {}),
                ...(wordStyle ? wordStyle(i) : {}),
              }}
            >
              {w}
            </span>
            {i < words.length - 1 && words[i + 1] !== '/' ? ' ' : ''}
          </span>
        );
      })}
    </div>
  );
};

/** Small uppercase label that types itself on (monospace). */
export const TypeLabel: React.FC<{
  text: string;
  start?: number;
  cps?: number; // characters per frame
  style?: React.CSSProperties;
  caret?: boolean;
}> = ({text, start = 0, cps = 0.8, style, caret = true}) => {
  const f = useF();
  const n = Math.max(0, Math.min(text.length, Math.floor((f - start) * cps)));
  const showCaret = caret && f >= start && (n < text.length || Math.floor(f / 8) % 2 === 0);
  return (
    <div style={{fontFamily: F.mono, fontSize: 22, letterSpacing: '0.18em', color: C.muted, ...style}}>
      {text.slice(0, n)}
      <span style={{opacity: showCaret ? 1 : 0, color: C.mint}}>▍</span>
    </div>
  );
};

/** Pill chip with optional icon. */
export const Chip: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  active?: number; // 0..1 activation (fills with gradient)
}> = ({children, style, active = 0}) => (
  <div
    style={{
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 22px',
      borderRadius: 999,
      fontFamily: F.ui,
      fontWeight: 600,
      fontSize: 22,
      color: C.text,
      background: 'rgba(255,255,255,0.06)',
      border: `1px solid ${C.line}`,
      overflow: 'hidden',
      ...style,
    }}
  >
    <div style={{position: 'absolute', inset: 0, background: GRAD, opacity: active, borderRadius: 999}} />
    <div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: 10, color: active > 0.5 ? C.navyDeep : undefined}}>
      {children}
    </div>
  </div>
);

/** Number counter (rolls with EASE). Formats with German/Vietnamese thousands dot. */
export const Counter: React.FC<{
  from?: number;
  to: number;
  start: number;
  dur?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: React.CSSProperties;
}> = ({from = 0, to, start, dur = 30, prefix = '', suffix = '', decimals = 0, style}) => {
  const f = useF();
  const v = tw(f, start, dur, from, to);
  const s = v.toFixed(decimals).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (
    <span style={{fontVariantNumeric: 'tabular-nums', ...style}}>
      {prefix}
      {s}
      {suffix}
    </span>
  );
};
