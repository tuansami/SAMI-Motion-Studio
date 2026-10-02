import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useK, BASE_FPS} from './timebase';
import {useFormat} from './format';
import {tw} from '../lib/anim';
import type {TitleItem, TextStyle, SubItem} from './types';
import {C, F, GRAD} from '../theme';

const css = (s: TextStyle = {}, stageH: number): React.CSSProperties => ({
  fontFamily: s.font ? `"${s.font}", "Be Vietnam Pro", sans-serif` : F.head,
  fontWeight: s.weight ?? 800,
  fontSize: s.size ?? Math.round(stageH * 0.06),
  color: s.color ?? C.text,
  textTransform: s.uppercase ? 'uppercase' : undefined,
  letterSpacing: s.letterSpacing !== undefined ? `${s.letterSpacing}em` : '-0.02em',
  lineHeight: s.lineHeight ?? 1.15,
  textAlign: s.align ?? 'center',
  fontStyle: s.italic ? 'italic' : undefined,
  WebkitTextStroke: s.stroke ? `${s.stroke.width}px ${s.stroke.color}` : undefined,
  paintOrder: 'stroke fill',
  textShadow: s.shadow ? '0 4px 18px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.6)' : undefined,
});

const hex2rgba = (hex: string, a = 1) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/** Split "Hello *world*" into words with highlight flags; " / " = line break. */
const parse = (text: string) => {
  let on = false;
  return text.split(' ').map((w) => {
    if (w === '/') return {w: '/', hl: false};
    let x = w; let hl = on;
    if (x.startsWith('*')) { on = true; hl = true; x = x.slice(1); }
    if (x.endsWith('*')) { x = x.slice(0, -1); on = false; }
    return {w: x, hl};
  });
};

const Line: React.FC<{item: {text: string; start: number; end: number; anim?: string; out?: string; style?: TextStyle}; t: number; maxWidth: number}> = ({item, t, maxWidth}) => {
  const fmt = useFormat();
  const s0 = item.start * BASE_FPS, s1 = item.end * BASE_FPS;
  const anim = item.anim || 'rise';
  const st = css(item.style, Math.min(fmt.w, fmt.h) * 1.35);
  const hlColor = item.style?.highlight;
  const outP = item.out === 'none' ? 0 : tw(t, s1 - 10, 10);
  const words = parse(item.text);
  const n = words.filter((w) => w.w !== '/').length || 1;
  let wi = -1;
  const inner = words.map((wd, i) => {
    if (wd.w === '/') return <br key={i} />;
    wi++;
    const k = wi;
    let p = 1, extra: React.CSSProperties = {};
    const perWord = Math.min(6, (s1 - s0) / (n + 2));
    if (anim === 'words' || anim === 'rise') p = tw(t, s0 + k * (anim === 'rise' ? 3 : perWord), 16);
    if (anim === 'fade' || anim === 'pop' || anim === 'slide' || anim === 'none') p = anim === 'none' ? 1 : tw(t, s0, 14);
    if (anim === 'karaoke' || anim === 'highlight') {
      const ws = s0 + ((s1 - s0 - 8) * k) / n, we = s0 + ((s1 - s0 - 8) * (k + 1)) / n;
      p = tw(t, s0, 8);
      const active = t >= ws && t < we, said = t >= ws;
      extra = anim === 'karaoke'
        ? {color: active ? hlColor || C.mint : said ? st.color : hex2rgba(String(st.color).startsWith('#') ? String(st.color) : '#ffffff', 0.45), transform: `scale(${active ? 1.06 : 1})`}
        : active ? {background: hlColor || C.mint, color: C.navyDeep, borderRadius: 8, padding: '0 0.12em', margin: '0 -0.06em'} : {};
    }
    const hlStyle: React.CSSProperties = wd.hl ? (hlColor ? {color: hlColor} : {background: GRAD, WebkitBackgroundClip: 'text', color: 'transparent'}) : {};
    const moving: React.CSSProperties = anim === 'rise' || anim === 'words'
      ? {transform: `translateY(${(1 - p) * 60}%)`, opacity: p, filter: p < 0.99 ? `blur(${(1 - p) * 8}px)` : undefined}
      : {opacity: p};
    return (
      <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', ...moving}}>
        <span style={{display: 'inline-block', ...hlStyle, ...extra}}>{wd.w}</span>
        {k < n - 1 ? ' ' : ''}
      </span>
    );
  });
  const chars = anim === 'typewriter' ? Math.floor(Math.max(0, t - s0) * 1.2) : Infinity;
  const whole = tw(t, s0, 14);
  const boxT = anim === 'pop' ? `scale(${0.85 + whole * 0.15})` : anim === 'slide' ? `translateX(${(1 - whole) * -60}px)` : undefined;
  const bg = item.style?.bg;
  return (
    <div style={{maxWidth, opacity: 1 - outP, transform: [boxT, item.out === 'rise' ? `translateY(${-outP * 30}px)` : ''].filter(Boolean).join(' ') || undefined, ...(bg ? {background: hex2rgba(bg.color, bg.opacity ?? 0.8), borderRadius: bg.radius ?? 14, padding: `${bg.padY ?? 12}px ${bg.padX ?? 22}px`, boxDecorationBreak: 'clone'} : {}), ...st}}>
      {anim === 'typewriter' ? <span>{item.text.replace(/\*/g, '').replace(/ \/ /g, '\n').slice(0, chars)}</span> : inner}
    </div>
  );
};

