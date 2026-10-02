import React from 'react';

/** Vector "chỉ dẫn" stickers — recolourable, drawn on with `p` (0→1). viewBox 0 0 100 100. */
type SP = {p: number; color: string; stroke: number};
const Path: React.FC<SP & {d: string; fill?: boolean}> = ({d, p, color, stroke, fill}) => (
  <path d={d} pathLength={1} fill={fill ? color : 'none'} fillOpacity={fill ? Math.min(1, p * 1.6) : 0} stroke={color} strokeWidth={stroke}
    strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - Math.min(1, p)} />
);
const seg = (p: number, a: number, b: number) => Math.max(0, Math.min(1, (p - a) / (b - a)));

export const STICKERS: Record<string, {label: string; aspect: number; draw: React.FC<SP>}> = {
  arrow: {label: 'Mũi tên thẳng', aspect: 1, draw: (s) => <>
    <Path {...s} p={seg(s.p, 0, 0.7)} d="M10 50 L86 50" />
    <Path {...s} p={seg(s.p, 0.55, 1)} d="M64 28 L88 50 L64 72" /></>},
  'arrow-curve': {label: 'Mũi tên cong', aspect: 1, draw: (s) => <>
    <Path {...s} p={seg(s.p, 0, 0.75)} d="M12 78 C 22 30, 60 18, 84 30" />
    <Path {...s} p={seg(s.p, 0.6, 1)} d="M66 16 L86 31 L68 48" /></>},
  circle: {label: 'Vòng khoanh (nhấn mạnh)', aspect: 1.6, draw: (s) => <Path {...s} d="M52 14 C 18 12, 4 34, 8 54 C 12 80, 58 90, 84 78 C 104 68, 98 30, 70 18 C 58 13, 40 14, 30 20" />},
  underline: {label: 'Gạch chân', aspect: 5, draw: (s) => <Path {...s} d="M4 60 C 30 40, 60 70, 96 44" />},
  tap: {label: 'Chạm / bấm vào', aspect: 1, draw: (s) => <>
    <circle cx={50} cy={50} r={10 + 30 * s.p} fill="none" stroke={s.color} strokeWidth={s.stroke * 0.8} opacity={1 - s.p * 0.85} />
    <circle cx={50} cy={50} r={9} fill={s.color} opacity={Math.min(1, s.p * 3)} /></>},
  check: {label: 'Dấu tick', aspect: 1, draw: (s) => <Path {...s} d="M18 54 L40 76 L84 26" />},
  cross: {label: 'Dấu X', aspect: 1, draw: (s) => <><Path {...s} p={seg(s.p, 0, 0.55)} d="M22 22 L78 78" /><Path {...s} p={seg(s.p, 0.45, 1)} d="M78 22 L22 78" /></>},
  star: {label: 'Ngôi sao', aspect: 1, draw: (s) => <Path {...s} fill d="M50 8 L61 38 L93 38 L67 57 L77 88 L50 69 L23 88 L33 57 L7 38 L39 38 Z" />},
  heart: {label: 'Trái tim', aspect: 1, draw: (s) => <Path {...s} fill d="M50 86 C 18 64, 6 44, 14 28 C 22 12, 44 12, 50 30 C 56 12, 78 12, 86 28 C 94 44, 82 64, 50 86 Z" />},
  'swipe-up': {label: 'Vuốt lên', aspect: 0.8, draw: (s) => <>
    {[0, 1, 2].map((i) => <Path key={i} {...s} p={seg(s.p, i * 0.25, i * 0.25 + 0.5)} d={`M26 ${78 - i * 22} L50 ${56 - i * 22} L74 ${78 - i * 22}`} />)}</>},
  sparkle: {label: 'Lấp lánh', aspect: 1, draw: (s) => <>
    <Path {...s} fill d="M50 10 C 54 40, 60 46, 90 50 C 60 54, 54 60, 50 90 C 46 60, 40 54, 10 50 C 40 46, 46 40, 50 10 Z" /></>},
  pin: {label: 'Ghim vị trí (Maps)', aspect: 1, draw: (s) => <>
    <Path {...s} d="M50 90 C 30 64, 20 50, 20 36 C 20 18, 34 8, 50 8 C 66 8, 80 18, 80 36 C 80 50, 70 64, 50 90 Z" />
    <circle cx={50} cy={36} r={10 * Math.min(1, s.p * 1.4)} fill={s.color} /></>},
};

export const Sticker: React.FC<{id: string; p: number; color?: string; stroke?: number; style?: React.CSSProperties}> = ({id, p, color = '#08DDA4', stroke = 6, style}) => {
  const S = STICKERS[id] || STICKERS.arrow;
  const vbH = 100 / S.aspect; const y0 = (100 - vbH) / 2;
  return (
    <svg viewBox={`0 ${y0} 100 ${vbH}`} style={{width: '100%', height: 'auto', display: 'block', overflow: 'visible', ...style}}>
      <S.draw p={p} color={color} stroke={stroke} />
    </svg>
  );
};
