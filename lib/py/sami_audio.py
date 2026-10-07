#!/usr/bin/env python3
"""SAMI procedural audio (numpy + stdlib only): sound effects, a 120 BPM groove and seamless-loop mixing.

Why: carousels and short ads need many small, perfectly timed sounds. Synthesising them is free, has no
licence risk and lands on the exact frame. Everything is deterministic (seeded noise).

CLI
  python sami_audio.py mix  spec.json            # render a mix described by JSON (used by the Studio)
  python sami_audio.py sfx  <name> out.wav [--dur 0.6] [--pitch 1.0] [--seed 1]
  python sami_audio.py list                       # effect names

spec.json
  {"sr": 48000, "dur": 6.0, "bpm": 120, "wrap": true, "out": "mix.wav", "rms_db": -16,
   "groove": {"start": 0.0, "intensity": 0.8, "style": "house|soft|none"},
   "bed":    {"path": "music_slice.wav", "gain": -6},          # optional: song slice already cut to dur (Node does it)
   "events": [{"t": 1.0, "fx": "pop", "gain": 0, "pan": 0.2, "pitch": 1.0, "dur": 0.4},
              {"t": 2.0, "file": "lib_or_project.wav", "gain": -6}]}
"""
import json
import math
import struct
import sys
import wave
from pathlib import Path

import numpy as np

SR = 48000
TAU = 2 * math.pi


# ── primitives ─────────────────────────────────────────────────────────
def rng(seed):
    return np.random.default_rng(int(seed) & 0xFFFFFFFF)


def t_axis(dur, sr=SR):
    return np.arange(int(max(1, dur * sr))) / sr


def env_ad(n, a, d, sr=SR, curve=4.0):
    """attack (s) linear, decay (s) exponential-ish"""
    out = np.zeros(n)
    na = max(1, int(a * sr))
    out[:na] = np.linspace(0, 1, na, endpoint=False)[: n]
    rest = n - na
    if rest > 0:
        k = np.arange(rest) / max(1, int(d * sr))
        out[na:] = np.exp(-curve * k)
    return out


def lowpass(x, cutoff, sr=SR):
    """one-pole low-pass (cutoff may be an array → sweep)"""
    c = np.broadcast_to(np.asarray(cutoff, dtype=float), x.shape)
    a = np.exp(-TAU * np.clip(c, 20, sr / 2.2) / sr)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def highpass(x, cutoff, sr=SR):
    return x - lowpass(x, cutoff, sr)


def bandnoise(n, lo, hi, seed=1):
    w = rng(seed).standard_normal(n)
    return lowpass(highpass(w, lo), hi)


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) or 1.0
    return x * (peak / m)


def db(g):
    return 10 ** (g / 20)


# ── effects (each returns mono float array, transient at sample 0 unless noted) ──
def fx_pop(dur=0.18, pitch=1.0, seed=1):
    t = t_axis(dur)
    f = 900 * pitch * np.exp(-t * 28) + 260 * pitch
    s = np.sin(TAU * np.cumsum(f) / SR) * env_ad(len(t), 0.002, 0.06)
    return norm(s, 0.9)


def fx_click(dur=0.05, pitch=1.0, seed=2):
    n = int(dur * SR)
    s = bandnoise(n, 2500 * pitch, 9000, seed) * env_ad(n, 0.0005, 0.012, curve=6)
    return norm(s, 0.8)


def fx_tick(dur=0.06, pitch=1.0, seed=3):
    t = t_axis(dur)
    s = np.sin(TAU * 2400 * pitch * t) * env_ad(len(t), 0.0005, 0.02, curve=6) + 0.3 * fx_click(dur, pitch, seed)[: len(t)]
    return norm(s, 0.7)


