---
name: sami-motion-studio
description: Make or revise SAMI motion-graphics videos in a SAMI Motion Studio project folder (project.json + scenes/) — brief, script/storyboard, scenes for 16:9/9:16/1:1, music grid, SFX cues, stills QA; the user edits text/titles and renders in the Studio app.
---

# SAMI Motion Studio — video projects

Premium motion ads for SAMI Marketing Agency and its hospitality clients (restaurants, nail, spa, hotels). Owner Tuan (CEO): Vietnamese replies, concise, push back when a request hurts conversion or brand.

## Where things are
- App: folder with `Start-Studio.bat` (default `D:\Downloads\SAMI_Video\SAMI_Motion_Studio`). UI at http://localhost:5178. Full rules: `<app>/docs/PROJECT_GUIDE.md`.
- Project = any folder with `project.json`, `scenes/`, `public/{img,video,audio,fonts}`, `brief/`, `out/`, `CLAUDE.md` (has absolute CLI paths).
- Cowork (cloud): edit files in place on the PC with device_bash; stage only stills/images you must look at. Never copy node_modules.

## Session protocol (token-safe, mandatory) — full: `<app>/docs/QUY_TRINH_LAM_VIEC.md`
1. One video = one project folder = one fresh session. Work only inside the project folder you were opened in.
2. Read in order: `CLAUDE.md` → `brief/TRANG_THAI.md` → only the files the current task needs (named `scenes/<ID>.tsx`, `project.json`, `brief/BRIEF.md`, `brief/SCRIPT_STORYBOARD.md`).
3. Never read: `node_modules/`, `out/`, `public/_engine/`, other projects, app engine code (unless an error points there), whole videos. Look only at images you need; QA with `cli-still`.
4. Decisions live in files, not chat: end every session by updating `brief/TRANG_THAI.md` (stage · locked decisions · next steps · client feedback by round · technical notes), ≤ 1 page.
5. Stop and ask when the brief lacks a deciding fact or a request contradicts "Đã chốt".

## Decide the job
| Request | Who / where |
|---|---|
| Wording, scene length, titles, subtitles, SFX, colours, logo/watermark/arrows/Lottie (tab Ảnh chèn), export | **User in Studio** — tell them which tab; don't spend tokens |
| Make a reusable template | follow `<app>/docs/TEMPLATE_STANDARD.md`; `node <app>/server/cli-template.mjs check templates/<id>` must have no ✗ |
| New/changed visual, layout per ratio, new scene | `scenes/<ID>.tsx` (+ `scenes/index.ts`, `project.json → scenes/copy`) |
| New text field | add `project.json → copy.<ID>_<name>` with Vietnamese `label` describing WHERE it appears |
| New music | `node <app>/server/cli-grid.mjs <file>` → put DROP / FINAL HIT on cuts; `audio.mode: "layers"` |
| Whole new video | Studio "Tạo dự án mới" from a template + client asset folder, then the workflow below |

## Workflow (⛔ = wait for OK)
1. **Brief** ⛔ — read `brief/`; ≤4 questions (audience/language, CTA + contact, length + ratios, which assets are real).
2. **Script + storyboard** ⛔ — table on the 120 BPM grid (beat 15 f, cuts 15n+1): scene · seconds · on-screen copy · motion · SFX. Reading time: 6–10 words ≥1.5 s, stat ≥2 s, key offer ≥3 s. Copy must sound spoken.
3. **Data** — `project.json`: scenes (contiguous), labelled copy, `formats`, audio cues (whoosh only on chapter cuts, typing in hook, pop on CTA, sub_hit on final logo).
4. **Scenes** — one file each, `useT()`, `tw/keys/arrive`, `<Words start={x + OV}>`, `usePick` per ratio, respect `SAFE`. Build scenes sequentially by default; only when ≥6 new scenes AND the user wants speed use workflow `.claude/workflows/sami-motion-video.js` (one designer per scene — costs more tokens overall).
5. **QA** ⛔ — `node <app>/server/cli-validate.mjs .` must pass; stills in every ratio `node <app>/server/cli-still.mjs . out/qa/S03.jpg 20,60,110 9:16` → Read. Check clipping, diacritics, <20 px text, dead frames, beat landings, invented numbers.
6. **Hand-off** — user reviews in Studio, tweaks text/titles, exports draft → final (FHD/2K/4K, 24/30/60, NVENC). Don't render finals in the cloud (2 cores).

## House rules
One easing `cubic-bezier(0.22,1,0.36,1)` · crossfade every cut (engine) · grain + vignette once (engine) · few SFX · cut ruthlessly · no raw screenshots as content · no invented stats · no other agencies' work · no platform/Google logos · SAMI end card: lockup + "Strategy • Automation • Marketing • Intelligence" + WhatsApp + URL (client videos: client logo + CTA).

## Version history (điểm neo)
- Studio snapshots the WHOLE project (json, scenes, brief, all media; not out/) before every chat turn via the `.claude/settings.json` UserPromptSubmit hook, on open and on save. Users restore in Studio → tab **Lịch sử**.
- Before a big or risky change (replacing media, rewriting several scenes, new music) also set a named anchor: `node <app>/server/cli-snapshot.mjs . snapshot --label "Trước khi <việc>"`. List / restore: `… list`, `… restore <id> [scenes/S03.tsx public/audio]` (restore always snapshots the current state first).
- Never delete or edit `.history/`.
- Batch variants: `brief/variants.csv` (header = `name;formats;<copy keys>`, `#` row = labels). Users export them in Studio → tab Biến thể. Keep scene text in `COPY.*` so variants can replace it; preview one: `node <app>/server/cli-still.mjs . out/qa/v.jpg 120 9:16 --copy row.json`.
- `project.json → status` (draft/review/approved/published) is the team's workflow label — don't change it unless asked.
- Client feedback lands in `brief/GOP_Y.md` (Studio → Xuất → Gói duyệt khách → "Lưu vào brief/GOP_Y.md"). On "sửa theo góp ý": read it, fix, tick `[x]`, note the round in TRANG_THAI.md.

## Gotchas
- Never `useCurrentFrame()` in scenes (breaks 24/60 fps) — use `useT()` / `useBaseFrame()`.
- Read `COPY.X` inside the component, never in a module-level const (live edits won't show).
- `<Words>/<Counter>/<TypeLabel>` run on Sequence frames → add `OV`.
- Vietnamese stacked diacritics clip in masks — keep engine padding.
- Stretching is `warp` (Studio does it on duration change) — don't rewrite animation for timing.
- Premix audio doesn't follow duration changes — prefer `layers`. All sound lives in `project.json → audio`; no `<Audio>` in scenes, videos `muted`.
- Render hang/slow: Studio renders ~15 s parts in child processes with a watchdog + resume; GPU problems → tab Xuất → Chẩn đoán GPU. ProRes is always CPU.
- Paid generation (ElevenLabs music/voice/images) → state cost, get OK.
