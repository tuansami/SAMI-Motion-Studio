# SAMI_Library: shared assets for every project

Root `Z:\SAMI_Video\SAMI_Library` (override: env `SAMI_LIBRARY` or `<app>/.studio/config.json → libraryRoot`).
```
assets/sfx|music|voice|img|video|lottie|fonts|luts|masks/<sub>/<file.ext>
assets/…/<file.ext>.meta.json   {id, title, tags[], licence{type,commercial,url,attribution,note}, source{provider,model,prompt,url,cost}, duration, bpm, lufs, w, h, sha256, added}
brands/<client>/brand.json      {colors, fonts, gradient, logo}
index.json                      generated
```
- **Use:** `lib:sfx/eleven/whoosh_soft.mp3` anywhere a media path is accepted (`audio.music.src`, `cues[].src`, `voice[].src`, `overlays[].src`, image copy slots, `media()` in TSX). In HTML scenes use `lib/sfx/…` as a URL. The Studio hardlinks used files into `public/_lib/` on open/export (0 bytes on drive Z).
- **Find:** `GET http://localhost:5178/api/library/search?q=whoosh&kind=sfx` (Studio running) or read `index.json`. Prefer existing assets over generating new ones.
- **Add:** put the file under `assets/<kind>/<topic>/` with a `.meta.json` (licence is mandatory: `commercial: true|false|null`). Then `POST /api/library/reindex` or `node <app>/tools/lib-seed.mjs --apply` (seed) / rebuild index.
- **Licences:** ElevenLabs SFX from the free tier (series 2610) = `commercial: null` → check before ads. Stock: keep source URL + author. Client media never goes into the shared library (stays in the project).
- Reusable CODE is not here: HTML blocks → `<app>/lib/hf/`, TSX helpers → `<app>/lib/remotion/` (versioned with the app).
