import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SamiLockup} from '@engine/components/Brand';
import {Icon} from '@engine/components/Icon';
import {useT} from '@engine/lib/useT';
import {tw} from '@engine/lib/anim';
import {useFormat, usePick} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {C} from '@engine/theme';
import {Kraft, Piece, Tape, snap, sans, hand, land} from './_collage';

// S06 · SAMI end card: a navy torn panel is taped onto kraft, the SAMI lockup builds on it,
// tagline + white contact slips land on twos, a handwritten red note points at WhatsApp.
export const S06: React.FC = () => {
  const t = useT();
  const ts = snap(t);
  const f = useFormat();
  const L = usePick({
    '16:9': {p: [300, 170, 1320, 700], lk: 150, tag: 32, cs: 36},
    '9:16': {p: [70, 400, 940, 1000], lk: 150, tag: 36, cs: 38},
  });
  const [px, py, pw, ph] = L.p;
  const lp = tw(ts, 8, 34);
  const tagP = land(t, 28, 141, 0, 0.15);
  const ph1 = land(t, 40, 143, -1.5, 0.3);
  const ph2 = land(t, 46, 145, 1.5, 0.3);
  const noteP = land(t, 56, 147, -6, 0.4);
  const slip = (children: React.ReactNode, q: React.CSSProperties | null, bg: string) =>
    q ? (
      <div style={{filter: 'drop-shadow(0 5px 4px rgba(0,0,0,0.35))', ...q}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, background: bg, padding: '18px 32px'}}>{children}</div>
      </div>
    ) : (
      <div style={{visibility: 'hidden', padding: '18px 32px', fontSize: L.cs}}>.</div>
    );
  return (
    <AbsoluteFill>
      <Kraft id="c6" />
      <Piece x={px} y={py} w={pw} h={ph} t={t} at={-6} seed={151} rot={-1.2} bg={C.ink} rim amp={10} />
      <Tape x={px + 40} y={py + 20} t={t} at={0} seed={153} rot={-40} />
      <Tape x={px + pw - 40} y={py + 20} t={t} at={2} seed={155} rot={38} />
      <Tape x={px + 50} y={py + ph - 20} t={t} at={4} seed={157} rot={36} />
      <Tape x={px + pw - 50} y={py + ph - 20} t={t} at={6} seed={159} rot={-34} />
      <div style={{position: 'absolute', left: px, top: py, width: pw, height: ph, transform: 'rotate(-1.2deg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: f.portrait ? 48 : 34}}>
        <div style={{opacity: Math.min(1, lp * 1.6), transform: `scale(${1.05 - lp * 0.05})`}}>
          <SamiLockup height={L.lk} p={lp} id="cs6lk" />
        </div>
        <div style={{fontFamily: sans(), fontWeight: 500, fontSize: L.tag, color: C.paper, textAlign: 'center', maxWidth: f.portrait ? 520 : 1100, lineHeight: 1.35, opacity: tagP ? 1 : 0, ...(tagP || {})}}>{COPY.S06_tagline}</div>
        <div style={{display: 'flex', flexDirection: f.portrait ? 'column' : 'row', gap: f.portrait ? 22 : 26, alignItems: 'center'}}>
          {COPY.S06_phone
            ? slip(
                <>
                  <Icon name="message" size={L.cs} color={C.ink} stroke={2.4} />
                  <span style={{fontFamily: sans(), fontWeight: 700, fontSize: L.cs, color: C.ink}}>{COPY.S06_phone}</span>
                </>,
                ph1,
                C.paper,
              )
            : null}
          {COPY.S06_url
            ? slip(
                <>
                  <Icon name="globe" size={L.cs} color={C.paper} stroke={2.4} />
                  <span style={{fontFamily: sans(), fontWeight: 700, fontSize: L.cs, color: C.paper}}>{COPY.S06_url}</span>
                </>,
                ph2,
                C.accent,
              )
            : null}
        </div>
      </div>
      {noteP ? (
        <div style={{position: 'absolute', left: f.portrait ? 120 : px + 40, top: f.portrait ? py - 100 : py + ph + 34, fontFamily: hand(), fontWeight: 700, fontSize: f.portrait ? 64 : 58, color: C.accent, whiteSpace: 'nowrap', ...noteP}}>{COPY.S06_note}</div>
      ) : null}
    </AbsoluteFill>
  );
};
