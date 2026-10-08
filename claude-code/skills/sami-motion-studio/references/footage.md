# Footage, B-roll, PiP, screen recordings (Studio 0.9+)

Real video lives on its own layer: `project.json → tracks.video[]`, drawn ABOVE the scenes and BELOW overlays, titles and subtitles. Lower-thirds / captions over footage = **titles** (tab Tiêu đề) or overlays, not HTML scenes (HTML scenes render as opaque clips underneath).

## Files
- Originals in `<project>/media/` (never `public/`: the render bundle copies `public/`). Studio tab **Footage** → "＋ Nhập video" (streamed, any size) or drag a video onto the preview.
- Import = probe → if variable frame rate (screen recordings) a constant-30 copy `media/<name>.cfr30.mp4` (the clip uses it) → 540p proxy `media/.cache/proxy/` (GOP 15, AAC) → poster `media/.cache/thumb/`. Info cache `media/.cache/info.json`. Code: `server/footage.mjs` (`prepare`, `listMedia`, `newClip`, `serveMedia`).
- Preview plays the proxy (`/pm/<id>/proxy/media/…`); exports and `cli-still` read originals through a temporary local HTTP server (`serveMedia`, Range support). `media/.cache` is deletable (rebuilt by "Chuẩn bị").
- Stock B-roll: tab Nguồn & AI → stock, kind video → "Dùng ▾ → Thêm làm B-roll" moves the file into `media/broll/` (library clips are hardlinked).

## Clip fields (seconds)
`at` start on the film · `in`/`out` range in the source · `speed` (0.5–2) · `role`:
| role | look | defaults |
|---|---|---|
| `main` | full frame, `fit: cover` | sound 0 dB, ducks music |
| `broll` | full frame insert | muted (`volume: null`), 0.2 s fades, 3 s |
| `pip` | window `pip{x,y,w,r}` (centre in 0..1 of frame, `w` = fraction of the SHORT side), `mask: rounded|circle|none`, `aspect` from the file | sound on, ducks music, 0.3 s pop |
| `screen` | inside a device: `mask: phone|laptop`, `fit: contain` | sound on |
`z` orders overlapping clips (main 0, screen 5, broll 10, pip 20). `formats: ["9:16"]` limits a clip to some ratios. A clip running past the end of the film is cut off: the Studio appends a `{"engine": "blank"}` scene "Footage" so it fits (cut stays on 15n+1).

## Sound
Footage sound plays through `AudioTrack` (the picture is muted): `volume` dB, `null` = muted. Clips with sound and `duck !== false` lower the music exactly like a voice-over. The export's audio pass includes footage sound.

## Engine
`engine/src/core/VideoTrack.tsx` (`<OffthreadVideo startFrom endAt playbackRate>`, masks via border-radius / device frames), `MediaCtx` (base URL + proxy flag), props `mediaBase` / `mediaProxy` in `Main`. HTML scenes may also embed footage directly: `<video src="media/x.mp4" muted playsinline data-start data-duration data-media-start>` (staging junctions `media/`).

## QA
- `cli-validate`: missing files, bad in/out/speed, clips past the end, missing proxy.
- `cli-still`: frames with footage go through Remotion (HTML scenes underneath show a placeholder card unless `--exact`).
- Never export to "check" footage: stills only. Export only when Tuấn asks (`cli-render --preset reels-9x16 …`, presets in `lib/presets.json`).

## Drawn-in-code blocks (0.9)
`<script src="_sami/blocks/blocks.js">` → `SAMI.B.bars` (bar chart + counting numbers), `B.line` (line chart drawn), `B.cursor` (mouse path + click ripples), `B.route` (map route + moving dot + pins), `B.wipe` (colour wipe transition). Used by khuôn `chart-bars` and `map-route`.
