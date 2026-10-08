# Khuôn + dây chuyền (Studio 0.8.3+): "trả tiền nghĩ một lần"

Before designing a scene from scratch, check whether a **khuôn** fits. Before building a whole common video (promo, Google Maps, menu), use a **dây chuyền**: you only write a JSON brief, the machine builds the project.

## Khuôn (`<app>/lib/hf/khuon/<id>/`)
Parameterised Hyperframes scenes: `khuon.json` (name, group, beats, themes, slots, sfx) + `scene.html` (no hard-coded copy) + `thumb_*.jpg`.
- List: `node <app>/server/cli-pipeline.mjs list` (or Studio → cột Cảnh → **🧩 Khuôn**).
- 16 khuôn (2026-10): hook-words, hook-ransom, problem-stamp, benefits-3, stat-counter, maps-search, maps-profile, chat-whatsapp, phone-scroll, photo-collage, menu-dish, offer-badge, review-quote, calendar-date, cta-contact, endcard-logo.
- **Themes**: `night` (navy SAMI), `paper` (kraft, ransom words, polaroids: the V22 look), `light` (V23 look). Per scene `scene.khuon.theme`, default `project.look.theme`. Brand colours/fonts from `project.json → brand` win.
- In a project a khuôn scene is `{"engine":"hyperframes","src":"hf/S03.html","khuon":{"id":"maps-search","v":1,"theme":"paper"}}`; the HTML is COPIED into `hf/` (self-contained; you may still edit it by hand for this video). Copy keys are `<scene>_<slot>` (image slots end in `_photo`/`_logo`, value `img/x.jpg` or `lib:img/…`).
- **Đổi khuôn** (Studio button, or `applyKhuon(dir, p, {khuon, scene})` in `server/khuon.mjs`): keeps same-name slot values, stashes the others in `scene.khuon.stash` (switching back restores them), never touches voice/music/SFX/timing. Insert: `{khuon, after: 'S02'}` shifts later scenes and cues; cuts stay on 15n+1.
- **New khuôn**: copy the closest one; `khuon.json` slots with `sample` values; in `scene.html` load `_sami/khuon/kit.css` + `kit.js`, call `const K = S.K.bind()` first, use `data-slot` / `data-slot-img`, `K.has/K.text/K.list/K.num/K.src`, blocks `.k-phone .k-card .k-chip .k-btn .k-polaroid .k-tape .k-stamp .k-bub`, helpers `K.ransom K.pop K.slam K.count K.type K.draw K.push K.stars K.icon K.layout K.around K.fitW`. One easing (S.EASE), no random/Date/rAF, layout per ratio with `[data-ratio="9x16"]`. Never rebuild DOM after creating tweens (fonts.ready callbacks may only change styles).
- QA: `node <app>/tools/khuon-thumbs.mjs --only <id> --theme paper` → contact sheet in `.sami-cache/khuon-test/<theme>/sheet_*.jpg` (Read it). `--apply` writes the library thumbs. `npm run check` validates every khuôn.

## Plan with khuôn from the first minute (1.0) — saves tokens and time
- Read ONE file: `<app>/lib/hf/khuon/CATALOG.md` (every khuôn: group, beats, themes, one-line look, slot names; `?` = optional, `[ảnh]` = image). Regenerate after adding a khuôn: `cli-pipeline.mjs catalog --write` (selftest fails if it is stale). Machine form: `catalog --json`.
- Storyboard column "khuôn" per row. Rows with a khuôn = no scene code, no thumbnail QA loop beyond the pipeline sheet; write HTML only for rows marked "viết tay" (a storyboard row may use `"custom": "…"` to build a placeholder from the nearest khuôn and leave a ✎ note in the label).
- Build: `cli-pipeline.mjs example storyboard > brief.json` → edit → `cli-pipeline.mjs storyboard brief.json --out <app>/projects/<YYMMDD-VNN-ten-v.1> [--brand sami]`. `"closing": true` appends CTA + end card from the brand.
- Existing project: `cli-pipeline.mjs add <dự án> <khuôn> [--after S02 | --replace S03] [--values '{"headline":"…"}' | --values file.json] [--theme paper] [--beats 8]`.
- Every pipeline warns about values for slots the khuôn does not have (they would be dropped silently), e.g. `headline` on `stat-counter` (its slot is `caption`).
- Industry templates built only from khuôn (export without Remotion): `templates/hf-nha-hang`, `hf-nail-spa`, `hf-google-maps` (`node tools/khuon-templates.mjs --apply` rebuilds them).

## Dây chuyền (`<app>/lib/pipelines/<name>.mjs`)
```bash
node <app>/server/cli-pipeline.mjs example maps > brief.json      # edit the JSON only
node <app>/server/cli-pipeline.mjs maps brief.json --out <app>/projects/<YYMMDD-VNN-ten-v.1> [--brand sami] [--ratio 9:16,16:9]
```
- `promo` (~30 s: hook, problem, stat, benefits, proof, offer, CTA, end), `maps` (search → profile → benefits → deadline → CTA), `menu` (one scene per dish + offer), `storyboard` (any list of khuôn). Parts missing from the brief are skipped.
- Output: project + `brief/pipeline-<name>.json` + validate + QA sheet `out/qa/pipeline_<ratio>.jpg` (Read it). **No render.** Then the usual: voice, music (`lib:music/…`), Tuấn reviews in Studio, export only when he asks.
- Brand: `SAMI_Library/brands/<client>/brand.json` `{name, colors, gradient, fonts{head,ui}, theme, logo, tagline, contact{web,phone,whatsapp,address}, cta, voice, music, lang}`. Template: `brands/sami/brand.json`. Pipelines fill CTA contact and the end card from it.
- New pipeline: a pure function `(brief, brand) → {name, formats, theme, brand, music, scenes: [{khuon, values, beats?, theme?, label?}]}` + `describe` + `example`; helpers in `lib/pipelines/common.mjs`.

## Session + model discipline (Tuấn, 2026-10-08)
- 1 video = 1 session; 1 Studio version = 1 session; state lives in files (`brief/TRANG_THAI.md`, `project.json`, HANDOFF), never only in the chat.
- Opus: script, storyboard, choosing khuôn/pipeline. Sonnet: building/fixing scenes, browser runs. Script or Haiku: repetitive work (briefs from a table, variants).
- Cost per video: `node <mm>/bin/cli.mjs ledger --project <dir>` (paid API + Claude runs converted to USD; `<mm>` = `Z:\SAMI_Video\MCP-sami-media`).
