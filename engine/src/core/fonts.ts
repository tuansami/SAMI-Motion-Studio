// Bundled fonts (all with Vietnamese subsets). Add more: npm i @fontsource/<name> and list it here.
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/be-vietnam-pro/700.css';
import '@fontsource/be-vietnam-pro/800.css';
import '@fontsource/be-vietnam-pro/900.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/roboto/900.css';
import '@fontsource/oswald/400.css';
import '@fontsource/oswald/500.css';
import '@fontsource/oswald/600.css';
import '@fontsource/oswald/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/nunito/900.css';
import '@fontsource/lora/400.css';
import '@fontsource/lora/500.css';
import '@fontsource/lora/600.css';
import '@fontsource/lora/700.css';
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/500.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/cormorant/500.css';
import '@fontsource/cormorant/600.css';
import '@fontsource/cormorant/700.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/playfair-display/400-italic.css';
import '@fontsource/cormorant/500-italic.css';
// 0.2.2 — display fonts for the trend templates (some have no Vietnamese subset: use for German/English copy only)
import '@fontsource/anton/400.css';
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/700.css';
import '@fontsource/fraunces/900.css';
import '@fontsource/caveat/500.css';
import '@fontsource/caveat/700.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/dm-serif-display/400.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/vt323/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/archivo-black/400.css';
import '@fontsource/silkscreen/400.css';
import '@fontsource/silkscreen/700.css';
import '@fontsource/bricolage-grotesque/400.css';
import '@fontsource/bricolage-grotesque/700.css';
import '@fontsource/bricolage-grotesque/800.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/600.css';
import {continueRender, delayRender} from 'remotion';

export const FONTS = [
  {family: 'Be Vietnam Pro', weights: [400, 500, 600, 700, 800, 900]},
  {family: 'Inter', weights: [400, 500, 600, 700, 800]},
  {family: 'Montserrat', weights: [400, 500, 600, 700, 800, 900]},
  {family: 'Roboto', weights: [400, 500, 700, 900]},
  {family: 'Oswald', weights: [400, 500, 600, 700]},
  {family: 'Nunito', weights: [400, 600, 700, 800, 900]},
  {family: 'Lora', weights: [400, 500, 600, 700]},
  {family: 'Playfair Display', weights: [400, 500, 600, 700]},
  {family: 'Cormorant', weights: [500, 600, 700]},
  {family: 'JetBrains Mono', weights: [500]},
  {family: 'Anton', weights: [400]},
  {family: 'Fraunces', weights: [400, 700, 900]},
  {family: 'Caveat', weights: [500, 700]},
  {family: 'Space Grotesk', weights: [400, 500, 700]},
  {family: 'DM Serif Display', weights: [400]},
  {family: 'DM Sans', weights: [400, 500, 700]},
  {family: 'VT323', weights: [400]},
  {family: 'Fredoka', weights: [500, 700]},
  {family: 'Archivo Black', weights: [400]},
  {family: 'Silkscreen', weights: [400, 700]},
  {family: 'Bricolage Grotesque', weights: [400, 700, 800]},
  {family: 'IBM Plex Mono', weights: [400, 600]},
];

if (typeof document !== 'undefined') {
  const h = delayRender('fonts');
  const specs = FONTS.flatMap((f) => f.weights.map((w) => `${w} 40px "${f.family}"`));
  Promise.all(specs.map((s) => document.fonts.load(s, 'Ấy ỗ Đặt bàn € ß ü'))).then(() => document.fonts.ready).then(() => continueRender(h)).catch(() => continueRender(h));
}
