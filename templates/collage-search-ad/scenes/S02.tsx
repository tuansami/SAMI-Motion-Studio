import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useT} from '@engine/lib/useT';
import {tw, rnd} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {Kraft, Piece, Tape, Slips, sans, hand, land, STAR} from './_collage';

// S02 · The ad card is assembled from cut-outs: white card → "Anzeige" tag + URL strip → ransom-note headline
// (one slip every 6 frames) → description strip → five paper stars → two link slips. All sample text.
export const S02: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const L = usePick({
    '16:9': {cx: 250, cy: 150, cw: 1420, ch: 760, pad: 70, hs: 76, ds: 36, star: 62, chip: 40, gap: 34},
    '9:16': {cx: 60, cy: 380, cw: 960, ch: 1000, pad: 60, hs: 80, ds: 40, star: 70, chip: 42, gap: 52},
  });
  const ix = L.cx + L.pad;
  const iw = L.cw - L.pad * 2;
  const tagP = land(t, 12, 21, -3, 0.3);
  const urlP = land(t, 16, 23, 0.5, 0.2);
  const descP = land(t, 78, 27, -0.5, 0.2);
  const rateP = land(t, 130, 29, -3, 0.3);
  return (
    <AbsoluteFill>
      <Kraft id="c2" />
      <AbsoluteFill style={{transform: `scale(${1 + tw(t, -8, 200) * 0.03})`}}>
        <Piece x={L.cx} y={L.cy} w={L.cw} h={L.ch} t={t} at={0} seed={31} rot={-0.8} amp={9} />
        <Tape x={L.cx + 60} y={L.cy + 10} t={t} at={4} seed={33} rot={-34} />
        <Tape x={L.cx + L.cw - 60} y={L.cy + 14} t={t} at={6} seed={35} rot={30} />
        <div style={{position: 'absolute', left: ix, top: L.cy + L.pad, width: iw, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: L.gap}}>
          {/* label + url */}
          <div style={{display: 'flex', alignItems: 'center', gap: 22, height: 50}}>
            {tagP ? (
              <div style={{...tagP, filter: 'drop-shadow(0 3px 2px rgba(40,25,10,0.3))'}}>
                <div style={{background: C.ink, color: C.paper, fontFamily: sans(), fontWeight: 700, fontSize: 30, padding: '8px 18px', letterSpacing: '0.02em'}}>{COPY.S02_label}</div>
              </div>
            ) : null}
            {urlP ? <div style={{...urlP, fontFamily: sans(), fontWeight: 500, fontSize: 32, color: C.ink, opacity: 0.75}}>{COPY.S02_url}</div> : null}
          </div>
          {/* headline as ransom slips */}
          <Slips text={COPY.S02_headline} t={t} at={30} step={6} size={L.hs} seed={70} align="left" maxWidth={iw} />
          <div style={{width: '100%', visibility: descP ? 'visible' : 'hidden', ...(descP || {})}}>
            <div style={{fontFamily: sans(), fontWeight: 400, fontSize: L.ds, lineHeight: 1.35, color: C.ink, borderLeft: `6px solid ${C.accent}`, paddingLeft: 20}}>{COPY.S02_desc}</div>
          </div>
          {/* paper stars */}
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            {[0, 1, 2, 3, 4].map((k) => {
              const p = land(t, 100 + k * 6, 80 + k, (rnd(k + 4) - 0.5) * 16, 1.2);
              return (
                <div key={k} style={{width: L.star, height: L.star, visibility: p ? 'visible' : 'hidden', filter: 'drop-shadow(0 3px 2px rgba(40,25,10,0.35))', ...(p || {})}}>
                  <div style={{width: '100%', height: '100%', background: C.accent, clipPath: STAR}} />
                </div>
              );
            })}
            <div style={{visibility: rateP ? 'visible' : 'hidden', ...(rateP || {}), marginLeft: 18, fontFamily: hand(), fontWeight: 700, fontSize: L.star * 0.8, color: C.ink}}>{COPY.S02_rating}</div>
          </div>
          {/* link slips */}
          <div style={{display: 'flex', gap: 28, flexWrap: 'wrap'}}>
            {[COPY.S02_link1, COPY.S02_link2].map((s, k) => {
              const p = land(t, 145 + k * 8, 90 + k, k ? 2 : -2, 0.4);
              return (
                <div key={k} style={{visibility: p ? 'visible' : 'hidden', filter: 'drop-shadow(0 4px 3px rgba(40,25,10,0.3))', ...(p || {})}}>
                  <div style={{background: k ? C.accent : C.kraft, color: k ? C.paper : C.ink, fontFamily: sans(), fontWeight: 700, fontSize: L.chip, padding: '16px 30px', border: k ? 'none' : `3px solid ${C.ink}`}}>{s}</div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
