import React, {useEffect, useImperativeHandle, useRef, useState, forwardRef} from 'react';
import {createRoot} from 'react-dom/client';
import {Player, type PlayerRef} from '@remotion/player';
import {Main, SceneOnly, totalBase} from '../src/core/Main';
import {STAGES, type Ratio} from '../src/core/format';
import {toReal} from '../src/core/timebase';
import {FONTS} from '../src/core/fonts';
import {STICKERS} from '../src/core/Stickers';

type Opts = {project: any; ratio: Ratio; fps: number; titles: boolean; subtitles: boolean; audio: boolean; sceneId?: string | null};
type Api = {update: (o: Partial<Opts>) => void; seek: (f: number) => void; play: () => void; pause: () => void; toggle: () => void; getFrame: () => number; isPlaying: () => boolean};

const App = forwardRef<Api, {init: Opts; onFrame: (f: number, total: number, playing: boolean) => void}>(({init, onFrame}, ref) => {
  const [o, setO] = useState<Opts>(init);
  const pl = useRef<PlayerRef>(null);
  useImperativeHandle(ref, () => ({
    update: (n) => setO((x) => ({...x, ...n})),
    seek: (f) => pl.current?.seekTo(f),
    play: () => pl.current?.play(),
    pause: () => pl.current?.pause(),
    toggle: () => pl.current?.toggle(),
    getFrame: () => pl.current?.getCurrentFrame() ?? 0,
    isPlaying: () => pl.current?.isPlaying() ?? false,
  }));
  const st = STAGES[o.ratio] || STAGES['16:9'];
  const scene = o.sceneId ? o.project.scenes.find((s: any) => s.id === o.sceneId) : null;
  const total = scene ? toReal(scene.end - scene.start + 16, o.fps) : Math.max(1, toReal(totalBase(o.project), o.fps));
  useEffect(() => {
    const p = pl.current; if (!p) return;
    const h = () => onFrame(p.getCurrentFrame(), total, p.isPlaying());
    p.addEventListener('frameupdate', h); p.addEventListener('play', h); p.addEventListener('pause', h); p.addEventListener('seeked', h);
    h();
    return () => { p.removeEventListener('frameupdate', h); p.removeEventListener('play', h); p.removeEventListener('pause', h); p.removeEventListener('seeked', h); };
  }, [total, onFrame]);
  const props = scene ? {...o, sceneId: scene.id} : o;
  return (
    <Player
      ref={pl}
      component={(scene ? SceneOnly : Main) as any}
      inputProps={props as any}
      durationInFrames={total}
      compositionWidth={st.w}
      compositionHeight={st.h}
      fps={o.fps}
      style={{width: '100%', height: '100%'}}
      controls={false}
      clickToPlay={false}
      acknowledgeRemotionLicense
      numberOfSharedAudioTags={12}
      bufferStateDelayInMilliseconds={300}
    />
  );
});

(window as any).StudioPreview = {
  fonts: FONTS,
  stickers: Object.entries(STICKERS).map(([id, s]) => ({id, label: s.label})),
  mount(el: HTMLElement, init: Opts, onFrame: (f: number, total: number, playing: boolean) => void): Promise<Api> {
    return new Promise((res) => {
      const r = createRoot(el);
      const cb = (api: Api | null) => api && res(api);
      r.render(<App ref={cb as any} init={init} onFrame={onFrame} />);
    });
  },
};