def fx_whoosh(dur=0.7, pitch=1.0, seed=4, shape="swell"):
    n = int(dur * SR)
    x = np.linspace(0, 1, n)
    if shape == "in":
        e = x ** 2.2
    elif shape == "out":
        e = (1 - x) ** 2.2
    else:
        e = np.sin(math.pi * x) ** 1.6
    sweep = (400 + 3800 * (np.sin(math.pi * x) if shape == "swell" else x if shape == "in" else 1 - x)) * pitch
    s = lowpass(rng(seed).standard_normal(n), sweep) * e
    return norm(s, 0.8)


def fx_riser(dur=1.5, pitch=1.0, seed=5):
    n = int(dur * SR)
    x = np.linspace(0, 1, n)
    noise = lowpass(rng(seed).standard_normal(n), 300 + 6000 * x ** 2) * x ** 2
    tone = np.sin(TAU * np.cumsum(180 * pitch * (1 + 3 * x ** 2)) / SR) * 0.35 * x ** 1.5
    return norm(noise + tone, 0.85)


def fx_impact(dur=1.2, pitch=1.0, seed=6):
    t = t_axis(dur)
    body = np.sin(TAU * np.cumsum(55 * pitch + 90 * np.exp(-t * 18)) / SR) * env_ad(len(t), 0.001, 0.45, curve=3)
    crack = bandnoise(len(t), 800, 6000, seed) * env_ad(len(t), 0.0005, 0.05, curve=5) * 0.5
    return norm(body + crack, 0.95)


def fx_chime(dur=1.4, pitch=1.0, seed=7):
    t = t_axis(dur)
    s = np.zeros_like(t)
    for k, (f, a) in enumerate([(1046.5, 1.0), (1568.0, 0.6), (2093.0, 0.35), (2637.0, 0.2)]):
        s += a * np.sin(TAU * f * pitch * t + k) * np.exp(-t * (2.5 + k))
    return norm(s * env_ad(len(t), 0.002, dur, curve=1.2), 0.75)


def fx_ping(dur=0.6, pitch=1.0, seed=8):
    t = t_axis(dur)
    s = np.sin(TAU * 1760 * pitch * t) * np.exp(-t * 9) + 0.4 * np.sin(TAU * 2640 * pitch * t) * np.exp(-t * 14)
    return norm(s, 0.7)


def fx_notification(dur=0.7, pitch=1.0, seed=9):
    a = fx_ping(0.35, 1.0 * pitch, seed)
    b = fx_ping(0.35, 1.335 * pitch, seed + 1)
    out = np.zeros(int(dur * SR))
    out[: len(a)] += a
    o = int(0.12 * SR)
    out[o : o + len(b)] += b[: len(out) - o]
    return norm(out, 0.75)


def fx_boop(dur=0.35, pitch=1.0, seed=10):
    """marimba-ish pitched hit (landings, bounces)"""
    t = t_axis(dur)
    f = 523.25 * pitch
    s = np.sin(TAU * f * t) * np.exp(-t * 14) + 0.25 * np.sin(TAU * 4 * f * t) * np.exp(-t * 40)
    return norm(s, 0.8)


def fx_sparkle(dur=0.9, pitch=1.0, seed=11):
    r = rng(seed)
    out = np.zeros(int(dur * SR))
    for k in range(9):
        at = int(r.uniform(0, dur * 0.7) * SR)
        p = fx_ping(0.25, pitch * r.choice([1.0, 1.25, 1.5, 2.0]), seed + k) * (0.5 + 0.5 * r.random())
        out[at : at + len(p)] += p[: len(out) - at]
    return norm(out, 0.6)


def fx_typing(dur=1.0, pitch=1.0, seed=12):
    r = rng(seed)
    out = np.zeros(int(dur * SR))
    tt = 0.0
    k = 0
    while tt < dur - 0.05:
        c = fx_click(0.04, pitch * r.uniform(0.8, 1.2), seed + k) * r.uniform(0.5, 1.0)
        i = int(tt * SR)
        out[i : i + len(c)] += c[: len(out) - i]
        tt += r.uniform(0.055, 0.11)
        k += 1
    return norm(out, 0.7)


