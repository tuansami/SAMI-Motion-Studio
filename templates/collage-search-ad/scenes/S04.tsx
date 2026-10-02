import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {useT} from '@engine/lib/useT';
import {tw} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {Kraft, Piece, Tape, Slips, hand, land, snap} from './_collage';

// S04 · Guests arrive: on the navy ink page, the guests photo and the dish photo land as torn magazine cut-outs
// (white border, tape), the ransom headline lands word by word, a handwritten note + red cut-out arrow close it.
export const S04: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const L = usePick({
    '16:9': {g: [130, 210, 900, 560, -3], d: [1110, 470, 430, 430, 5], head: [1080, 170, 720], hs: 92, note: [1120, 930], arrow: [1060, 960]},
    '9:16': {g: [60, 430, 960, 560, -2.5], d: [500, 940, 470, 470, 5], head: [70, 210, 940], hs: 92, note: [80, 1450], arrow: [330, 1350]},
  });
  const gImg = COPY.S04_guests_image;
  const dImg = COPY.S04_dish_image;
  const kb = 1.1 - tw(t, 0, 200) * 0.06;
  const noteP = land(t, 96, 51, -5, 0.3);
  const arrowP = land(t, 108, 53, 0, 0.6);
  const B = 16;
  return (
    <AbsoluteFill>
      <Kraft id="c4" dark />
      <AbsoluteFill style={{transform: `scale(${1 + tw(t, -8, 200) * 0.035})`}}>
        <Piece x={L.g[0]} y={L.g[1]} w={L.g[2]} h={L.g[3]} t={t} at={0} seed={41} rot={L.g[4]} amp={10}>
          <div style={{position: 'absolute', inset: B, overflow: 'hidden', background: C.ink}}>
            {gImg ? <Img src={staticFile(gImg)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${kb})`}} /> : null}
          </div>
        </Piece>
        <Tape x={L.g[0] + L.g[2] / 2} y={L.g[1] - 4} t={t} at={6} seed={43} rot={-3} w={220} />
        <Piece x={L.d[0]} y={L.d[1]} w={L.d[2]} h={L.d[3]} t={t} at={22} seed={45} rot={L.d[4]} shape="circle" amp={12}>
          <div style={{position: 'absolute', inset: B, overflow: 'hidden', borderRadius: '50%', background: C.ink}}>
            {dImg ? <Img src={staticFile(dImg)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.05 + tw(t, 22, 160) * 0.05}) rotate(${snap(t) * 0.04}deg)`}} /> : null}
          </div>
        </Piece>
        <Tape x={L.d[0] + L.d[2] * 0.82} y={L.d[1] + 40} t={t} at={28} seed={47} rot={42} w={160} />
        <div style={{position: 'absolute', left: L.head[0], top: L.head[1], width: L.head[2]}}>
          <Slips text={COPY.S04_headline} t={t} at={44} step={8} size={L.hs} seed={90} align={f.portrait ? 'center' : 'left'} />
        </div>
        {noteP ? <div style={{position: 'absolute', left: L.note[0], top: L.note[1], fontFamily: hand(), fontWeight: 700, fontSize: f.portrait ? 66 : 60, color: C.paper, whiteSpace: 'nowrap', ...noteP}}>{COPY.S04_note}</div> : null}
        {arrowP ? (
          <div style={{position: 'absolute', left: L.arrow[0], top: L.arrow[1], width: 120, height: 70, filter: 'drop-shadow(0 4px 3px rgba(0,0,0,0.4))', ...arrowP}}>
            <div style={{width: '100%', height: '100%', background: C.accent, clipPath: f.portrait ? 'polygon(0 30%, 62% 30%, 62% 0, 100% 50%, 62% 100%, 62% 70%, 0 70%)' : 'polygon(100% 30%, 38% 30%, 38% 0, 0 50%, 38% 100%, 38% 70%, 100% 70%)', transform: f.portrait ? 'rotate(-35deg)' : 'rotate(-25deg)'}} />
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
