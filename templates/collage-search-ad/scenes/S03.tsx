import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useT} from '@engine/lib/useT';
import {tw, keys, rnd, arrive} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {Kraft, Piece, Slips, snap, sans, dserif} from './_collage';

// S03 · A rubber stamp "Klick!" slams onto the ad on beat 1 (shake on twos), then navy ink bleeds out from the
// stamp (SVG blob + feTurbulence displacement) until the frame is covered; a bridge line appears on the ink.
export const S03: React.FC = () => {
  const t = useT();
  const ts = snap(t);
  const f = useFormat();
  const L = usePick({
    '16:9': {cx: 1200, cy: 730, sw: 640, sh: 250, fs: 150, card: [360, 250, 1200, 440], hs: 70},
    '9:16': {cx: 560, cy: 1210, sw: 700, sh: 260, fs: 160, card: [70, 600, 940, 600], hs: 72},
  });
  const hit = 14;
  const k = ts - hit;
  const sScale = keys(ts, [[0, 2.4], [hit, 1], [hit + 2, 0.96], [hit + 4, 1]]);
  const sOp = tw(ts, 0, 6);
  const shake = k >= 0 && k < 8 ? (rnd(ts) - 0.5) * 18 * (1 - k / 8) : 0;
  const shakeY = k >= 0 && k < 8 ? (rnd(ts + 99) - 0.5) * 18 * (1 - k / 8) : 0;
  const R = Math.hypot(f.w, f.h);
  const bleed = keys(ts, [[30, 0], [44, 0.1], [90, 1.1]]);
  return (
    <AbsoluteFill style={{transform: `translate(${shake}px, ${shakeY}px)`}}>
      <Kraft id="c3" />
      {/* the ad, simplified: a torn card with the headline */}
      <Piece x={L.card[0]} y={L.card[1]} w={L.card[2]} h={L.card[3]} t={t} at={-8} seed={31} rot={-0.8} amp={9}>
        <div style={{position: 'absolute', inset: 0, padding: 50, display: 'flex', flexDirection: 'column', gap: 26, justifyContent: 'center'}}>
          <div style={{fontFamily: sans(), fontWeight: 700, fontSize: 28, color: C.ink, opacity: 0.6}}>{COPY.S02_label}</div>
          <Slips text={COPY.S02_headline} t={t} at={-8} step={0} size={L.hs} seed={70} align="left" />
        </div>
      </Piece>
      {/* stamp */}
      <div style={{position: 'absolute', left: L.cx - L.sw / 2, top: L.cy - L.sh / 2, width: L.sw, height: L.sh, opacity: sOp, transform: `rotate(-9deg) scale(${sScale})`, filter: k < 0 ? `drop-shadow(0 ${30 * (1 - ts / hit)}px 30px rgba(0,0,0,0.35))` : undefined}}>
        <svg width={L.sw} height={L.sh} viewBox={`0 0 ${L.sw} ${L.sh}`} style={{overflow: 'visible'}}>
          <defs>
            <filter id="c3ink" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves={3} seed={6} result="n" />
              <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -7 0 0 0 4.6" result="holes" />
              <feComposite in="SourceGraphic" in2="holes" operator="in" result="g" />
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves={2} seed={2} result="d" />
              <feDisplacementMap in="g" in2="d" scale={5} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          <g filter="url(#c3ink)" opacity={0.92}>
            <rect x={8} y={8} width={L.sw - 16} height={L.sh - 16} rx={26} fill="none" stroke={C.accent} strokeWidth={14} />
            <rect x={28} y={28} width={L.sw - 56} height={L.sh - 56} rx={16} fill="none" stroke={C.accent} strokeWidth={4} />
            <text x={L.sw / 2} y={L.sh / 2 + L.fs * 0.34} textAnchor="middle" fontFamily={sans()} fontWeight={700} fontSize={L.fs} letterSpacing={-2} fill={C.accent} style={{textTransform: 'uppercase'}}>
              {COPY.S03_stamp}
            </text>
          </g>
        </svg>
      </div>
      {/* ink splats on impact */}
      {k >= 0
        ? [0, 1, 2, 3, 4, 5].map((i) => {
            const a = rnd(i * 3 + 1) * Math.PI * 2;
            const d = L.sw * (0.45 + rnd(i * 5) * 0.25);
            const s = 10 + rnd(i * 7) * 22;
            return <div key={i} style={{position: 'absolute', left: L.cx + Math.cos(a) * d, top: L.cy + Math.sin(a) * d * 0.55, width: s, height: s, borderRadius: '50%', background: C.accent, opacity: 0.85, transform: `scale(${Math.min(1, (k + 2) / 4)})`}} />;
          })
        : null}
      {/* ink bleed */}
      {bleed > 0 ? (
        <svg width={f.w} height={f.h} viewBox={`0 0 ${f.w} ${f.h}`} style={{position: 'absolute', inset: 0}}>
          <defs>
            <filter id="c3bl" filterUnits="userSpaceOnUse" x={-200} y={-200} width={f.w + 400} height={f.h + 400}>
              <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves={3} seed={ts % 6 < 2 ? 3 : ts % 6 < 4 ? 4 : 5} result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale={150} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
          <g filter="url(#c3bl)">
            <circle cx={L.cx} cy={L.cy} r={R * 0.62 * bleed} fill={C.ink} />
            {[0, 1, 2, 3, 4].map((i) => {
              const a = rnd(i * 11 + 2) * Math.PI * 2;
              const dd = R * 0.62 * bleed * (1 + rnd(i) * 0.25);
              return <circle key={i} cx={L.cx + Math.cos(a) * dd} cy={L.cy + Math.sin(a) * dd} r={R * 0.1 * bleed * (0.5 + rnd(i * 9))} fill={C.ink} />;
            })}
          </g>
        </svg>
      ) : null}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', padding: f.portrait ? 80 : 160}}>
        <div style={{fontFamily: dserif(), fontSize: f.portrait ? 96 : 110, lineHeight: 1.05, color: C.paper, textAlign: 'center', ...arrive(tw(ts, 76, 12), 30, 8)}}>{COPY.S03_bridge}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
