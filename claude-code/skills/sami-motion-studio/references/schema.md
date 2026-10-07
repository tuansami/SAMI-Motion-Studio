# project.json fields (Studio 0.6)

All new fields are optional; v1 files work unchanged.
```jsonc
{
  "name": "261008-V24-…-v.1", "client": "", "version": 1,
  "schemaVersion": 2,                    // 0.6+ projects; absent = v1
  "type": "video",                       // "carousel" from 0.7
  "engine": "hyperframes",               // engine for NEW scenes (hint for Claude/Studio)
  "status": "draft|review|approved|published",
  "formats": ["9:16", "16:9", "1:1", "4:5"],   // first = primary layout
  "brand": {"colors": {"navy": "#0C0628", "mint": "#08DDA4", …}, "fonts": {}, "gradient": null},
  "look": {"grain": 0.05, "vignette": 0.42, "background": "#06031A"},
  "scenes": [
    {"id": "S01", "label": "Hook", "start": 0, "end": 121},                                  // TSX scenes/S01.tsx
    {"id": "S02", "label": "Lợi ích", "start": 121, "end": 301, "engine": "hyperframes", "src": "hf/S02.html"}
  ],                                     // base frames @30 fps, contiguous, cuts at 15n+1; "warp" knots for TSX only
  "copy": {"S02_title": {"label": "Tiêu đề cảnh lợi ích", "scene": "S02", "value": "…", "hint": "", "multiline": false}},
  "titles": [], "overlays": [],          // seconds; overlays[].src may be "lib:img/…" or "img/…"
  "subtitles": {"enabled": false, "items": [], "anim": "karaoke"},
  "audio": {"mode": "layers",            // premix | layers | none
    "music": {"src": "lib:music/….mp3", "gain": -4, "edit": [[a, b, xf]], "fadeOut": 2.5},
    "cues": [{"t": 4.03, "sfx": "whoosh_b", "gain": -18, "label": "chuyển cảnh"}, {"t": 11.03, "src": "lib:sfx/eleven/pop_soft.mp3", "gain": -10}],
    "voice": [{"t": 1.0, "src": "audio/vo_01.mp3", "len": 2.4}], "duck": -9}
}
```
Media paths: `img/…`, `audio/…` = inside `public/`; `lib:<kind>/<file>` = SAMI_Library (hardlinked into `public/_lib`).
