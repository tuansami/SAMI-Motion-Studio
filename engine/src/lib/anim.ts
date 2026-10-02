import {Easing, interpolate} from 'remotion';

/**
 * ONE easing curve for the whole film: expo-out cubic-bezier(0.22, 1, 0.36, 1).
 * Never use springs or other easings. Consistency is the look.
 */
export const EASE = Easing.bezier(0.22, 1, 0.36, 1);

/** Music grid: 120 BPM, first downbeat at 0.03s. beat(n) → frame. 1 beat = 15f, 1 bar = 60f. */
export const beat = (n: number) => Math.round(1 + 15 * n);
export const bar = (n: number) => beat(n * 4);
export const BEAT = 15;
export const BAR = 60;

/** Eased tween from `from`→`to` between frame `start` and `start+dur` (clamped). */
export const tw = (f: number, start: number, dur: number, from = 0, to = 1) =>
  interpolate(f, [start, start + Math.max(1, dur)], [from, to], {
    easing: EASE,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/** Piecewise keyframes [[frame, value], ...], every segment eased with EASE. */
export const keys = (f: number, k: [number, number][]) => {
  if (f <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    const [f0, v0] = k[i];
    const [f1, v1] = k[i + 1];
    if (f <= f1) return tw(f, f0, f1 - f0, v0, v1);
  }
  return k[k.length - 1][1];
};

/** Standard "arrive" style: rise + un-blur + fade. p = 0..1 progress (already eased). */
export const arrive = (p: number, dist = 40, blur = 12): React.CSSProperties => ({
  opacity: p,
  transform: `translateY(${(1 - p) * dist}px)`,
  filter: p < 0.999 ? `blur(${(1 - p) * blur}px)` : undefined,
});

/** Standard "leave" style (mirror of arrive). */
export const leave = (p: number, dist = -30, blur = 12): React.CSSProperties => ({
  opacity: 1 - p,
  transform: `translateY(${p * dist}px)`,
  filter: p > 0.001 ? `blur(${p * blur}px)` : undefined,
});

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Deterministic pseudo random 0..1 from integer seed. */
export const rnd = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
