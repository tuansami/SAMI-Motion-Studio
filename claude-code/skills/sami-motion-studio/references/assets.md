# Finding or generating images, video, music, voice

Order (cheapest and safest first):
1. **SAMI_Library** (`references/library.md`) and the client's own assets in `brief/` / `public/`.
2. **Free stock:** Pexels / Pixabay / Unsplash (photos, B-roll video), Wikimedia Commons (PD/CC only). Save source URL + author in `.meta.json`.
3. **Subscriptions in the browser** (no API cost; Tuấn logs in, never solve CAPTCHAs): ChatGPT image gen (batch 5 images per prompt), Gemini nano banana, Google Flow/Veo (video), Suno (music). Use the browser-harness skill (Tuấn's Chrome) and download into the project, then add meta.
4. **Paid APIs** (OpenAI, Gemini, fal, Replicate, BFL Flux, ElevenLabs): state model + estimated cost, wait for OK, one request at a time.

Hard rules: NEVER generate images with the ElevenLabs connector unless Tuấn asks in text. Text is code: never let an image model draw on-screen text (copy goes in `project.json → copy`). Fictional restaurant examples must be labelled (KONZEPTBEISPIEL). Real client photos only with permission. Studio 0.8 adds a provider gateway (estimate → confirm token → generate, cost ledger, MCP); until then follow the order above manually.