def fx_thump(dur=0.4, pitch=1.0, seed=13):
    t = t_axis(dur)
    s = np.sin(TAU * np.cumsum(70 * pitch + 60 * np.exp(-t * 30)) / SR) * env_ad(len(t), 0.001, 0.12, curve=4)
    return norm(s, 0.9)


def fx_swoosh_reverse(dur=0.8, pitch=1.0, seed=14):
    return fx_whoosh(dur, pitch, seed, "in")


def fx_glitch(dur=0.35, pitch=1.0, seed=15):
    r = rng(seed)
    n = int(dur * SR)
    out = np.zeros(n)
    i = 0
    while i < n:
        seg = int(r.uniform(0.008, 0.04) * SR)
        f = r.uniform(200, 3000) * pitch
        tt = np.arange(min(seg, n - i)) / SR
        out[i : i + len(tt)] = np.sign(np.sin(TAU * f * tt)) * r.uniform(0.2, 0.8)
        i += seg
    return norm(lowpass(out, 7000) * env_ad(n, 0.001, dur, curve=2), 0.6)


def fx_cash(dur=0.9, pitch=1.0, seed=16):
    out = np.zeros(int(dur * SR))
    c = fx_click(0.05, 0.7 * pitch, seed) * 0.8
    out[: len(c)] += c
    ch = fx_chime(dur - 0.08, 1.2 * pitch, seed)
    o = int(0.08 * SR)
    out[o : o + len(ch)] += ch[: len(out) - o] * 0.8
    return norm(out, 0.8)


FX = {
    "pop": fx_pop, "click": fx_click, "tick": fx_tick, "whoosh": fx_whoosh, "whoosh_in": lambda d=0.7, p=1, s=4: fx_whoosh(d, p, s, "in"),
    "whoosh_out": lambda d=0.7, p=1, s=4: fx_whoosh(d, p, s, "out"), "riser": fx_riser, "impact": fx_impact, "chime": fx_chime,
    "ping": fx_ping, "notification": fx_notification, "boop": fx_boop, "sparkle": fx_sparkle, "typing": fx_typing,
    "thump": fx_thump, "swoosh_reverse": fx_swoosh_reverse, "glitch": fx_glitch, "cash": fx_cash,
}
# events whose audible "hit" is not at sample 0 (so the visual event lands on the peak): (default dur, peak as fraction of dur)
PEAK = {"riser": (1.5, 1.0), "swoosh_reverse": (0.8, 1.0), "whoosh_in": (0.7, 1.0), "whoosh": (0.7, 0.5)}


def preroll(name, dur=None):
    d, frac = PEAK.get(name, (0, 0))
    return (dur or d) * frac


def make_fx(name, dur=None, pitch=1.0, seed=1):
    f = FX[name]
    return f(dur, pitch, seed) if dur else f(pitch=pitch, seed=seed) if name not in ("whoosh_in", "whoosh_out") else f(p=pitch, s=seed)


# ── groove (deterministic, loops on whole bars) ─────────────────────────
def kick(seed=0):
    t = t_axis(0.35)
    return np.sin(TAU * np.cumsum(48 + 110 * np.exp(-t * 32)) / SR) * env_ad(len(t), 0.001, 0.16, curve=4)


def clap(seed=0):
    n = int(0.22 * SR)
    s = np.zeros(n)
    for k, off in enumerate((0, 0.011, 0.023)):
        i = int(off * SR)
        b = bandnoise(n - i, 900, 5000, seed + k) * env_ad(n - i, 0.0005, 0.03 if k < 2 else 0.12, curve=5)
        s[i:] += b
    return norm(s, 0.7)


def hat(open_=False, seed=0):
    n = int((0.22 if open_ else 0.05) * SR)
    return norm(bandnoise(n, 6000, 14000, seed) * env_ad(n, 0.0005, 0.12 if open_ else 0.02, curve=5), 0.5)


