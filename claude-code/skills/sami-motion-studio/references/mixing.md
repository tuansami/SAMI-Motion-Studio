# Mixing Hyperframes and Remotion

- One timeline: `project.json → scenes[]` in order, contiguous. Each scene is HTML (`engine: "hyperframes"`, `src`) or TSX (default). `project.engine` only says which engine NEW scenes should use (`hf-starter` template = `hyperframes`).
- The Studio composites every scene inside the same `Scene` wrapper (crossfade + blur, 8-frame overlap), then titles, subtitles, overlays, grain/vignette and audio. So mixing engines needs no special handling in scene code.
- **Preview:** HTML scenes run live in an iframe inside the Player (`/hfp/<id>/<scene>/<ratio>/index.html`), seeked frame by frame. Saving a file in `hf/` reloads only the iframes (no rebundle). Copy/brand edits apply live.
- **Export:** each HTML scene in scope renders once with the Hyperframes CLI into `public/_hf/<ID>_<ratio>_<fps>_<scale>x_<hash>.mp4` (hash = scene file + hf/ + public/ + SAMI runtime + Hyperframes version). Then Remotion composites it with `<OffthreadVideo>`. Changing copy/titles/music only re-runs the composite, not the HTML render (unless the copy is used by that scene).
- 4K: Hyperframes renders 2× (preset) for 16:9/9:16/1:1; 4:5 HTML scenes render at 1× and are upscaled.
- Warp (time stretch) works for TSX scenes only; for HTML scenes change the scene length (animations are on `SAMI.beat()` so they stay on the grid).
- Stills: `cli-still` = fast Hyperframes snapshot for frames inside HTML scenes (scene only, no titles/overlays); `--exact` = render clips + full composite (slower, cached).
- Speed on this PC (GTX 1070, i7-8700): Hyperframes ≈ 6 fps at 1080×1920 with 4 workers (screenshot capture), Remotion usually faster for simple scenes. Clips are cached, so iterate on text/audio freely.
