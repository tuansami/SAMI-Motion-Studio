import React from 'react';
import {F} from '../theme';

/** iPhone-style device. Screen is 390x844 logical px; `scale` sizes it. Children render in the screen. */
export const Phone: React.FC<{
  scale?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  screenBg?: string;
  statusDark?: boolean; // dark icons on light screen
  time?: string; // status-bar clock (0.2.2)
}> = ({scale = 1, children, style, screenBg = '#000', statusDark = true, time = '19:04'}) => {
  const W = 390, H = 844, B = 14;
  const ink = statusDark ? '#111' : '#fff';
  return (
    <div style={{width: (W + B * 2) * scale, height: (H + B * 2) * scale, position: 'relative', ...style}}>
      <div
        style={{
          position: 'absolute', left: 0, top: 0, width: W + B * 2, height: H + B * 2,
          transform: `scale(${scale})`, transformOrigin: '0 0',
          borderRadius: 68, background: 'linear-gradient(145deg,#3a3a44,#101014 40%,#2a2a30)',
          boxShadow: '0 60px 120px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,255,255,0.08) inset',
        }}
      >
        <div style={{position: 'absolute', left: B, top: B, width: W, height: H, borderRadius: 54, overflow: 'hidden', background: screenBg}}>
          {children}
          {/* status bar */}
          <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 34px 0 42px', fontFamily: F.ui, fontWeight: 600, fontSize: 17, color: ink, pointerEvents: 'none'}}>
            <span>{time}</span>
            <span style={{display: 'flex', gap: 6, alignItems: 'center'}}>
              <svg width="18" height="12" viewBox="0 0 18 12"><g fill={ink}><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="7" rx="1" /><rect x="10" y="2.5" width="3" height="9.5" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></g></svg>
              <svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="22" height="11" rx="3.5" fill="none" stroke={ink} opacity="0.5" /><rect x="2.5" y="2.5" width="16" height="7" rx="2" fill={ink} /><rect x="23.5" y="4" width="2" height="4" rx="1" fill={ink} opacity="0.5" /></svg>
            </span>
          </div>
          {/* dynamic island */}
          <div style={{position: 'absolute', top: 11, left: '50%', width: 124, height: 36, marginLeft: -62, borderRadius: 20, background: '#000'}} />
        </div>
      </div>
    </div>
  );
};

/** Desktop browser window. Content area is `width` x `height - 56`. */
export const Browser: React.FC<{
  width: number;
  height: number;
  url?: string;
  urlTyped?: number; // chars of url visible (for typing effect)
  dark?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  radius?: number;
}> = ({width, height, url = '', urlTyped, dark = true, children, style, radius = 18}) => {
  const bar = dark ? '#1B1726' : '#F2F1F5';
  const ink = dark ? 'rgba(255,255,255,0.75)' : '#333';
  const shown = urlTyped === undefined ? url : url.slice(0, Math.max(0, Math.floor(urlTyped)));
  return (
    <div
      style={{
        width, height, borderRadius: radius, overflow: 'hidden', position: 'relative',
        background: dark ? '#0E0B16' : '#fff',
        boxShadow: '0 50px 110px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
        ...style,
      }}
    >
      <div style={{height: 56, background: bar, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10, borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`}}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
          <div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c}} />
        ))}
        <div style={{marginLeft: 24, flex: 1, maxWidth: 560, height: 34, borderRadius: 10, background: dark ? 'rgba(255,255,255,0.06)' : '#fff', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', fontFamily: F.ui, fontSize: 17, color: ink}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth="2.4" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          {shown}
        </div>
      </div>
      <div style={{position: 'absolute', top: 56, left: 0, right: 0, bottom: 0, overflow: 'hidden'}}>{children}</div>
    </div>
  );
};

/** Mouse cursor (macOS arrow). Place with absolute left/top = tip position. `press` 0..1 shrinks on click. */
export const Cursor: React.FC<{x: number; y: number; press?: number; opacity?: number; scale?: number}> = ({x, y, press = 0, opacity = 1, scale = 1}) => (
  <div style={{position: 'absolute', left: x, top: y, opacity, transform: `scale(${scale * (1 - press * 0.15)})`, transformOrigin: '0 0', pointerEvents: 'none', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))', zIndex: 50}}>
    <svg width="34" height="40" viewBox="0 0 34 40">
      <path d="M2 2 L2 32 L10 25 L16 38 L22 35.5 L16 23 L27 23 Z" fill="#111" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  </div>
);

/** Expanding ring for clicks/taps. p = 0..1 progress. */
export const Ripple: React.FC<{x: number; y: number; p: number; color?: string; size?: number}> = ({x, y, p, color = '#fff', size = 90}) =>
  p <= 0 || p >= 1 ? null : (
    <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: '50%', border: `3px solid ${color}`, opacity: 1 - p, transform: `scale(${0.2 + p})`, pointerEvents: 'none', zIndex: 49}} />
  );

/** Touch point for phones (soft white dot). */
export const Touch: React.FC<{x: number; y: number; p: number; show?: number}> = ({x, y, p, show = 1}) => (
  <div style={{position: 'absolute', left: x - 30, top: y - 30, width: 60, height: 60, borderRadius: 30, background: 'rgba(255,255,255,0.55)', border: '2px solid rgba(255,255,255,0.9)', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', opacity: show, transform: `scale(${1 - p * 0.25})`, zIndex: 60, pointerEvents: 'none'}} />
);
