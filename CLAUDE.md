# CLAUDE.md — SAMI Motion Studio (app)

Owner: Tuan (CEO SAMI) — reply in Vietnamese, concise, push back when a request hurts conversion/brand.

## Team workflow
`docs/QUY_TRINH_LAM_VIEC.md` — roles, gates, session/token rules, prompt library, TRANG_THAI.md format. Video work never happens in this app folder.

## Two kinds of work
1. **Video project work** (most common): open the *project folder* (has project.json) — follow `docs/PROJECT_GUIDE.md`. Touch only `scenes/`, `project.json`, `brief/`. Never edit `public/_engine`.
2. **App development** (Studio itself): follow `docs/KE_HOACH_PHAT_TRIEN.md`. Write a short spec in `docs/specs/` first, get OK, then code.

## Map
- `server/` Node API: index.mjs routes · render.mjs queue (parts + watchdog + resume; Hyperframes clips first, then spawns render-worker.mjs / bundle-worker.mjs — never render in the server process) · preview.mjs esbuild · ffmpeg.mjs (vendor → Remotion → PATH; async caps probe cached in .studio/caps.json; encoder test = encode a real PNG, bundled ffmpeg has no lavfi) · hf.mjs (Hyperframes: staging, clips, snapshots) · library.mjs (SAMI_Library, `lib:` URIs, hardlink materialize) · fslink.mjs (hardlink/junction) · env.mjs (child env: vendor ffmpeg on PATH, TEMP on Z:) · still.mjs (stills across engines) · carousel.mjs (type "carousel": per-slide audio via lib/py/sami_audio.py, Hyperframes render, QA, swipe preview) · audio.mjs · validate.mjs · assets.mjs · template.mjs (standard check, thumbs, import/export) · cli-*.mjs
- `lib/` shared CODE versioned with the app: `lib/hf` (SAMI runtime for HTML scenes: sami-hf.js, sami.css, shim.js) · `lib/remotion` (TSX helpers, alias `@lib`) · `lib/py/sami_audio.py` (numpy SFX + groove + seamless-loop mix) · `lib/hf/carousel.{js,css}` (CX toolkit) · `lib/hf/photo-slide.html`.
- `tools/` get-ffmpeg · cleanup · migrate · lib-seed · install-skills (all dry-run unless `--apply`) · carousel-new.
- Paths: `vendor/` (ffmpeg, gitignored) · `Z:\SAMI_Video\SAMI_Library` (assets, not git) · `Z:\SAMI_Video\.sami-cache` (deletable caches) · `%APPDATA%\SAMI` (keys/ledger from 0.8).
- Skill source of truth: `claude-code/skills/` → `node tools/install-skills.mjs --apply` copies to `~/.claude/skills` (no per-project copies).
- `engine/src/core` Main/Titles/Subtitles/AudioTrack/format/timebase/copy — shared by ALL projects: changes must stay backward compatible with existing project.json files.
- `ui/` vanilla JS SPA (index.html, app.js, style.css) — no build step.
- `templates/` project templates — must pass `docs/TEMPLATE_STANDARD.md` (`node server/cli-template.mjs check templates/<id>`).
- `engine/src/core/Overlays.tsx` + `Stickers.tsx` — image/sticker/Lottie overlays (project.json → overlays).

## Rules
- Base time is 30 fps; 24/60 fps via timebase k. Never use useCurrentFrame directly in scenes.
- One easing (engine/src/lib/anim.ts). No Math.random/Date in scenes.
- New project.json fields need defaults; bump package.json version.
- Test: `NO_OPEN=1 node server/index.mjs` + `node server/cli-still.mjs <dir> out/x.jpg <frames> <ratio>`; read the stills before claiming it works.
- Server must never block: long work (render, bundle, thumbs, dialogs) goes to child processes / async spawn.
- Don't run full renders unless asked. Paid APIs (ElevenLabs) → ask first.
- Release: every app change → bump version + new entry on top of `CHANGELOG.md` (VI, detailed: Thêm/Thay đổi/Sửa lỗi/File chính/Roll back) → `npm run check` → commit → `git tag vX.Y.Z` → push (GitHub tuansami/SAMI-Motion-Studio) → `gh release create`.
- `<project>/.history/` = version history store (server/history.mjs). Never delete it; don't commit `projects/`.
