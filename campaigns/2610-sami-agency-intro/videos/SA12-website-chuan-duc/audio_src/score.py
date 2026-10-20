"""SA12 · nhạc + SFX tự tạo (numpy, không sample ngoài): minimal glitch / IDM, 126 BPM, Đô thứ, rất sạch.
Kick mềm, click/tiếng máy làm bộ gõ, hat bitcrush, chuông FM, sub bass, pad mỏng; mỗi điểm đếm ngược 13 phách
(3 ô nhịp + 1 phách stutter). Mốc lấy từ project.json: K.b(n) trong cảnh = đầu cảnh + n × 60/126 giây.
Chạy:  python audio_src/score.py  →  public/audio/music.wav + music.mp3 (ffmpeg loudnorm −14 LUFS)
"""
import json, os, subprocess
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

HERE = os.path.dirname(os.path.abspath(__file__)); PROJ = os.path.dirname(HERE)
SR = 48000; B = 60 / 126
rng = np.random.default_rng(1226)
P = json.load(open(os.path.join(PROJ, 'project.json'), encoding='utf-8'))
SC = {s['id']: s['start'] / 30 for s in P['scenes']}
END = P['scenes'][-1]['end'] / 30
N = int((END + 0.3) * SR)
def at(sc, n=0.0): return SC[sc] + n * B            # K.b(n) tuyệt đối
def clip(sc, t): return SC[sc] - 8 / 30 + t           # thời gian clip HTML → tuyệt đối
def beat(n): return n * B                            # lưới tuyệt đối (phách 0 = 0 s)

# ── công cụ ──
def T(d): return np.arange(int(d * SR)) / SR
def lp(x, f, o=2): return sosfilt(butter(o, min(f, SR / 2 - 100), 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def add(buf, x, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= len(buf) or i + len(x) <= 0: return
    if i < 0: x = x[-i:]; i = 0
    x = x[:len(buf) - i]
    if x.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        buf[i:i + len(x), 0] += x * g * l * 1.414; buf[i:i + len(x), 1] += x * g * r * 1.414
    else: buf[i:i + len(x)] += x * g
def crush(x, bits=6, ds=4):
    y = np.repeat(x[::ds], ds)[:len(x)]; q = 2 ** bits
    return np.round(y * q) / q

# ── âm sắc ──
def kick(v=1.0):
    t = T(0.45); f = 48 + 90 * np.exp(-t / 0.035)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    return (x + 0.25 * np.exp(-t / 0.004) * rng.standard_normal(len(t)) * 0.3) * v
def click(v=0.5, f=3200, d=0.012):
    t = T(d); return np.sin(2 * np.pi * f * t) * np.exp(-t / (d / 4)) * v
def tick(v=0.4, f=5200):
    t = T(0.03); n = rng.standard_normal(len(t))
    return bp(n, f * 0.7, min(f * 1.4, 20000)) * np.exp(-t / 0.004) * v * 3
def hat(v=0.3, open_=False):
    t = T(0.25 if open_ else 0.06); n = rng.standard_normal(len(t))
    return crush(hp(n, 7000), 5, 3) * np.exp(-t / (0.08 if open_ else 0.012)) * v
def snapp(v=0.5):
    t = T(0.18); n = rng.standard_normal(len(t))
    return (bp(n, 900, 6000) * np.exp(-t / 0.03) * 0.8 + np.sin(2 * np.pi * 220 * t) * np.exp(-t / 0.02) * 0.4) * v
def fmbell(m, d=1.2, v=0.4, ratio=3.5, idx=2.0):
    f = hz(m); t = T(d)
    mod = idx * np.exp(-t / 0.25) * np.sin(2 * np.pi * f * ratio * t)
    return np.sin(2 * np.pi * f * t + mod) * np.exp(-t / (d / 3)) * np.minimum(1, t / 0.002) * v
def sub(m, d, v=0.6):
    f = hz(m); t = T(d)
    x = np.sin(2 * np.pi * f * t) + 0.15 * np.sin(4 * np.pi * f * t)
    e = np.minimum(1, t / 0.01) * np.where(t > d - 0.05, (d - t) / 0.05, 1)
    return x * e * v
def pad(ms, d, cut=1400, v=0.25):
    t = T(d); x = np.zeros(len(t))
    for m in ms:
        for dt in (-0.07, 0.0, 0.08):
            f = hz(m) * 2 ** (dt / 12); x += 2 * ((f * t + rng.random()) % 1) - 1
    x = lp(x / (len(ms) * 3), cut)
    e = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.8)
    return x * e * v
def whoosh(d=0.6, v=0.4, up=True):
    t = T(d); n = rng.standard_normal(len(t)); out = np.zeros(len(t))
    for k, s in enumerate(range(0, len(t), 480)):
        p = s / len(t); fc = 300 + (4500 if up else 3000) * (p if up else 1 - p)
        seg = n[s:s + 480]; out[s:s + 480] = bp(seg, fc * 0.6, fc * 1.4)
    return out * np.sin(np.pi * np.linspace(0, 1, len(t))) ** 2 * v * 2
def riser(d, v=0.35):
    t = T(d); f = 200 + 1800 * (t / d) ** 2
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3 + hp(rng.standard_normal(len(t)), 3000) * 0.4 * (t / d)
    return x * (t / d) ** 2 * v
def boom(v=1.0):
    t = T(1.6); f = 32 + 60 * np.exp(-t / 0.08)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.5) * v
def glitch(d=0.35, v=0.4, seed=0):
    r = np.random.default_rng(seed); t = T(d); out = np.zeros(len(t)); s = 0
    while s < len(t):
        L = int(r.integers(300, 2400)); kind = r.integers(0, 3); tt = np.arange(L) / SR
        if kind == 0: seg = np.sign(np.sin(2 * np.pi * r.uniform(200, 2400) * tt))
        elif kind == 1: seg = crush(r.standard_normal(L), 3, 8)
        else: seg = np.zeros(L)
        out[s:s + L] = seg[:len(out) - s] * r.uniform(0.3, 1); s += L
    return lp(out, 9000) * v
def blip(m, d=0.09, v=0.3, sq=False):
    f = hz(m); t = T(d); x = np.sign(np.sin(2 * np.pi * f * t)) if sq else np.sin(2 * np.pi * f * t)
    return lp(x, 4000) * np.exp(-t / (d / 3)) * v
def err(v=0.3):
    t = T(0.14); x = np.sign(np.sin(2 * np.pi * 180 * t)) + np.sign(np.sin(2 * np.pi * 191 * t))
    return lp(x, 1800) * np.exp(-t / 0.06) * v
def clunk(m, v=0.6):
    t = T(0.3); f = hz(m)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.05) + bp(rng.standard_normal(len(t)), 1500, 5000) * np.exp(-t / 0.008) * 0.6
    return x * v
