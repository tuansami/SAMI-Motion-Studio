import React from 'react';
import {C} from '@engine/theme';
import {tw} from '@engine/lib/anim';
import {Brush, Stroke, arcD, serif, script} from './_paint';

// Sample restaurant mark "Mai Lan · Küche": enso wash → lotus petals → bowl → fine detail.
// Coordinates in a 400×400 box. `t` = local frame of the painting (big number = finished), `speed` > 1 paints faster.

export type MarkCols = {wash?: string; petal?: string; bowl?: string; fine?: string; hi?: string};

// stroke plan: [start, dur]
const PLAN = {
  enso: [0, 30],
  petalC: [15, 15],
  petalL: [22, 15],
  petalR: [29, 15],
  bowl: [34, 18],
  rim: [46, 12],
  vein: [120, 14],
  hi: [128, 12],
  foot: [134, 10],
} as const;

export const MARK_END = 146;

const PETALS = [
  {k: 'petalC' as const, shape: 'M 200 232 C 166 200 170 148 201 100 C 232 148 236 200 200 232 Z', axis: 'M 200 236 L 201 96', vein: 'M 200 214 C 198 186 199 158 201 128'},
  {k: 'petalL' as const, shape: 'M 194 234 C 148 228 122 192 118 144 C 158 158 186 190 194 234 Z', axis: 'M 196 238 L 116 140', vein: 'M 186 222 C 166 204 148 186 136 164'},
  {k: 'petalR' as const, shape: 'M 206 234 C 252 228 278 192 282 144 C 242 158 214 190 206 234 Z', axis: 'M 204 238 L 284 140', vein: 'M 214 222 C 234 204 252 186 264 164'},
];

export const Mark: React.FC<{id: string; x: number; y: number; size: number; t: number; fid: string; speed?: number; cols?: MarkCols; washOpacity?: number}> = ({id, x, y, size, t, fid, speed = 1, cols = {}, washOpacity = 0.62}) => {
  const tt = t * speed;
  const pr = (k: keyof typeof PLAN) => tw(tt, PLAN[k][0], PLAN[k][1]);
  const wash = cols.wash ?? C.olive;
  const petal = cols.petal ?? C.terracotta;
  const bowl = cols.bowl ?? C.ink;
  const fine = cols.fine ?? C.ink;
  const hi = cols.hi ?? C.paper;
  const s = size / 400;
  const mu = {maskUnits: 'userSpaceOnUse' as const, x: -60, y: -60, width: 520, height: 520};
  const pb = pr('bowl');
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${s})`}>
      <defs>
        {PETALS.map((pt) => (
          <mask key={pt.k} id={id + pt.k} {...mu}>
            <Stroke d={pt.axis} w={96} color="white" p={pr(pt.k)} filter={fid + 'r'} />
          </mask>
        ))}
        <mask id={id + 'bw'} {...mu}>
          <Stroke d="M 84 276 L 316 272" w={120} color="white" p={pb} filter={fid + 'r'} />
        </mask>
      </defs>
      {/* coarse: open enso circle */}
      <Brush d={arcD(200, 200, 162, 118, 418)} w={46} color={wash} p={pr('enso')} fid={fid} dry="g" opacity={washOpacity} />
      {/* coarse: three pointed lotus petals, painted from the base up */}
      {PETALS.map((pt) =>
        pr(pt.k) > 0.002 ? (
          <g key={pt.k} mask={`url(#${id + pt.k})`}>
            <path d={pt.shape} fill={petal} filter={`url(#${fid}v)`} />
          </g>
        ) : null,
      )}
      {/* solid bowl + rim */}
      {pb > 0.002 ? (
        <g mask={`url(#${id}bw)`}>
          <path d="M 100 238 C 110 326 290 326 300 238 Z" fill={bowl} filter={`url(#${fid}r)`} />
        </g>
      ) : null}
      <Stroke d="M 86 238 C 166 230 236 242 314 233" w={16} color={bowl} p={pr('rim')} filter={fid + 'r'} />
      {/* fine detail */}
      {PETALS.map((pt, i) => (
        <Stroke key={pt.k} d={pt.vein} w={3.5} color={fine} p={tw(tt, PLAN.vein[0] + i * 3, PLAN.vein[1])} filter={fid + 'w'} opacity={0.55} />
      ))}
      <Stroke d="M 130 262 C 160 282 214 288 252 279" w={6} color={hi} p={pr('hi')} filter={fid + 'w'} opacity={0.75} />
      <Stroke d="M 172 316 C 188 321 212 321 228 315" w={9} color={bowl} p={pr('foot')} filter={fid + 'w'} />
    </g>
  );
};