def bass(freq, dur):
    t = t_axis(dur)
    return np.sin(TAU * freq * t) * env_ad(len(t), 0.005, dur, curve=2.5)


def pad(freqs, dur, seed=0):
    t = t_axis(dur)
    s = sum(np.sin(TAU * f * t + i) + 0.3 * np.sin(TAU * 2.003 * f * t) for i, f in enumerate(freqs))
    e = np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.4).clip(0)
    return lowpass(s, 1800) * e


def groove(dur, bpm=120, intensity=0.8, style="house", seed=7):
    """kick on 1 & 3 (+ and-of-3), clap 2 & 4, 16th hats, sub bass, A-minor-9 pad. Length = dur (whole bars → seamless)."""
    n = int(dur * SR)
    out = np.zeros(n)
    beat = 60 / bpm
    if style == "none":
        return out
    soft = style == "soft"
    K, C = kick(), clap(seed)
    steps = int(round(dur / (beat / 4)))
    for s in range(steps):
        tt = s * beat / 4
        i = int(tt * SR)
        q = s % 16
        if not soft and q in (0, 8, 10):
            out[i : i + len(K)] += K[: n - i] * 0.9
        if soft and q in (0, 8):
            out[i : i + len(K)] += K[: n - i] * 0.5
        if q in (4, 12):
            out[i : i + len(C)] += C[: n - i] * (0.35 if soft else 0.55)
        h = hat(open_=(q % 4 == 2), seed=seed + s)
        out[i : i + len(h)] += h[: n - i] * (0.12 if q % 2 else 0.2) * (0.6 if soft else 1)
    roots = [55.0, 55.0, 43.65, 49.0]  # A1 A1 F1 G1, one per bar
    bars = max(1, int(round(dur / (beat * 4))))
    for b in range(bars):
        i = int(b * beat * 4 * SR)
        bb = bass(roots[b % 4], beat * 4 * 0.95)
        out[i : i + len(bb)] += bb[: n - i] * 0.35
        pd = pad([220.0, 261.63, 329.63, 392.0, 493.88], beat * 4, seed + b)
        out[i : i + len(pd)] += pd[: n - i] * 0.035
    return out * intensity


# ── mixing ─────────────────────────────────────────────────────────────
class Bus:
    def __init__(self, dur, tail=3.0):
        self.n = int(dur * SR)
        self.L = np.zeros(self.n + int(tail * SR))
        self.R = np.zeros_like(self.L)

    def add(self, sig, t, gain=1.0, pan=0.0):
        i = int(round(t * SR))
        if i < 0:  # starts before 0 → cut the head (wrap handles loops)
            sig = sig[-i:]
            i = 0
        j = min(len(self.L), i + len(sig))
        if j <= i:
            return
        gl, gr = gain * math.cos((pan + 1) * math.pi / 4) * math.sqrt(2), gain * math.sin((pan + 1) * math.pi / 4) * math.sqrt(2)
        self.L[i:j] += sig[: j - i] * gl
        self.R[i:j] += sig[: j - i] * gr


def soft_clip(x, drive=1.2):
    return np.tanh(x * drive) / np.tanh(drive)


def master(bus, wrap=True, rms_db=-16.0):
    L, R = bus.L.copy(), bus.R.copy()
    n = bus.n
    if wrap:  # fold everything after the end back onto the start → seamless loop
        tail = len(L) - n
        L[: tail] += L[n:]
        R[: tail] += R[n:]
    L, R = L[:n], R[:n]
    rms = math.sqrt(float(np.mean(L ** 2 + R ** 2) / 2)) or 1e-9
    g = db(rms_db) / rms
    L, R = soft_clip(L * g), soft_clip(R * g)
    peak = max(np.max(np.abs(L)), np.max(np.abs(R)), 1e-9)
    if peak > 0.98:
        L, R = L * 0.98 / peak, R * 0.98 / peak
    return np.stack([L, R], axis=1)