def pop(v=0.5):
    t = T(0.12); f = 400 + 900 * np.exp(-t / 0.02); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.04) * v
def subhit(v=1.0):
    t = T(2.5); f = 40 + 30 * np.exp(-t / 0.1); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.8) * v
def reverb(x, sec=1.6, wet=0.25):
    t = T(sec); ir = rng.standard_normal((len(t), 2)) * np.exp(-t / (sec / 5))[:, None]
    ir[:, 0] = lp(ir[:, 0], 6000); ir[:, 1] = lp(ir[:, 1], 6000)
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1)
    return x + y / np.max(np.abs(y)) * np.max(np.abs(x)) * wet

mus = np.zeros((N, 2)); drm = np.zeros((N, 2)); bel = np.zeros((N, 2)); fx = np.zeros((N, 2))

# ── hoà âm Đô thứ (MIDI) ──
CH = {'Cm9': [48, 55, 58, 62, 63], 'Abmaj7': [44, 51, 55, 60, 63], 'Fm9': [41, 48, 51, 55, 56], 'Gm7': [43, 50, 53, 58, 62],
      'Ebmaj7': [39, 46, 50, 55, 58], 'G7b9': [43, 50, 53, 56, 59], 'Cadd9': [48, 55, 60, 62, 63]}
ARP = {'Cm9': [72, 75, 79, 74, 82, 79, 75, 74], 'Abmaj7': [68, 72, 75, 79, 75, 72, 70, 72], 'Fm9': [68, 72, 75, 79, 77, 75, 72, 68],
       'Gm7': [70, 74, 77, 74, 79, 77, 74, 70], 'Ebmaj7': [70, 74, 75, 79, 82, 79, 74, 70], 'G7b9': [71, 74, 77, 80, 77, 74, 71, 68], 'Cadd9': [72, 74, 79, 84, 79, 74, 72, 67]}

