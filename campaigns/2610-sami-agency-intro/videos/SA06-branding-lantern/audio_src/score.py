"""SA06 · nhạc + SFX tự tạo (numpy + scipy, tất định).
Lo-fi jazzy hip-hop · 88 BPM, swing 16th · Rê thứ (Dm9 – G13 – Bbmaj7 – A7b9) · Rhodes + koto (ngũ cung Rê thứ) + bass + trống boom-bap
lọc, vinyl crackle; đàn dây dâng lên khi đèn lồng bật (S05).
Chạy:  python audio_src/score.py  → audio_src/mix.wav
       ffmpeg -i audio_src/mix.wav -af loudnorm=I=-14:TP=-1.2:LRA=9 -ar 44100 -b:a 192k public/audio/music.mp3
Mốc lấy từ project.json (giây video = đầu cảnh + giây trong clip - 8/30).
"""
import json, os, wave
import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
P = json.load(open(os.path.join(HERE, '..', 'project.json'), encoding='utf-8'))
SC = {s['id']: s['start'] / 30 for s in P['scenes']}
DUR = P['scenes'][-1]['end'] / 30
N = int(SR * DUR)
OFF = 8 / 30
BEAT = 60 / 88
rng = np.random.default_rng(606)
BUS = {k: np.zeros((2, N)) for k in ('drums', 'music', 'fx')}


def cue(scene, clip_t): return SC[scene] + clip_t - OFF
def tt(d): return np.arange(int(d * SR)) / SR
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def filt(x, kind, f, order=2):
    sos = butter(order, f, btype=kind, fs=SR, output='sos'); return sosfilt(sos, x, axis=-1)


def add(bus, sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N: return
    if i < 0: sig = sig[-i:]; i = 0
    s = sig[: N - i] * gain
    BUS[bus][0, i:i + len(s)] += s * np.sqrt(0.5 * (1 - pan))
    BUS[bus][1, i:i + len(s)] += s * np.sqrt(0.5 * (1 + pan))


# ── nhạc cụ ───────────────────────────────────────────────────────────
def kick():
    t = tt(0.5); f = 44 + 95 * np.exp(-t * 28)
    return np.tanh(1.8 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5)) * 0.85
def snare():
    t = tt(0.32); n = filt(rng.standard_normal(len(t)), 'band', [1400, 6000])
    body = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 28)
    return (n * np.exp(-t * 17) * 0.55 + body * 0.45) * 0.5
def hat(open_=False):
    t = tt(0.32 if open_ else 0.07); n = filt(rng.standard_normal(len(t)), 'high', 7000)
    return n * np.exp(-t * (11 if open_ else 70)) * 0.16
def rim():
    t = tt(0.06); return (np.sin(2 * np.pi * 1700 * t) + 0.5 * filt(rng.standard_normal(len(t)), 'high', 3000)) * np.exp(-t * 90) * 0.18
def rhodes(m, d, vel=1.0):
    t = tt(d + 1.2); f = hz(m)
    idx = 1.5 * np.exp(-t * 3.5)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
    s += 0.06 * np.sin(2 * np.pi * f * 7.1 * t) * np.exp(-t * 28)  # tine
    env = np.minimum(1, t / 0.004) * np.exp(-t * 0.9) * np.clip((d + 0.35 - t) / 0.35, 0, 1)
    return s * env * 0.11 * vel
def koto(m, d=1.6, vel=1.0, bend=0.0):
    t = tt(d); f0 = hz(m) * (1 + bend * np.exp(-t * 9))
    ph = 2 * np.pi * np.cumsum(f0) / SR; s = np.zeros(len(t))
    for k in range(1, 11):
        s += np.sin(ph * k * (1 + 0.0009 * k * k)) * (1 / k ** 1.15) * np.exp(-t * (2.2 + 1.4 * k))
    click = filt(rng.standard_normal(len(t)), 'band', [2000, 7000]) * np.exp(-t * 160) * 0.25
    return (s + click) * np.minimum(1, t / 0.0015) * 0.16 * vel
