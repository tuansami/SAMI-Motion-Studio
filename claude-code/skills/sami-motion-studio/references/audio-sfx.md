# Audio, SFX, music grid

- **Grid:** 120 BPM, first downbeat 0.03 s → beat n at `1 + 15n` base frames (0.5 s), bar = 60 frames. Cuts land on `15n+1`; put DROP / FINAL HIT on cut-ins.
- **New music:** `node <app>/server/cli-grid.mjs <file>` → BPM, drop, final hit. `audio.mode: "layers"`; trim/loop with `music.edit [[from, to, crossfade]]` (seconds of the source).
- **Cues:** few: whoosh only on chapter cuts, typing in the hook, pop on CTA, sub_hit on the final logo. Engine SFX ids: `whoosh_a|b|c, pop, sub_hit, key_single, key_enter, typing_burst`. Library SFX: `{"t": 4.03, "src": "lib:sfx/eleven/whoosh_soft.mp3", "gain": -16}` (68 files: UI clicks, notifications, cash register, glass, crowd, impacts, risers…).
- **Voice-over:** `audio.voice[]` `{t, src, len}`; music ducks by `duck` dB (default −9) while voice plays. DE market: on-screen German, VO Southern Vietnamese female (ElevenLabs "Anh Thu" `FRYq6nepIbR0lbu7Lus4`; Northern TVC "Ái Hạnh" `pGapy9MNHCukzJtjavF0`). TTS one sentence at a time.
- **Loudness:** export normalises to −14 LUFS / −1 dBTP automatically.
- **No sound in scene code** (TSX `<Audio>` or unmuted HTML `<video>`): everything lives in `project.json → audio` so the Studio can mix, duck and normalise.
- **Paid generation** (ElevenLabs music/SFX): state the cost, get OK, then save the result into SAMI_Library with a `.meta.json` (prompt, model, plan, licence).
