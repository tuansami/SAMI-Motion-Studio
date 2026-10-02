import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import './fonts';
import {OV} from './constants';
import {TimebaseProvider, toReal} from './timebase';
import {FormatProvider, STAGES, type Ratio} from './format';
import {setCopy} from './copy';
import {applyBrand, C} from '../theme';
import {Warp} from '../lib/warp';
import {Scene} from '../components/Scene';
import {FilmFinish} from '../components/Brand';
import {Titles, Subtitles} from './Titles';
import {AudioTrack} from './AudioTrack';
import {Overlays} from './Overlays';
import type {MainProps, ProjectJSON} from './types';
// @ts-ignore — provided by the Studio bundler alias
import {REG} from '@project/scenes/index';

export const totalBase = (p: ProjectJSON) => (p.scenes.length ? p.scenes[p.scenes.length - 1].end : 30);

/** All scenes laid out on the project's native stage for `ratio` (or the primary ratio in fit mode). */
const SceneStack: React.FC<{p: ProjectJSON; fps: number}> = ({p, fps}) => {
  const T = totalBase(p);
  return (
    <>
      {p.scenes.map((s, i) => {
        const first = i === 0, last = i === p.scenes.length - 1;
        const a = first ? -OV : s.start - OV;
        const b = Math.min(T, s.end + OV);
        const from = toReal(a, fps);
        const dur = Math.max(1, toReal(b, fps) - from);
        const Comp = REG[s.id];
        const fadeIn = first ? 0 : s.fadeIn ?? 2 * OV;
        return (
          <Sequence key={s.id} from={from} durationInFrames={dur} name={`${s.id} · ${s.label}`}>
            <Scene dur={b - a} fadeIn={fadeIn} delay={s.fadeDelay ?? (fadeIn < 2 * OV ? OV - Math.round(fadeIn / 2) : 0)} fadeOut={last ? 0 : 2 * OV}>
              <Warp knots={s.warp}>{Comp ? <Comp /> : <Missing id={s.id} />}</Warp>
            </Scene>
          </Sequence>
        );
      })}
    </>
  );
};
const Missing: React.FC<{id: string}> = ({id}) => (
  <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', background: '#300', color: '#fff', fontSize: 60, fontFamily: 'Inter'}}>Thiếu scene {id}</AbsoluteFill>
);

export const Main: React.FC<MainProps & {audioOnly?: boolean}> = ({project: p, ratio, fps, titles = true, audio = true, subtitles = true, audioOnly = false}) => {
  // audio pass of the export: only the sound layer (all sound lives in project.json → audio), no pixels → fast
  if (audioOnly) return <TimebaseProvider fps={fps}><AudioTrack audio={p.audio} totalBase={totalBase(p)} /></TimebaseProvider>;
  setCopy(p.copy);
  applyBrand(p.brand);
  const native = p.formats.includes(ratio);
  const stage = STAGES[ratio];
  const base = STAGES[(native ? ratio : p.formats[0]) as Ratio];
  const fit = Math.min(stage.w / base.w, stage.h / base.h);
  return (
    <TimebaseProvider fps={fps}>
      <AbsoluteFill style={{background: p.look?.background || C.navyDeep, overflow: 'hidden'}}>
        {native ? (
          <FormatProvider ratio={ratio} native>
            <SceneStack p={p} fps={fps} />
          </FormatProvider>
        ) : (
          // FIT mode: project has no layout for this ratio yet → place the primary layout centred on a brand background
          <FormatProvider ratio={p.formats[0]} native={false}>
            <AbsoluteFill style={{background: `radial-gradient(80% 60% at 50% 30%, ${C.purple}33, transparent 70%), radial-gradient(70% 50% at 50% 90%, ${C.mint}22, transparent 70%), ${C.navyDeep}`}} />
            <div style={{position: 'absolute', left: (stage.w - base.w * fit) / 2, top: (stage.h - base.h * fit) / 2, width: base.w, height: base.h, transform: `scale(${fit})`, transformOrigin: '0 0', overflow: 'hidden', borderRadius: 8}}>
              <SceneStack p={p} fps={fps} />
            </div>
          </FormatProvider>
        )}
        <FormatProvider ratio={ratio} native={native}>
          <Overlays items={p.overlays} layer="under" totalSec={totalBase(p) / 30} />
          {titles && <Titles items={p.titles} />}
          {subtitles && <Subtitles cfg={p.subtitles} />}
          <Overlays items={p.overlays} layer="top" totalSec={totalBase(p) / 30} />
        </FormatProvider>
        <FilmFinish grain={p.look?.grain ?? 0.05} vignette={p.look?.vignette ?? 0.42} />
        {audio && <AudioTrack audio={p.audio} totalBase={totalBase(p)} />}
      </AbsoluteFill>
    </TimebaseProvider>
  );
};

/** One scene alone (preview / "Chỉ cảnh" export): the full film shifted so the scene starts at 0 —
 *  keeps titles, subtitles, audio, crossfades and fit mode identical to the full render. */
export const SceneOnly: React.FC<MainProps & {sceneId: string}> = (props) => {
  const s = props.project.scenes.find((x) => x.id === props.sceneId) || props.project.scenes[0];
  const off = toReal(Math.max(0, s.start - OV), props.fps);
  return (
    <Sequence from={-off}>
      <Main {...props} />
    </Sequence>
  );
};
