import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useT} from '@engine/lib/useT';
import {tw} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {Kraft, Piece, Tape, Slips, snap, sans, dserif, hand, land} from './_collage';

// S05 · Three sticky notes land on beats with SAMPLE numbers that count up on twos; a "Beispielwerte" slip
// makes clear they are examples (replace with the client's real numbers).

/** count the first number inside a string from 0 → value (keeps prefix/suffix, German decimal comma) */
const countUp = (s: string, p: number) => {
  const m = (s || '').match(/(\d[\d.]*)(,\d+)?/);
  if (!m) return s;
  const intPart = m[1].replace(/\./g, '');
  const dec = m[2] ? m[2].length - 1 : 0;
  const v = parseFloat(intPart + (m[2] ? '.' + m[2].slice(1) : '')) * p;
  let out = v.toFixed(dec).replace('.', ',');
  if (m[1].includes('.')) out = out.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return s.replace(m[0], out);
};

export const S05: React.FC = () => {
  const t = useT();
  const ts = snap(t);
  const f = useFormat();
  const L = usePick({
    '16:9': {s: 400, pos: [[290, 330, -4], [760, 300, 2.5], [1230, 340, -2]], head: [260, 130, 1400], hs: 72, disc: [1480, 820]},
    '9:16': {s: 380, pos: [[120, 520, -4], [580, 760, 3], [150, 1060, -2]], head: [70, 230, 940], hs: 70, disc: [600, 1260]},
  });
  const notes = [
    {v: COPY.S05_n1_value, l: COPY.S05_n1_label, bg: C.paper, fg: C.ink, ac: C.accent},
    {v: COPY.S05_n2_value, l: COPY.S05_n2_label, bg: C.accent, fg: C.paper, ac: C.paper},
    {v: COPY.S05_n3_value, l: COPY.S05_n3_label, bg: C.ink, fg: C.paper, ac: C.kraft},
  ];
  const AT = [20, 44, 68];
  const discP = land(t, 104, 77, -4, 0.3);
  return (
    <AbsoluteFill>
      <Kraft id="c5" />
      <AbsoluteFill style={{transform: `scale(${1 + tw(t, -8, 200) * 0.03})`}}>
        <div style={{position: 'absolute', left: L.head[0], top: L.head[1], width: L.head[2]}}>
          <Slips text={COPY.S05_title} t={t} at={0} step={5} size={L.hs} seed={110} />
        </div>
        {notes.map((n, i) => {
          const [x, y, r] = L.pos[i];
          const p = tw(ts, AT[i] + 6, 26);
          return (
            <React.Fragment key={i}>
              <Piece x={x} y={y} w={L.s} h={L.s} t={t} at={AT[i]} seed={120 + i * 3} rot={r} bg={n.bg} amp={3} edges="b">
                <div style={{position: 'absolute', inset: 0, padding: '46px 38px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14}}>
                  <div style={{fontFamily: dserif(), fontSize: L.s * 0.29, lineHeight: 1, color: n.fg, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums'}}>{countUp(n.v, p)}</div>
                  <div style={{fontFamily: hand(), fontWeight: 700, fontSize: L.s * 0.12, lineHeight: 1.05, color: n.fg}}>{n.l}</div>
                  <div style={{alignSelf: 'flex-start', marginTop: 8, fontFamily: sans(), fontWeight: 700, fontSize: 20, letterSpacing: '0.14em', textTransform: 'uppercase', color: n.ac, border: `2px solid ${n.ac}`, padding: '4px 10px'}}>{COPY.S05_tag}</div>
                </div>
              </Piece>
              <Tape x={x + L.s / 2} y={y + 4} t={t} at={AT[i] + 4} seed={130 + i} rot={(i % 2 ? 4 : -5) + r} w={180} />
            </React.Fragment>
          );
        })}
        {discP ? (
          <div style={{position: 'absolute', left: L.disc[0], top: L.disc[1], fontFamily: hand(), fontWeight: 700, fontSize: f.portrait ? 54 : 48, color: C.ink, whiteSpace: 'nowrap', ...discP}}>{COPY.S05_disclaimer}</div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
