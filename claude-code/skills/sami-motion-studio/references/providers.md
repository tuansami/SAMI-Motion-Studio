# Media gateway (Studio 0.8+): stock, AI generation, costs

All media sourcing goes through the **sami-media** package (`Z:\SAMI_Video\MCP-sami-media`, `<mm>` below; since Studio 0.8.2 it is no longer inside the Studio). Three doors, same rules:
- **MCP `sami-media`** (preferred in Claude Code): `list_providers`, `library_search`, `search_stock`, `fetch_stock`, `estimate`, `generate`, `ingest_file`, `ledger`, `chrome_status`.
- **CLI** `node <mm>/bin/cli.mjs list | stock | fetch | estimate | gen | ingest | downloads | chrome | ledger` (run without args for help).
- **Studio** tab "Nguồn & AI" (Tuấn: keys, caps, one-click stock, generate with a confirm button, Chrome SAMI).

## Order (cheapest and safest first)
1. `library_search` (SAMI_Library) and the client's own assets.
2. Free stock: `search_stock` (`auto` = Pexels, Pixabay, Unsplash with keys + Wikimedia without key; licence-filtered) → `fetch_stock`. Videos: `kind: "video"`.
3. Free generators: `edge-tts` (draft VO only, licence unclear), `synth-sfx` (names: `python <app>/lib/py/sami_audio.py list`), local `kokoro` / `comfyui` when running.
4. Subscriptions in **Chrome SAMI** (a separate Chrome profile for automation: `Z:\SAMI_Video\.chrome-sami`, CDP `http://127.0.0.1:9333`, no "Allow" prompt, every download lands in `Z:\SAMI_Video\.sami-cache\downloads`): `chatgpt-web` (5 images per prompt), `gemini-web`, `flow-web` (Veo), `suno-web`. Tuấn presses **"✨ Tạo"** in the Studio tab "Nguồn & AI" (his click = approval to submit that prompt once). The chain: fixed CDP script (ChatGPT, 0 tokens) → Jev (only when turned on) → headless `claude -p` (Sonnet, browser-harness pointed at Chrome SAMI + `bin/cli.mjs downloads|ingest`; collect-only when the prompt was already sent). Check `chrome_status` first. By hand: follow `<mm>/recipes/<name>.md` with browser-harness on Chrome SAMI (`BU_CDP_URL=http://127.0.0.1:9333`, never Tuấn's everyday Chrome), then `ingest_file`. **Never choose a download folder**: a "Save as" dialog means stop.
5. Paid APIs: `elevenlabs-tts|music|sfx`, `openai-image`, `gemini-image`, `bfl-flux`, `fal`, `replicate`.

## Paid calls (hard rules, enforced by the gateway)
1. `estimate` → show Tuấn: provider, model, units, ≈ USD, spent today/month vs caps (2 USD/day, 20 USD/month unless he changed them).
2. **Wait for his explicit OK in chat.** Then `generate` with `confirm_token` (one use, 10 minutes, bound to the exact request: changing prompt, n, model or destination needs a new estimate).
3. One paid call at a time. If it fails: report the error, do NOT retry on your own (the token is burnt; a retry needs a new estimate + OK).
4. Over the cap → no token. Never ask Tuấn to raise caps to get around a block; suggest stock / web / free first.
5. Never add `mcp__sami-media__generate` to an allowlist. Never ask for, read or print API keys: Tuấn enters them in the Studio (DPAPI-encrypted in `%APPDATA%\SAMI\providers.json`).
6. Never generate images with ElevenLabs (no such adapter on purpose) unless Tuấn asks in text, and then only via the ElevenLabs connector, not the gateway.

## Using the files in a video
- Studio: every result has **"Dùng ▾"** (replace an image field, add as overlay / watermark, set as music / voice / SFX; carousel: music across slides or SFX on the current slide) and can be dragged onto the preview. Image/music fields have **"📚 Chọn…"** (project · SAMI_Library · stock).
- Claude Code: put the `lib:`/`img/…` path into `project.json` (copy image fields, `overlays[].src`, `audio.music.src`, `audio.voice[]`, `audio.cues[].src`, carousel `scenes[].cues[].src`) or into the scene HTML.

## Output + meta
- Default destination: `SAMI_Library/assets/<kind>/<provider>/<slug>-<sha8>.<ext>` → reference as `lib:<kind>/<provider>/<file>`. With `project_dir` (MCP) / `--to` (CLI) / "Lưu vào dự án" (UI): `<project>/public/{img,video,audio}/<provider>/…` → reference as `img/<provider>/<file>`.
- Every file gets `<file>.meta.json`: provider, model, prompt (+ final prompt), params, usd, licence {name, url, commercial, credit, notes}, source {url, author}, sha256, confirmedBy. Keep credits for stock with "attribution required" (Wikimedia CC BY/BY-SA, Unsplash) in the project brief.
- `licence.commercial: "check"` (edge-tts, Flow, Suno, fal/replicate models) = not cleared for client ads until Tuấn confirms.

## Prompting
- Images never carry on-screen text: copy lives in `project.json → copy`. The gateway appends "No text, no letters, no logos, no watermark" unless `opts.allowText`.
- Fictional restaurants must be labelled (KONZEPTBEISPIEL) where they appear.
- Voice: Southern Vietnamese female for SAMI VO = ElevenLabs `FRYq6nepIbR0lbu7Lus4` (Anh Thu); Northern TVC = `pGapy9MNHCukzJtjavF0` (Ái Hạnh). German on-screen text for the DE market.
- Music for a video: ask for 120 BPM to match the storyboard grid; check with `cli-grid.mjs` afterwards.
