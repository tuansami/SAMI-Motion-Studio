import React from 'react';
import {Audio, Sequence, staticFile, useVideoConfig, interpolate} from 'remotion';
import {media} from './media';
import {BASE_FPS} from './timebase';
import type {ProjectJSON} from './types';

const db = (d = 0) => Math.pow(10, d / 20);

/**
 * Audio: 'premix' plays one finished file (e.g. audio/mix.wav).
 * 'layers' builds the mix live: music (with bar-accurate edit segments + crossfades) + SFX cues.
 * Everything is in seconds.
 */
export const AudioTrack: React.FC<{audio?: ProjectJSON['audio']; totalBase: number}> = ({audio, totalBase}) => {
  const {fps} = useVideoConfig();
  if (!audio || audio.mode === 'none') return null;
  const totalReal = Math.round((totalBase * fps) / BASE_FPS);
  if (audio.mode === 'premix' && audio.premix) {
    return <Audio src={media(audio.premix)} volume={db(audio.premixGain)} />;
  }
  const out: React.ReactNode[] = [];
  const m = audio.music;
  // voice-over ducking: music gain follows the voice clips (0.25 s ramps), in output seconds
  const voice = audio.voice || [];
  const duckG = db(audio.duck ?? -9);
  const duckAt = (sec: number) => {
    let d = 1;
    for (const v of voice) {
      const a = v.t - 0.15, b = v.t + (v.len || 0) + 0.25;
      const w = interpolate(sec, [a - 0.25, a, b, b + 0.25], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      d = Math.min(d, 1 - w * (1 - duckG));
    }
    return d;
  };
  if (m?.src) {
    const segs = m.edit?.length ? m.edit : [[0, totalBase / BASE_FPS + 5, 0] as [number, number, number]];
    let at = 0; // seconds on the output timeline
    const fadeOut = m.fadeOut ?? 2.5;
    segs.forEach(([a, b, xf = 0.02], i) => {
      const len = b - a;
      const startS = i === 0 ? 0 : at - (xf || 0);
      const from = Math.max(0, Math.round(startS * fps));
      const dur = Math.max(1, Math.round((len + (i === 0 ? 0 : xf || 0)) * fps));
      const xin = i === 0 ? 0 : Math.max(1, Math.round((xf || 0) * fps));
      const nextXf = segs[i + 1]?.[2] ?? 0;
      const xout = i === segs.length - 1 ? 0 : Math.max(1, Math.round(nextXf * fps));
      const trimBefore = Math.round((a - (i === 0 ? 0 : xf || 0)) * fps);
      out.push(
        <Sequence key={'m' + i} from={from} durationInFrames={dur} layout="none">
          <Audio
            src={media(m.src)}
            startFrom={Math.max(0, trimBefore)}
            endAt={Math.max(0, trimBefore) + dur}
            volume={(f) => {
              const g = (xin ? Math.min(1, f / xin) : 1) * (xout ? Math.min(1, (dur - f) / xout) : 1);
              const gf = from + f;
              const end = interpolate(gf, [totalReal - fadeOut * fps, totalReal], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return db(m.gain ?? -3) * g * end * (voice.length ? duckAt(gf / fps) : 1);
            }}
          />
        </Sequence>,
      );
      at += len - (i === 0 ? 0 : 0);
    });
  }
  (audio.cues || []).forEach((c, i) => {
    const from = Math.max(0, Math.round(c.t * fps));
    out.push(
      <Sequence key={'c' + i} from={from} durationInFrames={Math.round(Math.max(4, (c.len || 0) + 0.5) * fps)} layout="none">
        <Audio src={c.src ? media(c.src) : staticFile(`_engine/sfx/${c.sfx}.wav`)} volume={db(c.gain ?? -10)} />
      </Sequence>,
    );
  });
  voice.forEach((v, i) => {
    out.push(
      <Sequence key={'v' + i} from={Math.max(0, Math.round(v.t * fps))} durationInFrames={Math.max(1, Math.round(((v.len || 8) + 0.5) * fps))} layout="none">
        <Audio src={media(v.src)} volume={db(v.gain ?? 0)} />
      </Sequence>,
    );
  });
  return <>{out}</>;
};
