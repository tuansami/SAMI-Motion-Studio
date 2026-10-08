import React, {createContext, useContext} from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {useFormat} from './format';
import type {VideoClip} from './types';

/**
 * FOOTAGE LAYER (Studio 0.9) — project.json → tracks.video[]: real clips above the scenes, below overlays/titles.
 *  main   full frame (talking head, interview)          broll  full frame, short insert, muted by default
 *  pip    framed window (rounded / circle) at pip{x,y,w} screen  screen recording inside a phone / laptop frame
 * Footage is NOT in public/: the Studio serves it over HTTP (preview: 540p proxy, export: originals) → MediaCtx.base.
 * Times are seconds: `at` on the timeline, `in`/`out` in the source, `speed` = playback rate.
 */
export type MediaInfo = {base?: string; proxy?: boolean};
export const MediaCtx = createContext<MediaInfo>({});
export const footageUrl = (m: MediaInfo, src: string) =>
  m.base ? m.base + (m.proxy ? 'proxy/' : '') + src.split('/').map(encodeURIComponent).join('/') : null;
export const clipLen = (c: VideoClip) => Math.max(0, ((c.out ?? 0) - (c.in ?? 0)) / (c.speed || 1));
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const Z: Record<string, number> = {main: 0, screen: 5, broll: 10, pip: 20};

const Placeholder: React.FC<{c: VideoClip}> = ({c}) => (
  <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', background: 'repeating-linear-gradient(135deg,#1c1840 0 24px,#15112f 24px 48px)', color: '#cfc9ff', fontFamily: 'Inter, sans-serif', fontSize: 34, textAlign: 'center'}}>
    🎬 {c.label || c.src}<br /><span style={{fontSize: 22, opacity: 0.6}}>footage chỉ hiện trong Studio / khi xuất</span>
  </AbsoluteFill>
);

const Clip: React.FC<{c: VideoClip}> = ({c}) => {
  const f = useFormat();
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const m = useContext(MediaCtx);
  const len = clipLen(c) * fps;
  const fin = (c.fadeIn ?? 0) * fps, fout = (c.fadeOut ?? 0) * fps;
  const op = Math.min(fin ? interpolate(frame, [0, fin], [0, 1], clamp) : 1, fout ? interpolate(frame, [len - fout, len], [1, 0], clamp) : 1);
  const url = footageUrl(m, c.src);
  const fit = c.fit || (c.role === 'screen' ? 'contain' : 'cover');
  const video = url
    ? <OffthreadVideo src={url} muted startFrom={Math.round((c.in ?? 0) * fps)} endAt={Math.max(Math.round((c.in ?? 0) * fps) + 1, Math.round((c.out ?? 0) * fps))}
        playbackRate={c.speed || 1} style={{width: '100%', height: '100%', objectFit: fit, display: 'block'}} />
    : <Placeholder c={c} />;
  const framed = c.role === 'pip' || c.role === 'screen';
  if (!framed) return <AbsoluteFill style={{opacity: op, background: fit === 'contain' ? '#000' : undefined}}>{video}</AbsoluteFill>;

  // framed window: width as a fraction of the frame's SHORT side (same rule as overlays), centre at pip.x / pip.y
  const short = Math.min(f.w, f.h);
  const P = {x: 0.5, y: 0.5, w: 0.4, r: 0.08, ...(c.pip || {})};
  const mask = c.mask || (c.role === 'screen' ? 'phone' : 'rounded');
  const W = P.w * short * (mask === 'laptop' ? 1.9 : 1);
  const aspect = mask === 'circle' ? 1 : mask === 'phone' ? 9 / 19.5 : mask === 'laptop' ? 16 / 10 : c.aspect || 16 / 9;
  const H = W / aspect;
  const pop = fin ? interpolate(frame, [0, fin], [0.92, 1], clamp) : 1;
  const box: React.CSSProperties = {position: 'absolute', left: P.x * f.w - W / 2, top: P.y * f.h - H / 2, width: W, height: H, opacity: op, transform: `scale(${pop})`};
  if (mask === 'phone') {
    const pad = W * 0.028;
    return (
      <div style={{...box, borderRadius: W * 0.14, background: '#0E0E14', padding: pad, boxSizing: 'border-box', boxShadow: '0 40px 90px rgba(0,0,0,.45), inset 0 0 0 2px rgba(255,255,255,.08)'}}>
        <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: W * 0.115, overflow: 'hidden', background: '#000'}}>
          {video}
          <div style={{position: 'absolute', top: W * 0.035, left: '35%', width: '30%', height: W * 0.07, borderRadius: 999, background: '#0E0E14'}} />
        </div>
      </div>
    );
  }
  if (mask === 'laptop') {
    const bez = W * 0.025;
    return (
      <div style={{...box, height: H + W * 0.06}}>
        <div style={{width: W, height: H, borderRadius: W * 0.022, background: '#111', padding: bez, boxSizing: 'border-box', boxShadow: '0 30px 70px rgba(0,0,0,.4)'}}>
          <div style={{width: '100%', height: '100%', overflow: 'hidden', background: '#000', borderRadius: W * 0.006}}>{video}</div>
        </div>
        <div style={{width: W * 1.14, marginLeft: -W * 0.07, height: W * 0.035, background: 'linear-gradient(#cfd2d8,#9a9ea8)', borderRadius: `0 0 ${W * 0.03}px ${W * 0.03}px`}} />
      </div>
    );
  }
  const radius = mask === 'circle' ? '50%' : mask === 'rounded' ? (P.r ?? 0.08) * W : 0;
  return (
    <div style={{...box, borderRadius: radius, overflow: 'hidden', background: '#000', boxShadow: c.shadow === false ? undefined : '0 24px 60px rgba(0,0,0,.45)',
      outline: c.border ? `${Math.max(2, W * 0.012)}px solid ${c.border}` : undefined, outlineOffset: c.border ? -1 : undefined}}>
      {video}
    </div>
  );
};

export const VideoTrack: React.FC<{clips?: VideoClip[]}> = ({clips}) => {
  const {fps} = useVideoConfig();
  const f = useFormat();
  if (!clips?.length) return null;
  const list = clips.filter((c) => !c.formats?.length || c.formats.includes(f.ratio)).slice().sort((a, b) => (a.z ?? Z[a.role] ?? 0) - (b.z ?? Z[b.role] ?? 0));
  return (
    <>
      {list.map((c) => (
        <Sequence key={c.id} from={Math.round((c.at ?? 0) * fps)} durationInFrames={Math.max(1, Math.round(clipLen(c) * fps))} name={`🎬 ${c.id} · ${c.role} · ${c.label || c.src}`}>
          <Clip c={c} />
        </Sequence>
      ))}
    </>
  );
};
