import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useBaseFrame} from '../core/timebase';
import {tw} from '../lib/anim';

/**
 * Every scene lives inside <Scene>. It crossfades + blur-fades in and out, so no cut is ever hard.
 * `dur` = total frames of the Sequence (including the overlap on both sides).
 */
export const Scene: React.FC<{
  dur: number;
  fadeIn?: number;
  fadeOut?: number;
  delay?: number; // frames before the fade-in starts
  bg?: string;
  children: React.ReactNode;
}> = ({dur, fadeIn = 12, fadeOut = 12, delay = 0, bg, children}) => {
  const f = useBaseFrame();
  const pin = fadeIn > 0 ? tw(f, delay, fadeIn) : 1;
  const pout = fadeOut > 0 ? tw(f, dur - fadeOut, fadeOut) : 0;
  const op = pin; // outgoing scene stays opaque underneath; the incoming one blur-fades over it
  const blur = (1 - pin) * 18 + pout * 18;
  const scale = (1 + (1 - pin) * 0.04) * (1 - pout * 0.03);
  return (
    <AbsoluteFill
      style={{
        opacity: op,
        filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
        transform: `scale(${scale})`,
        background: bg,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
