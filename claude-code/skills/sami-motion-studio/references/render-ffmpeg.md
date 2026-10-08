# Export, GPU, ffmpeg, disk

- **ffmpeg:** full build in `<app>/vendor/ffmpeg/bin` (BtbN 8.1, NVENC/QSV/AMF, VP9, ProRes, GIF, xfade, loudnorm). Install/repair: `node <app>/tools/get-ffmpeg.mjs [--force]`. gyan builds ≥ 8.1 need NVIDIA driver ≥ 610, which GTX 10xx cards can't get. Remotion keeps its own bundled ffmpeg.
- **GPU:** capabilities cached in `<app>/.studio/caps.json` (`remotion.nvenc`, `full.nvenc`). Export uses NVENC for H.264/H.265 when available (fixed bitrate: 540p 4M · FHD 16M · 2K 28M · 4K 55M); ProRes is CPU. HTML scene clips use Hyperframes `--gpu`. Consumer GPUs allow few parallel NVENC sessions; OBS uses them too.
- **Speed:** frame capture (Chrome) is the bottleneck, not encoding. Remotion parts of ~15 s with watchdog + resume; Hyperframes 4 workers. Cached HTML clips + bundles avoid re-work.
- **Disk:** caches live in `Z:\SAMI_Video\.sami-cache` (bundles, previews, hf-stage, hf-frames, tmp; children's TEMP points here). `node <app>/tools/cleanup.mjs` reports what can go (webpack cache, old previews/bundles, leaked Chrome profiles), `--apply` deletes. Never delete `.history/` or `out/*.mp4`.
- **Old projects:** `node <app>/tools/migrate.mjs` (dry run) → `--apply` turns `_engine` copies and duplicate media into hardlinks, removes stale per-project skill copies; snapshots `.history` first.

## Xuất Hyperframes thuần, không Remotion (Studio 1.0, thử nghiệm)
For client packages (Remotion needs a company licence above 3 people). `server/hf-native.mjs`:
1. each HTML scene → cached clip (`public/_hf`, same cache as the Remotion path);
2. FILM composition (`.sami-cache/hf-stage/<proj>/_film_<ratio>/index.html` + `lib/hf/native/film.js`): one `<video>` per scene clip with the engine crossfade/blur, footage `<video>`s with their frames (data-media-start, data-playback-rate), titles, subtitles, image + sticker overlays, grain + vignette; rendered by the Hyperframes CLI (`--gpu` when NVENC, `--crf` otherwise, `--resolution *-4k` for 4K);
3. sound: ffmpeg filtergraph (`audioPlan`): music edit segments + crossfades, gain, end fade, voice / footage ducking (volume expression, 0.25 s ramps, `audio.duck` dB), SFX cues, voice clips, footage sound (in/out, atempo, fades, dB) → loudnorm −14 LUFS → muxed (video stream copied). Output name ends in `_hf_<stamp>.mp4`.
- Refused (Remotion path still works): `.tsx` scenes, Lottie overlays, fit mode (ratio not in `formats`), H.265, 540p / 2K, single-scene export. `support(p, {ratio, codec, res, scope})` → reasons; Studio tab Xuất → "Bộ dựng" shows them live; `GET /api/render/native-check?id=&ratio=&codec=&res=`.
- CLI: `cli-render.mjs <dự án> --request "<Tuấn's words>" --engine native` (same switch + request rules).
- QA without exporting: `filmStills(dir, p, {ratio, at, outDir})` snapshots the FILM composition with the clips already cached (missing clip = striped placeholder; nothing is rendered).
- The FILM runtime is a port of `engine/src/{components/Scene.tsx, core/Titles.tsx, core/Overlays.tsx, core/Stickers.tsx, core/VideoTrack.tsx}` + FilmFinish: change both sides together.
- Not verified on a real export yet (needs Tuấn's OK to render): first run, compare with the Remotion export of the same project (stills at the same frames + audio length).