/** Title overlays from project.json → titles[] (seconds, relative positions). Rendered above scenes. */
export const Titles: React.FC<{items?: TitleItem[]}> = ({items}) => {
  const f = useCurrentFrame() * useK();
  const fmt = useFormat();
  if (!items?.length) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {items.filter((it) => !it.formats?.length || it.formats.includes(fmt.ratio)).map((it) => {
        if (f < it.start * BASE_FPS - 1 || f > it.end * BASE_FPS + 1) return null;
        const x = (it.pos?.x ?? 0.5) * fmt.w, y = (it.pos?.y ?? 0.82) * fmt.h;
        const mw = (it.maxWidth ?? 0.86) * fmt.w;
        return (
          <div key={it.id} style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', width: mw, display: 'flex', justifyContent: 'center'}}>
            <Line item={it} t={f} maxWidth={mw} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Subtitles (e.g. imported from SRT). One cue at a time, karaoke/fade/pop styles. */
export const Subtitles: React.FC<{cfg?: {enabled: boolean; items: SubItem[]; style?: TextStyle; pos?: {x: number; y: number}; anim?: string; maxWidth?: number}}> = ({cfg}) => {
  const f = useCurrentFrame() * useK();
  const fmt = useFormat();
  if (!cfg?.enabled || !cfg.items?.length) return null;
  const cur = cfg.items.find((c) => f >= c.start * BASE_FPS && f < c.end * BASE_FPS);
  if (!cur) return null;
  const x = (cfg.pos?.x ?? 0.5) * fmt.w, y = (cfg.pos?.y ?? (fmt.portrait ? 0.72 : 0.88)) * fmt.h;
  const mw = (cfg.maxWidth ?? 0.84) * fmt.w;
  const style: TextStyle = {size: Math.round(Math.min(fmt.w, fmt.h) * 0.05), weight: 700, shadow: true, ...cfg.style};
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', width: mw, display: 'flex', justifyContent: 'center'}}>
        <Line item={{...cur, anim: cfg.anim || 'karaoke', out: 'none', style}} t={f} maxWidth={mw} />
      </div>
    </AbsoluteFill>
  );
};

/** Parse .srt text → SubItem[] */
export const parseSRT = (srt: string): SubItem[] => {
  const toS = (x: string) => { const [h, m, r] = x.trim().replace(',', '.').split(':'); return +h * 3600 + +m * 60 + parseFloat(r); };
  return srt.replace(/\r/g, '').split(/\n\n+/).map((b) => b.split('\n')).filter((l) => l.length >= 2).map((l) => {
    const i = l.findIndex((x) => x.includes('-->'));
    const [a, b] = l[i].split('-->');
    return {start: toS(a), end: toS(b), text: l.slice(i + 1).join(' / ').trim()};
  });
};
