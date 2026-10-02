import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Icon} from '@engine/components/Icon';
import {useT} from '@engine/lib/useT';
import {keys, tw} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {Kraft, Piece, Tape, Slips, snap, sans, hand, land} from './_collage';

// S01 · A torn white paper search bar slaps onto kraft, gets taped, the query types itself on twos,
// the red cut-out button is pressed on the beat, then a ransom-note line lands underneath.
export const S01: React.FC = () => {
  const t = useT();
  const ts = snap(t);
  const f = useFormat();
  const L = usePick({
    '16:9': {bw: 1320, bh: 170, bx: 300, by: 330, fs: 64, note: [330, 205], slip: 600, sy: 600, ss: 66},
    '9:16': {bw: 960, bh: 150, bx: 60, by: 800, fs: 50, note: [90, 660], slip: 900, sy: 1030, ss: 70},
  });
  const q: string = COPY.S01_query || '';
  const n = Math.max(0, Math.min(q.length, Math.floor((ts - 14) / 2)));
  const caret = ts >= 12 && (n < q.length || Math.floor(ts / 8) % 2 === 0);
  const btn = L.bh * 0.78;
  const press = keys(ts, [[60, 1], [62, 0.82], [66, 1.06], [70, 1]]);
  const notePose = land(t, 8, 41, -4, 0.3);
  return (
    <AbsoluteFill>
      <Kraft id="c1" />
      <AbsoluteFill style={{transform: `scale(${1 + tw(t, -8, 140) * 0.03})`}}>
        {notePose ? (
          <div style={{position: 'absolute', left: L.note[0], top: L.note[1], fontFamily: hand(), fontWeight: 700, fontSize: f.portrait ? 64 : 58, color: C.ink, ...notePose}}>{COPY.S01_note}</div>
        ) : null}
        <Piece x={L.bx} y={L.by} w={L.bw} h={L.bh} t={t} at={0} seed={3} rot={-1.5} amp={8}>
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: L.bh * 0.22, padding: `0 ${L.bh * 0.2}px 0 ${L.bh * 0.36}px`}}>
            <Icon name="search" size={L.fs * 0.9} color={C.ink} stroke={2.6} />
            <div style={{flex: 1, fontFamily: sans(), fontWeight: 500, fontSize: L.fs, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden'}}>
              {q.slice(0, n)}
              <span style={{opacity: caret ? 1 : 0, color: C.accent, fontWeight: 400}}>|</span>
            </div>
          </div>
        </Piece>
        <Piece x={L.bx + L.bw - btn - L.bh * 0.12} y={L.by + (L.bh - btn) / 2} w={btn} h={btn} t={t} at={6} seed={9} shape="circle" bg={C.accent} amp={6} style={{scale: String(press)}}>
          <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Icon name="search" size={btn * 0.46} color={C.paper} stroke={3} />
          </div>
        </Piece>
        <Tape x={L.bx + 40} y={L.by + 10} t={t} at={4} seed={11} rot={-38} w={150} />
        <Tape x={L.bx + L.bw - 30} y={L.by + L.bh - 8} t={t} at={8} seed={17} rot={-30} w={150} />
        <div style={{position: 'absolute', left: (f.w - L.slip) / 2, top: L.sy, width: L.slip}}>
          <Slips text={COPY.S01_kicker} t={t} at={74} step={4} size={L.ss} seed={60} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