def bass(m, d):
    t = tt(d); f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    env = np.minimum(1, t / 0.01) * np.exp(-t * 1.2) * np.clip((d - t) / 0.06, 0, 1)
    return np.tanh(1.2 * s) * env * 0.36
def strings(ms, d, att=1.6):
    t = tt(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-0.07, 0.0, 0.07):
            f = hz(m + det)
            for k in range(1, 14): s += np.sin(2 * np.pi * f * k * t + k * 0.7 + det * 10) / k
    s = filt(s, 'low', 2600)
    env = np.minimum(1, t / att) * np.clip((d - t) / 1.2, 0, 1)
    return s * env * 0.012
def shimmer(d=3.0):
    t = tt(d); s = np.zeros(len(t))
    for i, m in enumerate([86, 89, 93, 96, 98, 101, 105]):
        s += np.sin(2 * np.pi * hz(m) * t) * np.exp(-np.maximum(0, t - i * 0.05) * 1.3) * (t > i * 0.05)
    return s * 0.05
def whoosh(d=0.8):
    t = tt(d); out = filt(rng.standard_normal(len(t)), 'band', [500, 6000])
    return out * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2 * 0.14
def revcym(d=1.8):
    t = tt(d); n = filt(rng.standard_normal(len(t)), 'high', 5000)
    return n * (t / d) ** 3 * 0.22
def click(g=1.0):
    t = tt(0.025); return filt(rng.standard_normal(len(t)), 'high', 2500) * np.exp(-t * 300) * 0.22 * g
def tick():
    t = tt(0.02); return np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 400) * 0.08
def thud():
    t = tt(0.35); f = 60 + 120 * np.exp(-t * 35)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11) + filt(rng.standard_normal(len(t)), 'low', 900) * np.exp(-t * 30) * 0.5) * 0.7
def pop():
    t = tt(0.15); f = 500 + 900 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 26) * 0.35
def subhit():
    t = tt(1.6); f = 38 + 50 * np.exp(-t * 8)
    return np.tanh(1.5 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-t * 2.4) * 0.75
def swish():
    t = tt(0.22); return filt(rng.standard_normal(len(t)), 'band', [1500, 8000]) * np.sin(np.pi * t / 0.22) ** 2 * 0.07


# ── hoà âm ────────────────────────────────────────────────────────────
CH = [([50, 53, 57, 60, 64], 38), ([53, 57, 59, 64], 43), ([53, 57, 58, 62], 46), ([55, 58, 61, 65], 45)]  # Dm9 G13 Bbmaj7 A7b9
PENTA = [62, 65, 67, 69, 72, 74, 77, 79, 81, 84]
SW = 0.58  # swing


def s16(o, n):  # thời điểm 16th thứ n (có swing) từ gốc o
    b, r = divmod(n, 4)
    off = [0, SW * 0.5, 0.5, 0.5 + SW * 0.5][r]
    return o + (b + off) * BEAT


def groove(o, bars, hats=True, kick_ok=True, vel=1.0):
    for bar in range(bars):
        base = bar * 16
        for n in range(16):
            t = s16(o, base + n)
            if kick_ok and n in (0, 7, 10): add('drums', kick(), t, vel * (1 if n == 0 else 0.8))
            if n in (4, 12): add('drums', snare(), t + 0.012, vel)
            if hats and n % 2 == 0: add('drums', hat(), t, vel * (1 if n % 4 == 0 else 0.6), 0.25)
            if hats and n == 14 and bar % 2: add('drums', hat(True), t, vel * 0.7, 0.25)
            if not hats and n in (6, 14): add('drums', rim(), t, vel * 0.8, -0.2)


