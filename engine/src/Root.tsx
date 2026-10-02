import React from 'react';
import {Composition} from 'remotion';
import {Main, SceneOnly, totalBase} from './core/Main';
import {STAGES, type Ratio} from './core/format';
import {toReal} from './core/timebase';
import type {MainProps} from './core/types';
// @ts-ignore — provided by the Studio bundler alias
import projectJson from '@project/project.json';

const meta = (props: MainProps) => {
  const st = STAGES[props.ratio as Ratio] || STAGES['16:9'];
  return {width: st.w, height: st.h, fps: props.fps || 30, durationInFrames: Math.max(1, toReal(totalBase(props.project), props.fps || 30))};
};

export const RemotionRoot: React.FC = () => {
  const dp: MainProps = {project: projectJson as any, ratio: (projectJson as any).formats?.[0] || '16:9', fps: 30, titles: true, audio: true, subtitles: true};
  return (
    <>
      <Composition id="Main" component={Main as any} width={1920} height={1080} fps={30} durationInFrames={300} defaultProps={dp as any}
        calculateMetadata={({props}) => meta(props as any)} />
      <Composition id="Scene" component={SceneOnly as any} width={1920} height={1080} fps={30} durationInFrames={300}
        defaultProps={{...dp, sceneId: (projectJson as any).scenes?.[0]?.id} as any}
        calculateMetadata={({props}: any) => {
          const m = meta(props);
          const s = props.project.scenes.find((x: any) => x.id === props.sceneId) || props.project.scenes[0];
          return {...m, durationInFrames: Math.max(1, toReal(s.end - s.start + 16, m.fps))};
        }} />
    </>
  );
};
