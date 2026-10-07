import React, {createContext, useContext, useEffect, useRef, useState} from 'react';
import {AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, getRemotionEnvironment} from 'remotion';
import {useFormat, STAGES} from './format';
import type {ProjectJSON, SceneDef} from './types';

/**
 * A scene written for Hyperframes (HTML + CSS + GSAP, project.json → scenes[i].engine = 'hyperframes').
 *  • Render: plays the clip the Studio rendered with the Hyperframes CLI (public/_hf/…mp4, cached by content hash).
 *  • Preview: the live HTML in an iframe (/hfp/<project>/<scene>/<ratio>/index.html), seeked frame by frame.
 * Clip time 0 = the start of the scene's Sequence (cut − 8 base frames), same as the iframe.
 */
export type HfInfo = {clips?: Record<string, string>; base?: string; rev?: number | string};
export const HfCtx = createContext<HfInfo>({});
export const isHfScene = (s: SceneDef) => s.engine === 'hyperframes' || /\.html?$/i.test(s.src || '');

const Card: React.FC<{title: string; text: string}> = ({title, text}) => (
  <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', background: '#14102e', color: '#fff', fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: 80}}>
    <div style={{fontSize: 56, fontWeight: 800, marginBottom: 20}}>{title}</div>
    <div style={{fontSize: 30, opacity: 0.7, maxWidth: 1200}}>{text}</div>
  </AbsoluteFill>
);

export const HfScene: React.FC<{scene: SceneDef; project: ProjectJSON}> = ({scene, project}) => {
  const hf = useContext(HfCtx);
  const f = useFormat();
  if (getRemotionEnvironment().isRendering) {
    const clip = hf.clips?.[scene.id];
    if (!clip) return <Card title={`Cảnh HTML ${scene.id} chưa có clip`} text="Xuất video từ Studio để render cảnh Hyperframes trước khi ghép." />;
    return <OffthreadVideo src={staticFile(clip)} muted style={{width: '100%', height: '100%'}} />;
  }
  return <HfLive scene={scene} project={project} ratio={f.ratio} base={hf.base} rev={hf.rev} />;
};

const HfLive: React.FC<{scene: SceneDef; project: ProjectJSON; ratio: string; base?: string; rev?: number | string}> = ({scene, project, ratio, base, rev}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ref = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const st = STAGES[ratio as keyof typeof STAGES] || STAGES['16:9'];
  const t = frame / fps;
  // live copy/brand edits from the Studio tabs (unsaved) → the shim reloads the scene with the new data
  const copy: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(project.copy || {})) copy[k] = (v as any)?.value;
  const data = JSON.stringify({copy, brand: project.brand || {}});
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow || !e.data) return;
      if (e.data.sami === 'ready') { setErr(null); setReady((n) => n + 1); }
      if (e.data.sami === 'error') setErr(String(e.data.message || 'lỗi'));
    };
    window.addEventListener('message', on);
    return () => window.removeEventListener('message', on);
  }, []);
  useEffect(() => { ref.current?.contentWindow?.postMessage({sami: 'data', data}, '*'); }, [data, ready]);
  useEffect(() => { ref.current?.contentWindow?.postMessage({sami: 'seek', t, id: frame}, '*'); }, [t, ready, frame]);
  if (!base) return <Card title={`Cảnh HTML ${scene.id}`} text="Chỉ xem được trong Studio." />;
  const tag = ratio.replace(':', 'x');
  return (
    <AbsoluteFill>
      <iframe ref={ref} title={scene.id} src={`${base}${scene.id}/${tag}/index.html?v=${rev ?? 0}`}
        style={{border: 0, width: st.w, height: st.h, pointerEvents: 'none', background: 'transparent'}} />
      {err ? <div style={{position: 'absolute', left: 20, bottom: 20, right: 20, background: '#a00', color: '#fff', font: '22px Inter, sans-serif', padding: 12, borderRadius: 8}}>{scene.id}: {err}</div> : null}
    </AbsoluteFill>
  );
};
