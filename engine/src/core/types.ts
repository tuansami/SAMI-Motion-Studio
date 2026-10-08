import type {Knots} from '../lib/warp';
import type {Ratio} from './format';

export type SceneDef = {
  id: string; label: string; start: number; end: number; // base frames (30 fps)
  warp?: Knots | null; animLength?: number; fadeIn?: number; fadeDelay?: number; note?: string;
  engine?: 'remotion' | 'hyperframes' | 'blank'; // 0.6: 'hyperframes' = HTML + CSS + GSAP scene in `src`; 0.9: 'blank' = empty span (footage only)
  src?: string;                         // hyperframes: 'hf/<id>.html' (paths inside are relative to the project root)
};
export type TextStyle = {
  font?: string; weight?: number; size?: number; color?: string; highlight?: string; uppercase?: boolean; letterSpacing?: number;
  lineHeight?: number; align?: 'left' | 'center' | 'right'; italic?: boolean;
  bg?: {color: string; opacity?: number; radius?: number; padX?: number; padY?: number} | null;
  stroke?: {color: string; width: number} | null; shadow?: boolean;
};
export type TitleAnim = 'rise' | 'fade' | 'pop' | 'slide' | 'typewriter' | 'words' | 'karaoke' | 'highlight' | 'none';
export type TitleItem = {
  id: string; text: string; start: number; end: number; // seconds
  anim?: TitleAnim; out?: 'fade' | 'rise' | 'none';
  style?: TextStyle; pos?: {x: number; y: number}; maxWidth?: number; // x,y: 0..1 of frame; maxWidth: 0..1
  formats?: Ratio[]; // show only in these ratios (empty = all)
};
export type OverlayAnim = 'fade' | 'pop' | 'rise' | 'slide-left' | 'slide-right' | 'zoom' | 'draw' | 'none';
export type OverlayItem = {
  id: string; kind: 'image' | 'sticker' | 'lottie'; label?: string;
  src?: string;                 // image / lottie: path inside public/ (img/logo.png, lottie/confetti.json)
  sticker?: string;             // sticker id (arrow, circle, tap, …) — drawn as vector, recolourable
  color?: string; stroke?: number;
  start: number; end: number; whole?: boolean;   // seconds; whole = entire video (watermark)
  pos?: {x: number; y: number}; width?: number;  // centre point 0..1 of frame; width as fraction of the frame's SHORT side (1080 px at FHD)
  opacity?: number; rotate?: number; radius?: number; shadow?: boolean; flip?: boolean;
  anim?: OverlayAnim; out?: 'fade' | 'none'; loop?: boolean; speed?: number; pulse?: boolean;
  layer?: 'top' | 'under'; formats?: Ratio[];
};
export type SubItem = {start: number; end: number; text: string};
export type AudioCue = {t: number; sfx: string; gain?: number; label?: string; src?: string; len?: number}; // src: own file in public/ (overrides sfx)
export type VoiceClip = {t: number; src: string; len: number; gain?: number; label?: string}; // voice-over line; len (s) drives music ducking
// 0.9 footage (seconds): at = start on the timeline, in/out = source range, speed = playback rate. volume: dB, null = muted.
export type VideoClip = {
  id: string; src: string; label?: string; role: 'main' | 'broll' | 'pip' | 'screen';
  at: number; in: number; out: number; speed?: number;
  fit?: 'cover' | 'contain'; mask?: 'none' | 'rounded' | 'circle' | 'phone' | 'laptop';
  pip?: {x: number; y: number; w: number; r?: number}; aspect?: number; border?: string; shadow?: boolean;
  volume?: number | null; duck?: boolean; fadeIn?: number; fadeOut?: number; z?: number; formats?: Ratio[];
};
export type ProjectJSON = {
  name: string; client?: string; version?: number;
  schemaVersion?: 1 | 2; type?: 'video' | 'carousel'; engine?: 'remotion' | 'hyperframes'; // 0.6 — engine = default for NEW scenes
  status?: 'draft' | 'review' | 'approved' | 'published'; // workflow label (Studio 0.5) — default 'draft', no effect on rendering
  formats: Ratio[]; baseFps?: 30;
  brand?: {colors?: Record<string, string>; fonts?: Record<string, string>; gradient?: string};
  look?: {grain?: number; vignette?: number; background?: string};
  scenes: SceneDef[];
  copy: Record<string, {label: string; scene?: string; value: any; hint?: string; multiline?: boolean}>;
  titles?: TitleItem[];
  tracks?: {video?: VideoClip[]};
  overlays?: OverlayItem[];
  subtitles?: {enabled: boolean; items: SubItem[]; style?: TextStyle; pos?: {x: number; y: number}; anim?: 'karaoke' | 'fade' | 'pop' | 'none'; maxWidth?: number};
  audio?: {
    mode: 'premix' | 'layers' | 'none';
    premix?: string; premixGain?: number;
    music?: {src: string; gain?: number; edit?: [number, number, number?][]; fadeOut?: number};
    cues?: AudioCue[];
    voice?: VoiceClip[]; duck?: number; // duck: music gain change (dB) while a voice clip plays, default -9
  };
};
export type MainProps = {project: ProjectJSON; ratio: Ratio; fps: number; titles?: boolean; audio?: boolean; subtitles?: boolean;
  hfClips?: Record<string, string>; hfBase?: string; hfRev?: number | string; // Hyperframes scenes: rendered clips (export) / live iframe base URL (preview)
  mediaBase?: string; mediaProxy?: boolean}; // 0.9 footage: HTTP base for media/ (preview: Studio /pm/<id>/ + 540p proxy; export: local media server, originals)
