# Export, GPU, ffmpeg, disk

- **ffmpeg:** full build in `<app>/vendor/ffmpeg/bin` (BtbN 8.1, NVENC/QSV/AMF, VP9, ProRes, GIF, xfade, loudnorm). Install/repair: `node <app>/tools/get-ffmpeg.mjs [--force]`. gyan builds ≥ 8.1 need NVIDIA driver ≥ 610, which GTX 10xx cards can't get. Remotion keeps its own bundled ffmpeg.
- **GPU:** capabilities cached in `<app>/.studio/caps.json` (`remotion.nvenc`, `full.nvenc`). Export uses NVENC for H.264/H.265 when available (fixed bitrate: 540p 4M · FHD 16M · 2K 28M · 4K 55M); ProRes is CPU. HTML scene clips use Hyperframes `--gpu`. Consumer GPUs allow few parallel NVENC sessions; OBS uses them too.
- **Speed:** frame capture (Chrome) is the bottleneck, not encoding. Remotion parts of ~15 s with watchdog + resume; Hyperframes 4 workers. Cached HTML clips + bundles avoid re-work.
- **Disk:** caches live in `Z:\SAMI_Video\.sami-cache` (bundles, previews, hf-stage, hf-frames, tmp; children's TEMP points here). `node <app>/tools/cleanup.mjs` reports what can go (webpack cache, old previews/bundles, leaked Chrome profiles), `--apply` deletes. Never delete `.history/` or `out/*.mp4`.
- **Old projects:** `node <app>/tools/migrate.mjs` (dry run) → `--apply` turns `_engine` copies and duplicate media into hardlinks, removes stale per-project skill copies; snapshots `.history` first.