/** fit a font size so `text` stays inside `maxW` (rough glyph width estimate) */
export const fitSize = (text: string, base: number, maxW: number, em = 0.6) => Math.min(base, maxW / Math.max(1, (text || '').length * em));

/**
 * Painted wordmark: name (serif, heavy) revealed by a zig-zag brush mask, sub line (script) written on.
 * cx = centre x, top = top of the name. Returns its own <mask> defs (unique `id`).
 */
export const Wordmark: React.FC<{id: string; fid: string; cx: number; top: number; width: number; name: string; sub: string; t: number; color?: string; subColor?: string; ruleColor?: string; base?: number}> = ({id, fid, cx, top, width, name, sub, t, color, subColor, ruleColor, base = 170}) => {
  const fs = fitSize(name, base, width, 0.58);
  const subFs = fs * 0.5;
  const h = fs * 1.15;
  const x0 = cx - width / 2 - 40;
  const x1 = cx + width / 2 + 40;
  const zig = `M ${x0} ${top + h * 0.2} L ${x1} ${top + h * 0.12} L ${x0} ${top + h * 0.55} L ${x1} ${top + h * 0.5} L ${x0} ${top + h * 0.92} L ${x1} ${top + h * 0.9}`;
  const pName = tw(t, 0, 32);
  const pSub = tw(t, 30, 22);
  const pRule = tw(t, 40, 18);
  const subY = top + fs * 1.05 + subFs * 0.95;
  const subW = sub.length * subFs * 0.42;
  return (
    <g>
      <defs>
        <mask id={id + 'm'} maskUnits="userSpaceOnUse" x={x0 - 200} y={top - 200} width={x1 - x0 + 400} height={h + 600}>
          <Stroke d={zig} w={h * 0.44} color="white" p={pName} filter={fid + 'r'} />
        </mask>
        <mask id={id + 's'} maskUnits="userSpaceOnUse" x={x0 - 200} y={top - 200} width={x1 - x0 + 400} height={h + 600}>
          <Stroke d={`M ${cx - subW / 2 - 30} ${subY - subFs * 0.3} L ${cx + subW / 2 + 30} ${subY - subFs * 0.32}`} w={subFs * 1.5} color="white" p={pSub} filter={fid + 'r'} />
        </mask>
      </defs>
      <g mask={`url(#${id}m)`} filter={`url(#${fid}w)`}>
        <text x={cx} y={top + fs * 0.86} textAnchor="middle" fontFamily={serif()} fontWeight={900} fontSize={fs} letterSpacing={-fs * 0.02} fill={color ?? C.ink}>
          {name}
        </text>
      </g>
      <g mask={`url(#${id}s)`}>
        <text x={cx} y={subY} textAnchor="middle" fontFamily={script()} fontWeight={700} fontSize={subFs} fill={subColor ?? C.terracotta}>
          {sub}
        </text>
      </g>
      <Stroke d={`M ${cx - subW / 2 - subFs * 1.6} ${subY - subFs * 0.28} L ${cx - subW / 2 - subFs * 0.45} ${subY - subFs * 0.3}`} w={subFs * 0.09} color={ruleColor ?? C.olive} p={pRule} filter={fid + 'w'} />
      <Stroke d={`M ${cx + subW / 2 + subFs * 1.6} ${subY - subFs * 0.28} L ${cx + subW / 2 + subFs * 0.45} ${subY - subFs * 0.3}`} w={subFs * 0.09} color={ruleColor ?? C.olive} p={pRule} filter={fid + 'w'} />
    </g>
  );
};

/** height the wordmark occupies (name + sub) for layout */
export const wordmarkHeight = (name: string, width: number, base = 170) => {
  const fs = fitSize(name, base, width, 0.58);
  return fs * 1.05 + fs * 0.5 * 1.2;
};
