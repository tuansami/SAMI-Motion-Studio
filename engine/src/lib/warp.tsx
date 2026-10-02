import React, {createContext, useContext} from 'react';
import {useBaseFrame} from '../core/timebase';
import {OV} from '../core/constants';

/**
 * Time-warp: stretch a finished scene without re-animating it.
 * knots = [[newT, oldT], ...] in scene-local base frames (t=0 = cut beat). Piecewise-linear.
 */
export type Knots = [number, number][];
const Ctx = createContext<(seqFrame: number) => number>((f) => f);

export const mapKnots = (t: number, k?: Knots | null) => {
  if (!k || k.length < 2) return t;
  if (t <= k[0][0]) return k[0][1] + (t - k[0][0]);
  for (let i = 0; i < k.length - 1; i++) {
    const [a0, b0] = k[i];
    const [a1, b1] = k[i + 1];
    if (t <= a1) return b0 + ((t - a0) / (a1 - a0)) * (b1 - b0);
  }
  const [aL, bL] = k[k.length - 1];
  return bL + (t - aL);
};

export const Warp: React.FC<{knots?: Knots | null; children: React.ReactNode}> = ({knots, children}) => (
  <Ctx.Provider value={(f) => mapKnots(f - OV, knots) + OV}>{children}</Ctx.Provider>
);

/** Warped Sequence frame in base frames (use instead of useCurrentFrame inside scenes/components). */
export const useF = () => useContext(Ctx)(useBaseFrame());
