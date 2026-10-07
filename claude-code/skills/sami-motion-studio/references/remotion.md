# Remotion scenes (TSX): v1 projects and React-heavy scenes

Full rules: `<app>/docs/PROJECT_GUIDE.md`.

- One file per scene `scenes/<ID>.tsx`, exported component registered in `scenes/index.ts` (`export const REG = {S01, S02}`).
- Imports: `@engine/components/{Brand,Devices,Text,Icon}`, `@engine/lib/anim` (`tw`, `keys`, `arrive`, `leave`, `beat`, `rnd` = the ONE easing), `@engine/lib/useT`, `@engine/core/format` (`useFormat`, `usePick`, `SAFE`), `@engine/core/copy` (`COPY.X`), `@engine/core/media` (`media()`), `@engine/theme` (`C`, `F`, `GRAD`), shared helpers `@lib/…` (`<app>/lib/remotion`).
- Time: `const t = useT()` (scene-local base frames, 0 = cut beat; warp-aware). Never `useCurrentFrame()`.
- `<Words start={x + OV}>`, `<Counter>`, `<TypeLabel>` run on Sequence frames → add `OV`.
- Read `COPY.X` inside the component (live edits), image slots are copy keys ending `_image/_logo/_img/_photo` → `media(COPY.S03_image)`.
- Layout per ratio with `usePick({'16:9':…, '9:16':…, '1:1':…})`; respect `SAFE[ratio]`.
- Stretching a finished scene = `warp` (Studio does it on duration change), don't re-time animations.
- Helpers copied between projects belong in `<app>/lib/remotion/` (import `@lib/…`), not duplicated per project (`node <app>/tools/migrate.mjs` lists duplicates).