def harmony(o, bars, start_chord=0, rh=1.0, bs=True):
    for bar in range(bars):
        ch, root = CH[(bar + start_chord) % 4]
        t = o + bar * 4 * BEAT
        for i, m in enumerate(ch):  # rải nhẹ
            add('music', rhodes(m, 3.2 * BEAT), t + i * 0.012, rh, -0.3 + 0.15 * i)
        add('music', rhodes(ch[-1] + 12, 0.6, 0.5), t + 2.5 * BEAT, rh * 0.7, 0.3)
        if bs:
            add('music', bass(root, 1.4 * BEAT), t)
            add('music', bass(root, 0.6 * BEAT), t + 2.5 * BEAT, 0.8)
            add('music', bass(root + 7, 0.8 * BEAT), t + 3.0 * BEAT, 0.7)


def koto_phrase(o, notes, vel=1.0, pan=0.35):
    for b, i, d, *bend in notes:
        add('music', koto(PENTA[i], d, vel, bend[0] if bend else 0.0), o + b * BEAT, 1.0, pan)


PH = [  # (nhịp, bậc, độ dài, [nhấn dây])
    [(0, 5, 1.4, 0.02), (0.75, 4, 0.8), (1.5, 3, 1.2), (3, 2, 1.8, 0.03)],
    [(0, 3, 0.8), (0.5, 4, 0.8), (1, 5, 1.0), (2, 7, 1.6, 0.025), (3.5, 6, 1.2)],
    [(0, 8, 1.2, 0.02), (0.75, 7, 0.8), (1.5, 5, 1.0), (2.25, 4, 0.8), (3, 5, 2.0)],
    [(0, 2, 0.8), (0.5, 3, 0.8), (1.25, 5, 1.0), (2, 4, 1.4, 0.03), (3, 3, 2.2)],
]

