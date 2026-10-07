# QA

Run in the project folder (no server needed):
- `node <app>/server/cli-validate.mjs .` → ✗ must be 0. Checks timeline continuity, missing files (incl. `lib:`), TSX registration, HTML scenes (composition id, timeline, CDN, random/Date/rAF), audio files, overlays, titles.
- `node <app>/server/cli-still.mjs . out/qa/S03.jpg 20,60,110 9:16` → Read `out/qa/S03_<frame>.jpg`. Frames are REAL frames at the given fps (default 30). Frames inside HTML scenes = fast snapshot (scene only). Add `--exact` to render the cached clips and see titles/overlays/crossfade exactly as exported. `--copy row.json` previews a CSV variant.
- Every ratio in `formats`. Look for: clipped text, stacked Vietnamese diacritics, < 20 px text, safe areas (9:16 top 220 / bottom 380), dead frames, beats, invented numbers, reading time.
- Templates: `node <app>/server/cli-template.mjs check templates/<id>` (no ✗) and `thumbs`.
- HTML linter: Hyperframes' own `lint` via `POST /api/hf/lint {id, scene}` (Studio running).
