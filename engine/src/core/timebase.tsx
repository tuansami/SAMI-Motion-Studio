import React, {createContext, useContext} from 'react';
import {useCurrentFrame} from 'remotion';

/**
 * TIME BASE — every project is authored at 30 "base frames" per second (1 beat @120 BPM = 15 base frames).
 * Rendering at 24 / 30 / 60 fps only changes k = 30 / fps; animations stay identical (and smoother at 60).
 */
export const BASE_FPS = 30;
const Ctx = createContext({k: 1});
export const TimebaseProvider: React.FC<{fps: number; children: React.ReactNode}> = ({fps, children}) => (
  <Ctx.Provider value={{k: BASE_FPS / fps}}>{children}</Ctx.Provider>
);
export const useK = () => useContext(Ctx).k;
/** current frame of the enclosing Sequence, expressed in base (30 fps) frames — may be fractional */
export const useBaseFrame = () => useCurrentFrame() * useK();
/** convert base frames → real frames of the current composition */
export const toReal = (baseFrames: number, fps: number) => Math.round((baseFrames * fps) / BASE_FPS);