# ── S01 (0–9 s): u ám, Rhodes đục, không trống; 4 cú đập khớp ấn phẩm rơi
o1 = cue('S01', 0.4)
harmony(o1 - 0.05, 3, 0, rh=0.9, bs=False)
for i in range(4): add('fx', thud(), cue('S01', 0.4 + i * 0.68), 0.9, [-0.3, 0.3, -0.2, 0.2][i])
add('music', strings([38, 45], 6.0, att=2.5), cue('S01', 4.8), 0.8)
add('fx', whoosh(1.1), SC['S02'] - 0.7, 1.0)
# ── S02–S04 (9–31 s): groove A vào ở đầu S02, koto từ S03
oA = SC['S02']
barsA = int((cue('S05', 0.0) - 0.9 - oA) / (4 * BEAT))
groove(oA, barsA, hats=True)
harmony(oA, barsA, 0)
for k in range(2, barsA, 2): koto_phrase(oA + k * 4 * BEAT, PH[(k // 2) % 4], 0.85)
# typing / click S03 (chip + concept), tick ×16 ở S03–S04
for i in range(4):
    for j in range(4): add('fx', click(0.6), cue('S03', 3.0 + i * 0.32 + j * 0.07), 1.0, 0.2)
for j in range(14): add('fx', click(0.5), cue('S03', 4.45 + j * 0.075), 1.0, 0.1)
for i in range(5): add('fx', click(1.0), cue('S03', 0.75 + i * 0.42 + 0.42), 1.0, -0.2)
for sc_, a, b in (('S03', 0.5, 6.8), ('S04', 0.3, 8.6)):
    t = a
    while t < b: add('fx', tick(), cue(sc_, t), 1.0, 0.4); t += BEAT / 4
add('fx', whoosh(0.7), SC['S04'] - 0.45, 0.6)
# ── S05 ★ đèn bật: ngắt trống, cymbal ngược, shimmer + đàn dây + sub
tL = cue('S05', 0.45)
add('fx', revcym(1.8), tL - 1.8, 0.45)
add('fx', shimmer(3.5), tL, 1.0)
add('fx', subhit(), tL, 0.6)
add('music', strings([50, 57, 62, 65, 69], 7.5, att=0.9), tL - 0.2, 1.3)
koto_phrase(tL + 0.1, [(0, 5, 1.6, 0.02), (1, 7, 1.6), (2, 9, 2.4, 0.025)], 1.0, 0.0)
# ── S06–S11: groove B sáng hơn, gốc lưới tại khoảnh khắc đèn bật
oB = tL + 4 * BEAT
barsB = int((cue('S11', 8.35) - oB) / (4 * BEAT))
groove(oB, barsB, hats=True)
harmony(oB, barsB, 0, rh=1.05)
for k in range(0, barsB, 2): koto_phrase(oB + k * 4 * BEAT, PH[(k // 2 + 1) % 4], 1.0, 0.35 if k % 4 == 0 else -0.35)
# SFX S06–S10
add('fx', click(1.4), cue('S06', 3.7), 1.0)
add('fx', pop(), cue('S06', 3.7), 0.4)
for i in range(10): add('fx', click(0.5), cue('S07', 0.4 + i * 0.235), 1.0, 0.25)
add('fx', whoosh(0.6), SC['S08'] - 0.35, 0.5)
for i in range(7): add('fx', click(0.7), cue('S08', 0.5 + i * 0.24 + 0.4), 1.0, -0.2 + 0.07 * i)
add('fx', whoosh(0.8), SC['S09'] - 0.5, 0.6)
for i in range(5): add('fx', swish(), cue('S09', 0.45 + i * 0.85), 1.0, 0.3 * (-1) ** i)
for i in range(3): add('fx', pop(), cue('S11', [0.6, 3.0, 5.4][i]), 0.35)
# ── nhịp thở cuối S11 + S12 end card
add('music', strings([50, 57, 60, 64, 69], 9.5, att=1.2), cue('S11', 8.1), 1.0)
o12 = cue('S12', 1.4)
for i, m in enumerate([50, 57, 60, 64, 65, 69]): add('music', rhodes(m, 5.0), o12 + i * 0.03, 1.0, -0.3 + 0.12 * i)
add('music', bass(38, 4.0), o12, 0.9)
koto_phrase(o12 + 0.3, [(0, 5, 1.4), (0.5, 6, 1.2), (1, 7, 1.6, 0.02), (2.5, 5, 3.0)], 0.9, 0.2)
add('fx', pop(), cue('S12', 1.4), 1.0)
add('fx', subhit(), cue('S12', 2.6), 0.9)

# ── vinyl + mix ───────────────────────────────────────────────────────
hiss = filt(rng.standard_normal((2, N)), 'low', 5000) * 0.0045
crack = np.zeros((2, N)); idx = rng.integers(0, N, int(DUR * 9))
crack[0, idx] = rng.uniform(-1, 1, len(idx)) * 0.35; crack[1, (idx + 37) % N] = rng.uniform(-1, 1, len(idx)) * 0.3
crack = filt(crack, 'band', [800, 6000])
dr = filt(BUS['drums'], 'low', 6500)
# S01: nhạc đục (lọc thấp), mở dần ở S02
tm = np.arange(N) / SR
open_ = np.clip((tm - (SC['S02'] - 0.5)) / 1.5, 0, 1)
mus = BUS['music']
mus = filt(mus, 'low', 900) * (1 - open_) + filt(mus, 'low', 7000) * open_
# duck nhẹ theo kick
env = np.abs(filt(BUS['drums'][0], 'low', 120)); env = env / (env.max() + 1e-9)
mix = dr * 0.9 + mus * (1 - 0.25 * env) + BUS['fx'] + hiss + crack
# fade cuối
fo = np.clip((DUR - tm) / 1.5, 0, 1); mix *= fo
mix = np.tanh(mix * 1.1) / 1.1
mix /= np.abs(mix).max() + 1e-9
mix *= 0.89
pcm = (mix.T * 32767).astype('<i2')
with wave.open(os.path.join(HERE, 'mix.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok', round(DUR, 2), 's · barsA', barsA, '· barsB', barsB)