def read_wav(path):
    with wave.open(str(path), "rb") as w:
        ch, sw, sr, n = w.getnchannels(), w.getsampwidth(), w.getframerate(), w.getnframes()
        raw = w.readframes(n)
    if sw != 2:
        raise ValueError(f"{path}: need 16-bit PCM wav (Studio converts with ffmpeg)")
    a = np.frombuffer(raw, dtype="<i2").astype(np.float64) / 32768.0
    a = a.reshape(-1, ch)
    if sr != SR:  # linear resample (Studio normally hands over 48 kHz)
        x = np.arange(len(a)) / sr
        xi = np.arange(int(len(a) * SR / sr)) / SR
        a = np.stack([np.interp(xi, x, a[:, c]) for c in range(ch)], axis=1)
    return a if ch == 2 else np.repeat(a, 2, axis=1)


def write_wav(path, x):
    x = np.asarray(x)
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2")
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def render_spec(spec, base=Path(".")):
    dur = float(spec["dur"])
    bus = Bus(dur)
    g = spec.get("groove")
    if g and g.get("style", "house") != "none":
        start = float(g.get("start", 0))
        gr = groove(dur, spec.get("bpm", 120), float(g.get("intensity", 0.8)), g.get("style", "house"))
        # the groove is periodic in whole bars → rotate instead of shifting so the loop stays seamless
        k = int(start * SR) % len(gr) if len(gr) else 0
        bus.add(np.roll(gr, k) if not g.get("from_start_only") else gr, 0 if not g.get("from_start_only") else start)
    bed = spec.get("bed")
    if bed and bed.get("path"):
        a = read_wav(base / bed["path"])
        gain = db(float(bed.get("gain", -6)))
        bus.L[: min(bus.n, len(a))] += a[: bus.n, 0] * gain
        bus.R[: min(bus.n, len(a))] += a[: bus.n, 1] * gain
    for k, e in enumerate(spec.get("events", [])):
        gain = db(float(e.get("gain", 0)))
        pan = float(e.get("pan", 0))
        if e.get("file"):
            a = read_wav(base / e["file"])
            i = int(float(e["t"]) * SR)
            j = min(len(bus.L), i + len(a))
            if j > i:
                bus.L[i:j] += a[: j - i, 0] * gain
                bus.R[i:j] += a[: j - i, 1] * gain
            continue
        name = e.get("fx", "pop")
        if name not in FX:
            print(f"warning: unknown fx {name}", file=sys.stderr)
            continue
        sig = make_fx(name, e.get("dur"), float(e.get("pitch", 1.0)), int(e.get("seed", k + 1)))
        bus.add(sig, float(e["t"]) - preroll(name, e.get("dur")), gain, pan)
    return master(bus, wrap=spec.get("wrap", True), rms_db=float(spec.get("rms_db", -16)))


def main(argv):
    if len(argv) < 2 or argv[1] in ("-h", "--help"):
        print(__doc__)
        return 0
    cmd = argv[1]
    if cmd == "list":
        print(" ".join(sorted(FX)))
        return 0
    if cmd == "sfx":
        name, out = argv[2], argv[3]
        opt = {argv[i].lstrip("-"): argv[i + 1] for i in range(4, len(argv) - 1, 2)}
        sig = make_fx(name, float(opt["dur"]) if "dur" in opt else None, float(opt.get("pitch", 1)), int(opt.get("seed", 1)))
        write_wav(out, sig * 0.9)
        print(f"{out} {len(sig) / SR:.2f}s")
        return 0
    if cmd == "mix":
        p = Path(argv[2])
        spec = json.loads(p.read_text(encoding="utf-8"))
        x = render_spec(spec, p.parent)
        out = p.parent / spec.get("out", "mix.wav")
        write_wav(out, x)
        print(f"{out} {len(x) / SR:.2f}s")
        return 0
    print(f"unknown command {cmd}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