def groove(t0, t1, ch, level=1.0, kickOn=True, hats=True, bass=True, bells=True, stutterLast=False, seed=0):
    """lưới 16 nốt từ t0 tới t1 (s), theo phách tuyệt đối"""
    n0 = int(np.ceil(t0 / (B / 4) - 1e-6)); n1 = int(t1 / (B / 4))
    r = np.random.default_rng(seed)
    for n in range(n0, n1):
        t = n * B / 4; s16 = n % 16
        if stutterLast and t > t1 - B - 1e-3: continue
        if kickOn and s16 in (0, 4, 8, 12): add(drm, kick(0.9 if s16 == 0 else 0.75), t, level)
        if kickOn and s16 == 10 and (n // 16) % 2: add(drm, kick(0.45), t, level)
        if s16 in (4, 12) and kickOn: add(drm, snapp(0.32), t, level, 0.1)
        if hats and s16 % 2 == 1: add(drm, hat(0.22 if s16 % 4 == 3 else 0.12), t, level, 0.35)
        if hats and s16 == 14: add(drm, hat(0.16, True), t, level, -0.3)
        # click/tiếng máy (bộ gõ IDM, tất định theo seed)
        if r.random() < 0.42: add(drm, click(0.22, r.choice([2400, 3200, 4100, 5600])), t + r.choice([0, 0.012]), level, r.uniform(-0.7, 0.7))
        if r.random() < 0.18: add(drm, tick(0.25, r.choice([3000, 6000, 8000])), t, level, r.uniform(-0.8, 0.8))
        if bass and s16 in (0, 3, 6, 10): add(mus, sub(CH[ch][0] - 12 + (7 if s16 == 10 else 0), B / 4 * (3 if s16 != 10 else 2) * 0.95, 0.55), t, level)
        if bells and s16 % 2 == 0:
            m = ARP[ch][(n // 2) % 8]
            add(bel, fmbell(m, 0.9, 0.16 if s16 % 4 else 0.22), t, level, 0.4 * np.sin(n * 0.7))
    if stutterLast:  # phách cuối: lặp lát 1/32 của phách trước (stutter glitch)
        a = int((t1 - 2 * B) * SR); L = int(B / 8 * SR)
        if a > 0:
            sl = (drm[a:a + L] + bel[a:a + L] * 0.6).copy()
            for k in range(8): add(fx, sl * (0.9 - k * 0.07), t1 - B + k * B / 8, level * 0.85)
            add(fx, glitch(B * 0.9, 0.12, seed + 7), t1 - B, level)

def chord_pad(name, t0, d, v=0.22, cut=1400): add(mus, pad(CH[name], d, cut, v), t0, 1.0)

# ── S01 · hook: tối, chỉ pad + lấp lánh + glitch tách ──
chord_pad('Cm9', 0.0, at('S02') + 0.5, 0.16, 900)
add(mus, sub(36, at('S02'), 0.25), 0.0)
add(fx, riser(0.4, 0.3), 0.0); add(fx, fmbell(84, 1.5, 0.3, 5.0, 3.0), 0.12, 1, 0.2); add(fx, fmbell(91, 1.2, 0.18, 5.0, 3.0), 0.2, 1, -0.3)
add(fx, glitch(0.42, 0.55, 1), at('S01', 2.6)); add(fx, boom(0.5), at('S01', 2.6))
for k, n in enumerate([4.2, 4.3, 4.4]): add(fx, blip(96, 0.05, 0.22), at('S01', n))
add(fx, whoosh(1.2, 0.18), at('S01', 4.8))
for n in range(0, 12):  # click thưa như máy quét
    if n % 3 == 1: add(drm, click(0.18, 4100), beat(n), 1, 0.5 if n % 2 else -0.5)

# ── S02 · nỗi đau: groove lọc, 7 lỗi ──
s2, s3 = at('S02'), at('S03')
groove(s2 + B * 2, s3, 'Cm9', 0.55, kickOn=True, hats=False, bass=True, bells=False, seed=2)
chord_pad('Fm9', s2, s3 - s2 + 0.3, 0.12, 700)
r0 = clip('S02', 8 / 30 + 2.6 * B)
for i in range(7): add(fx, err(0.28), r0 + i * 0.36 + 0.18, 1, -0.2 + i * 0.07)
add(fx, glitch(0.3, 0.25, 22), r0 + 7 * 0.36)
add(fx, blip(60, 0.06, 0.3), at('S02', 10.2)); add(fx, whoosh(0.5, 0.3, False), at('S02', 10.2) + 0.1)

# ── S03 · riser → NỔ lớp, 8 tick nhãn ──
T0 = at('S03', 3.0)
groove(s3, T0 - B, 'Abmaj7', 0.4, kickOn=False, hats=True, bass=False, bells=True, seed=3)
add(fx, riser(T0 - s3, 0.45), s3)
add(fx, boom(1.0), T0); add(fx, glitch(0.5, 0.45, 33), T0); add(fx, whoosh(1.0, 0.35), T0 - 0.15)
chord_pad('Abmaj7', T0, at('S04') - T0 + 0.4, 0.2, 2200)
for k in range(8): add(fx, fmbell(84 - [0, 3, 5, 7, 10, 12, 15, 17][k], 0.5, 0.18, 2.0, 1.2), T0 + 0.9 + k * 0.17, 1, 0.6)
groove(T0 + B, at('S04'), 'Abmaj7', 0.8, seed=31)

# ── S04–S10 · đếm ngược 07 → 01 ──
PROG = {'S04': 'Cm9', 'S05': 'Abmaj7', 'S06': 'Fm9', 'S07': 'Gm7', 'S08': 'Ebmaj7', 'S09': 'Fm9', 'S10': 'G7b9'}
order = ['S04', 'S05', 'S06', 'S07', 'S08', 'S09', 'S10']
for k, sc in enumerate(order):
    a = at(sc); b = at(order[k + 1]) if k < 6 else at('S11')
    groove(a, b, PROG[sc], 1.0, stutterLast=True, seed=40 + k)
    chord_pad(PROG[sc], a, b - a + 0.3, 0.13, 1600)
    add(fx, glitch(0.42, 0.3, 50 + k), clip(sc, 8 / 30 - 0.05))           # số đếm glitch vào
    add(fx, fmbell(96 - k, 0.6, 0.22, 7.0, 2.5), a, 1, 0.3)
    add(fx, whoosh(0.5, 0.22, True), b - 0.45)                              # bay xuyên lớp
def tap(sc, n, v=0.35): add(fx, click(v, 2600, 0.02) + 0, at(sc, n), 1, 0.15); add(fx, tick(v * 0.6, 7000), at(sc, n), 1, 0.15)
tap('S04', 8.6); add(fx, blip(79, 0.25, 0.22), at('S04', 8.6) + 0.3); add(fx, blip(84, 0.3, 0.2), at('S04', 8.6) + 0.42)
tap('S05', 5.6); add(fx, clunk(60, 0.5), at('S05', 7.2) + 0.32); tap('S05', 9.4); add(fx, fmbell(88, 0.8, 0.2), at('S05', 9.4) + 0.15)
tap('S06', 4.8); add(fx, glitch(0.55, 0.18, 66), at('S06', 4.8) + 0.1); tap('S06', 10.0); add(fx, glitch(0.45, 0.15, 67), at('S06', 10.0) + 0.1)
for i in range(6): add(fx, blip(84 + (i % 3) * 3, 0.05, 0.15), at('S07', 4.4) + i * 0.07)
tap('S07', 8.3); add(fx, blip(91, 0.2, 0.18), at('S07', 8.3) + 0.95)
for n in (2.2, 5.6, 7.4): add(fx, whoosh(0.4, 0.16, n != 5.6), at('S08', n))
tap('S08', 9.6, 0.45); add(fx, whoosh(0.5, 0.2), at('S08', 9.6) + 0.15)
for n in (4.2, 7.6): add(fx, whoosh(0.7, 0.22, False), at('S09', n)); add(fx, glitch(0.25, 0.15, int(n * 10)), at('S09', n) + 0.3)
a10, b10 = at('S10', 2.4), at('S10', 7.4)
tt = a10
while tt < b10: add(fx, tick(0.22, 6500), tt, 1, -0.4); tt += 0.1
add(fx, fmbell(91, 1.2, 0.3, 3.5, 1.5), b10); add(fx, fmbell(84, 1.2, 0.2, 3.5, 1.5), b10 + 0.02)
for i in range(3): add(fx, pop(0.25), at('S10', 8.2) + i * 0.22)

# ── S11 · sập lại: 8 cú khớp cơ khí, hợp âm mở ──
s11, s12 = at('S11'), at('S12')
C0, FL = at('S11', 3.4), at('S11', 7.0)
groove(s11, C0, 'G7b9', 0.6, kickOn=False, seed=70)
add(fx, fmbell(60, 1.4, 0.25, 1.0, 3.0), at('S11', 1.2))
for i in range(8): add(fx, clunk(43 + [0, 2, 3, 5, 7, 8, 10, 12][i], 0.55), C0 + i * 0.16 + 0.38, 1, -0.3 + i * 0.08)
add(fx, whoosh(1.2, 0.3), FL); chord_pad('Cadd9', FL + 0.2, s12 - FL + 1.5, 0.22, 3000)
add(fx, boom(0.55), FL + 1.2)
for k, m in enumerate([72, 74, 79, 84]): add(bel, fmbell(m, 1.6, 0.22), FL + 1.2 + k * 0.08, 1, -0.3 + k * 0.2)
groove(FL + 1.2, s12, 'Cadd9', 0.7, kickOn=False, hats=True, bass=True, seed=71)

# ── S12 · case thật ──
s13 = at('S13')
groove(s12, s13 - B * 0.5, 'Abmaj7', 0.85, seed=80)
chord_pad('Abmaj7', s12, s13 - s12, 0.12, 1800)
for i in range(4): add(fx, whoosh(0.5, 0.15), clip('S12', 0.2 + i * 0.22)); add(fx, pop(0.2), at('S12', 2.4) + i * B)

# ── S13 · nhịp thở: chỉ pad, rồi chuông nhẹ ──
s14 = at('S14'); FL13 = at('S13', 2.4)
chord_pad('Ebmaj7', s13, s14 - s13 + 0.5, 0.3, 1300)
add(fx, fmbell(79, 2.0, 0.25, 2.0, 1.5), FL13); add(fx, whoosh(0.8, 0.15), FL13 - 0.1)
groove(FL13 + B * 2, s14, 'Ebmaj7', 0.45, kickOn=False, hats=False, bass=False, bells=True, seed=90)
for i in range(3): add(fx, blip(88 + i * 2, 0.08, 0.15), FL13 + 0.9 + i * 0.45)

# ── S14 · CTA ──
s15 = at('S15')
groove(s14, s15, 'Fm9', 0.95, seed=100)
chord_pad('Fm9', s14, s15 - s14 + 0.3, 0.14, 2000)
add(fx, pop(0.3), at('S14', 1.2)); add(fx, pop(0.3), at('S14', 5.05))
for i in range(6): add(fx, click(0.12, 3000), at('S14', 3) + i * 0.09)
add(fx, pop(0.5), at('S14', 3.6)); add(fx, fmbell(84, 0.8, 0.25), at('S14', 3.6) + 0.05)

# ── S15 · end card: sub-hit + hợp âm kết ──
add(fx, glitch(0.3, 0.2, 150), s15 - 0.25)
add(fx, subhit(1.0), clip('S15', 0.55)); add(fx, whoosh(0.5, 0.2, False), clip('S15', 0.05))
chord_pad('Cadd9', clip('S15', 0.5), END - clip('S15', 0.5) + 0.3, 0.26, 2600)
for k, m in enumerate([60, 67, 72, 74, 79]): add(bel, fmbell(m, 3.0, 0.2, 2.0, 1.0), clip('S15', 0.55) + k * 0.03)

# ── trộn ──
mix = mus * 0.9 + reverb(bel, 2.2, 0.35) * 0.9 + drm * 0.8 + reverb(fx, 1.2, 0.2) * 1.0
mix = hp(mix.T, 25).T if False else mix
fo = int(0.8 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
mix = np.tanh(mix / (np.max(np.abs(mix)) + 1e-9) * 1.4) * 0.9
import soundfile as sf
wav = os.path.join(PROJ, 'public', 'audio', 'music.wav'); sf.write(wav, mix, SR, subtype='PCM_16')
mp3 = os.path.join(PROJ, 'public', 'audio', 'music.mp3')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', '-b:a', '192k', mp3], check=True)
print('ok', round(END, 2), 's →', mp3)
