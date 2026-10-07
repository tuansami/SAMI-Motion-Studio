import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Img, Sequence, useVideoConfig, delayRender, continueRender, cancelRender} from 'remotion';
import {media} from './media';
import {Lottie, type LottieAnimationData} from '@remotion/lottie';
import {tw} from '../lib/anim';
import {useBaseFrame, toReal} from './timebase';
import {useFormat} from './format';
import {Sticker} from './Stickers';
import type {OverlayItem} from './types';

/** Images, logos, watermarks, "chỉ dẫn" stickers and Lottie animations placed over the film (project.json → overlays). */
export const Overlays: React.FC<{items?: OverlayItem[]; layer: 'top' | 'under'; totalSec: number}> = ({items, layer, totalSec}) => {
  const f = useFormat(); const {fps} = useVideoConfig();
  if (!items?.length) return null;
  return (
    <>
      {items.filter((o) => (o.layer || 'under') === layer && (!o.formats?.length || o.formats.includes(f.ratio))).map((o) => {
        const start = o.whole ? 0 : Math.max(0, o.start || 0);
        const end = o.whole ? totalSec : Math.max(start + 0.1, o.end || start + 2);
        const from = toReal(start * 30, fps); const dur = Math.max(1, toReal(end * 30, fps) - from);
        return (
          <Sequence key={o.id} from={from} durationInFrames={dur} name={`Ảnh · ${o.label || o.src || o.sticker}`} layout="none">
            <OverlayOne o={o} len={(end - start) * 30} />
          </Sequence>
        );
      })}
    </>
  );
};

const OverlayOne: React.FC<{o: OverlayItem; len: number}> = ({o, len}) => {
  const t = useBaseFrame(); // base frames since this overlay appeared
  const {width: W, height: H} = useVideoConfig();
  const anim = o.anim || (o.kind === 'sticker' ? 'draw' : 'fade');
  const inP = anim === 'none' ? 1 : tw(t, 0, anim === 'draw' ? 22 : 12);
  const outP = o.out === 'none' || o.whole ? 1 : 1 - tw(t, len - 10, 10);
  let tx = 0, ty = 0, sc = 1, blur = 0;
  if (anim === 'pop') sc = 0.6 + 0.4 * inP + Math.sin(inP * Math.PI) * 0.08;
  if (anim === 'zoom') sc = 1.25 - 0.25 * inP;
  if (anim === 'rise') ty = (1 - inP) * 60;
  if (anim === 'slide-left') tx = (1 - inP) * 120;
  if (anim === 'slide-right') tx = -(1 - inP) * 120;
  if (anim !== 'none' && anim !== 'draw') blur = (1 - inP) * 10;
  if (o.pulse) sc *= 1 + 0.05 * Math.sin((t / 15) * Math.PI); // gentle beat pulse (1 beat = 15 base frames)
  const op = (o.opacity ?? 1) * (anim === 'draw' ? 1 : inP) * outP;
  const w = (o.width ?? 0.2) * Math.min(W, H); // size relative to the SHORT side → same pixel size in 16:9, 9:16 and 1:1
  const x = (o.pos?.x ?? 0.5) * W, y = (o.pos?.y ?? 0.5) * H;
  const style: React.CSSProperties = {
    position: 'absolute', left: x, top: y, width: w,
    transform: `translate(-50%, -50%) translate(${tx}px, ${ty}px) rotate(${o.rotate || 0}deg) scale(${sc}) ${o.flip ? 'scaleX(-1)' : ''}`,
    opacity: op, filter: [blur > 0.2 ? `blur(${blur}px)` : '', o.shadow ? 'drop-shadow(0 12px 28px rgba(0,0,0,.45))' : ''].filter(Boolean).join(' ') || undefined,
  };
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={style}>
        {o.kind === 'sticker' ? <Sticker id={o.sticker || 'arrow'} p={anim === 'draw' ? inP : 1} color={o.color || '#08DDA4'} stroke={o.stroke ?? 6} />
          : o.kind === 'lottie' ? <LottieFile src={o.src || ''} loop={o.loop !== false} speed={o.speed ?? 1} />
          : o.src ? <Img src={media(o.src)} style={{width: '100%', height: 'auto', display: 'block', borderRadius: o.radius || 0}} /> : null}
      </div>
    </AbsoluteFill>
  );
};

const cache = new Map<string, LottieAnimationData>();
const LottieFile: React.FC<{src: string; loop: boolean; speed: number}> = ({src, loop, speed}) => {
  const [data, setData] = useState<LottieAnimationData | null>(cache.get(src) || null);
  const [handle] = useState(() => (cache.has(src) || !src ? null : delayRender('Lottie ' + src)));
  useEffect(() => {
    if (!src || cache.has(src)) return;
    fetch(media(src)).then((r) => r.json()).then((j) => { cache.set(src, j); setData(j); if (handle !== null) continueRender(handle); })
      .catch((e) => { if (handle !== null) cancelRender(new Error('Không đọc được Lottie ' + src + ': ' + e)); });
  }, [src, handle]);
  if (!data) return null;
  const ar = (data.h || 1) / (data.w || 1);
  return <div style={{width: '100%', paddingTop: `${ar * 100}%`, position: 'relative'}}><Lottie animationData={data} loop={loop} playbackRate={speed} style={{position: 'absolute', inset: 0}} /></div>;
};
