import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Words} from '@engine/components/Text';
import {useT} from '@engine/lib/useT';
import {tw, keys} from '@engine/lib/anim';
import {useFormat} from '@engine/core/format';
import {COPY} from '@engine/core/copy';
import {OV} from '@engine/core/constants';
import {C} from '@engine/theme';
import {Paper, RegMarks, PressFilters, DISPLAY, MONO, beatIdx, fitSize, alpha} from './kit';

// S05 · Before / after: the same dishes and prices, once as a bland default list, once as the riso menu.
// The divider moves on beats (1→2→4→5) and ends with the new menu filling the frame.

const items = () => [1, 2, 3, 4].map((i) => ({name: String(COPY[`S04_item${i}`] || ''), price: String(COPY[`S04_price${i}`] || '')}));

const Before: React.FC<{w: number; h: number; portrait: boolean}> = ({w, h, portrait}) => {
  const cur = COPY.S04_currency ? ` ${COPY.S04_currency}` : '';
  return (
    <div style={{position: 'absolute', inset: 0, background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: portrait ? 26 : 22, fontFamily: 'Roboto, Arial, sans-serif', color: alpha(C.ink, 0.62)}}>
      <div style={{fontSize: portrait ? 50 : 46, fontStyle: 'italic', textDecoration: 'underline', marginBottom: 14}}>{COPY.S05_oldtitle}</div>
      {items().map((it, i) => (
        <div key={i} style={{fontSize: portrait ? 34 : 30, width: Math.min(w * 0.7, 640), display: 'flex', justifyContent: 'space-between'}}>
          <span>{it.name}</span>
          <span>{it.price + cur}</span>
        </div>
      ))}
    </div>
  );
};

const After: React.FC<{w: number; h: number; portrait: boolean}> = ({w, h, portrait}) => {
  const cur = COPY.S04_currency ? ` ${COPY.S04_currency}` : '';
  const src = staticFile(COPY.S02_image || 'img/placeholder_dish.jpg');
  const imgW = portrait ? w - 120 : Math.round(w * 0.4);
  const imgH = portrait ? Math.round(h * 0.42) : h - 120;
  const listW = portrait ? w - 120 : w - imgW - 180;
  const tfs = fitSize([String(COPY.S04_title || '')], listW, portrait ? 84 : 80);
  const nfs = fitSize(items().map((x) => x.name), listW * 0.62, portrait ? 40 : 38);
  return (
    <div style={{position: 'absolute', inset: 0, background: C.sheet, display: 'flex', flexDirection: portrait ? 'column' : 'row', padding: 60, gap: 60, alignItems: portrait ? 'center' : 'stretch'}}>
      <div style={{position: 'relative', width: imgW, height: imgH, background: C.sheet, overflow: 'hidden', flexShrink: 0}}>
        <Img src={src} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'url(#x5-blue)', mixBlendMode: 'multiply', transform: 'translate(6px, 4px)'}} />
        <Img src={src} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'url(#x5-red)', mixBlendMode: 'multiply'}} />
      </div>
      <div style={{width: listW, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: portrait ? 18 : 16}}>
        <div style={{fontFamily: DISPLAY(), fontSize: tfs, lineHeight: 1, color: C.ink, marginBottom: 12, whiteSpace: 'nowrap'}}>{COPY.S04_title}</div>
        {items().map((it, i) => (
          <div key={i} style={{display: 'flex', alignItems: 'baseline', gap: 14, paddingBottom: 10, borderBottom: `3px solid ${alpha(C.blue, 0.55)}`}}>
            <span style={{fontFamily: DISPLAY(), fontSize: nfs, color: C.blue, whiteSpace: 'nowrap'}}>{it.name}</span>
            <span style={{flex: 1}} />
            <span style={{fontFamily: MONO(), fontWeight: 600, fontSize: nfs * 0.95, color: C.red, whiteSpace: 'nowrap'}}>{it.price + cur}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const S05: React.FC = () => {
  const t = useT();
  const f = useFormat();
  const b = beatIdx(t);
  // divider: 1 = all "before", 0 = all "after"
  const d = keys(t, [[0, 1], [15, 1], [27, 0.5], [45, 0.5], [57, 0.2], [75, 0.2], [87, 0]]);
  const box = f.portrait ? {x: 72, y: 250, w: 936, h: 1080} : {x: 160, y: 80, w: 1600, h: 770};
  const lab = (txt: string, on: boolean, style: React.CSSProperties) => (
    <div style={{position: 'absolute', padding: '10px 18px', background: on ? C.red : C.ink, color: C.sheet, fontFamily: MONO(), fontWeight: 600, fontSize: f.portrait ? 26 : 22, letterSpacing: '0.18em', ...style}}>{txt}</div>
  );
  const clipAfter = f.portrait ? `inset(${d * 100}% 0 0 0)` : `inset(0 0 0 ${d * 100}%)`;
  const appear = tw(t, -4, 10);
  return (
    <AbsoluteFill>
      <Paper />
      <PressFilters id="x5" seed={b + 61} dot={10} />
      <RegMarks />
      <div style={{position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, overflow: 'hidden', boxShadow: `0 30px 70px ${alpha(C.ink, 0.2)}`, opacity: appear, transform: `scale(${0.96 + appear * 0.04})`}}>
        <Before w={box.w} h={box.h} portrait={f.portrait} />
        <div style={{position: 'absolute', inset: 0, clipPath: clipAfter}}>
          <After w={box.w} h={box.h} portrait={f.portrait} />
        </div>
        {/* divider */}
        <div style={f.portrait ? {position: 'absolute', left: 0, right: 0, top: `${d * 100}%`, height: 8, marginTop: -4, background: C.ink} : {position: 'absolute', top: 0, bottom: 0, left: `${d * 100}%`, width: 8, marginLeft: -4, background: C.ink}} />
        {lab(String(COPY.S05_before || ''), false, {left: 24, top: 24, opacity: d > 0.12 ? 1 : 0})}
        {lab(String(COPY.S05_after || ''), true, f.portrait ? {left: 24, bottom: 24, opacity: d < 0.92 ? 1 : 0} : {right: 24, top: 24, opacity: d < 0.92 ? 1 : 0})}
      </div>
      <div style={{position: 'absolute', left: box.x, right: box.x, top: box.y + box.h + (f.portrait ? 50 : 44), textAlign: 'center'}}>
        <Words text={COPY.S05_caption} start={OV + 30} stagger={5} hlColor={C.red} style={{fontFamily: DISPLAY(), fontWeight: 400, fontSize: f.portrait ? 62 : 64, color: C.ink, letterSpacing: '-0.01em', lineHeight: 1.05}} />
      </div>
    </AbsoluteFill>
  );
};
