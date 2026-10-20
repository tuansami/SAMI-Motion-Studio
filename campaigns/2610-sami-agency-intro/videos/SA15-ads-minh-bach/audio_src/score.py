"""SA15 · nhạc + SFX tự tạo (numpy, không sample ngoài): pulse căng 100 BPM, cello ostinato (synth có tiếng vĩ) + hi-hat 16 nốt
+ trống trầm, Fa thăng thứ (F#m – D – Bm – C#7) → giải toả sáng ở phần minh bạch (từ S08) sang La trưởng (A – E – F#m – D),
pizzicato + chuông + pad ấm. Mốc lấy từ project.json: K.b(n) trong cảnh = đầu cảnh + n × 0,6 s.
Chạy:  python audio_src/score.py  →  public/audio/music.wav + music.mp3 (ffmpeg loudnorm −14 LUFS)
"""
import json, os, subprocess
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

HERE = os.path.dirname(os.path.abspath(__file__)); PROJ = os.path.dirname(HERE)
SR = 48000; B = 0.6; BAR = 4 * B
rng = np.random.default_rng(1515)
P = json.load(open(os.path.join(PROJ, 'project.json'), encoding='utf-8'))
SC = {s['id']: s['start'] / 30 for s in P['scenes']}
END = P['scenes'][-1]['end'] / 30
N = int((END + 0.5) * SR)
def at(sc, n=0.0): return SC[sc] + n * B            # K.b(n) tuyệt đối
def clip(sc, t): return SC[sc] - 8 / 30 + t           # thời gian clip HTML → tuyệt đối

def T(d): return np.arange(int(d * SR)) / SR
def lp(x, f, o=2): return sosfilt(butter(o, min(f, SR / 2 - 100), 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, min(hi, SR / 2 - 100)], 'band', fs=SR, output='sos'), x)
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

# ── âm sắc ──
def cello(m, d, v=0.5, acc=1.0):
    """cello spiccato/legato: răng cưa giới hạn hài + vibrato + tiếng vĩ"""
    f = hz(m); t = T(d + 0.08)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t / 0.25)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR; x = np.zeros(len(t))
    for k in range(1, 14):
        if f * k > 9000: break
        x += np.sin(k * ph) / k * (1.0 if k < 4 else 0.7)
    bow = bp(rng.standard_normal(len(t)), 1200, 4200) * 0.05 * np.exp(-t / 0.05) * acc
    e = np.minimum(1, t / 0.012) * np.where(t > d, np.exp(-(t - d) / 0.03), 1) * (0.7 + 0.3 * np.exp(-t / 0.08) * acc)
    return lp(x * 0.55 + bow, 2400) * e * v
def drum(v=1.0):
    t = T(0.7); f = 55 + 70 * np.exp(-t / 0.05)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.25) + lp(rng.standard_normal(len(t)), 600) * np.exp(-t / 0.03) * 0.4) * v
def hat(v=0.25, open_=False):
    t = T(0.25 if open_ else 0.05); return hp(rng.standard_normal(len(t)), 8000) * np.exp(-t / (0.07 if open_ else 0.01)) * v
def rim(v=0.3):
    t = T(0.08); return bp(rng.standard_normal(len(t)), 1800, 5000) * np.exp(-t / 0.012) * v * 2 + np.sin(2 * np.pi * 900 * t) * np.exp(-t / 0.01) * v
def pluck(m, v=0.3, d=0.6):
    f = hz(m); t = T(d); x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return x * np.exp(-t / 0.13) * np.minimum(1, t / 0.003) * v
def fmbell(m, d=1.2, v=0.3, ratio=3.5, idx=2.0):
    f = hz(m); t = T(d); mod = idx * np.exp(-t / 0.25) * np.sin(2 * np.pi * f * ratio * t)
    return np.sin(2 * np.pi * f * t + mod) * np.exp(-t / (d / 3)) * np.minimum(1, t / 0.002) * v
def pad(ms, d, cut=1400, v=0.22, att=0.6):
    t = T(d); x = np.zeros(len(t))
    for m in ms:
        for dt in (-0.08, 0.0, 0.09):
            f = hz(m) * 2 ** (dt / 12); x += 2 * ((f * t + rng.random()) % 1) - 1
    x = lp(x / (len(ms) * 3), cut)
    return x * np.minimum(1, t / att) * np.minimum(1, (d - t) / 0.8) * v
def sub(m, d, v=0.5):
    f = hz(m); t = T(d); e = np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.08)
    return np.sin(2 * np.pi * f * t) * e * v
def whoosh(d=0.6, v=0.4, up=True):
    t = T(d); n = rng.standard_normal(len(t)); out = np.zeros(len(t))
    for s in range(0, len(t), 480):
        p = s / len(t); fc = 300 + 4200 * (p if up else 1 - p); out[s:s + 480] = bp(n[s:s + 480], fc * 0.6, fc * 1.4)
    return out * np.sin(np.pi * np.linspace(0, 1, len(t))) ** 2 * v * 2
def riser(d, v=0.35):
    t = T(d); f = 180 + 1600 * (t / d) ** 2
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.3 + hp(rng.standard_normal(len(t)), 3000) * 0.4 * (t / d)
    return x * (t / d) ** 2 * v
def boom(v=1.0):
    t = T(1.8); f = 30 + 55 * np.exp(-t / 0.09); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.55) * v
def coin(v=0.5):
    """đồng xu rơi vào khe: tiếng kim loại (các mode không hài) + thud"""
    t = T(0.6); x = np.zeros(len(t))
    for f, a, dc in ((2350, 1, 0.12), (3870, .6, 0.09), (5230, .4, 0.07), (6900, .25, 0.05)): x += a * np.sin(2 * np.pi * f * t) * np.exp(-t / dc)
    th = np.sin(2 * np.pi * (90 + 120 * np.exp(-t / 0.02)) * t) * np.exp(-t / 0.06)
    return (x * 0.35 + th * 0.8 + bp(rng.standard_normal(len(t)), 2000, 8000) * np.exp(-t / 0.01) * 0.4) * v
def crack(d=1.6, v=0.4):
    """vết nứt: chuỗi tách tách nhỏ dày dần"""
    out = np.zeros(int(d * SR)); r = np.random.default_rng(7)
    for k in range(70):
        p = (k / 70) ** 0.6; i = int(p * (d - 0.05) * SR); L = int(0.004 * SR)
        out[i:i + L] += bp(r.standard_normal(L), 2500, 9000) * r.uniform(0.3, 1)
    return out * v
def shatter(v=0.8):
    t = T(2.2); x = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.18) * 0.7
    r = np.random.default_rng(11)
    for k in range(60):  # mảnh kính leng keng
        s = int(r.uniform(0.02, 1.9) * SR); f = r.uniform(3000, 9000); tt = T(0.12)
        seg = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.03) * r.uniform(0.05, 0.25) * np.exp(-s / SR / 0.9)
        x[s:s + len(seg)] += seg[:len(x) - s]
    return x * v
def water(d, v=0.15, seed=0):
    """dòng chảy: tiếng ục ục (sóng sin trượt cao độ ngẫu nhiên) + rì rào"""
    r = np.random.default_rng(seed); out = lp(rng.standard_normal(int(d * SR)), 900) * 0.25
    for k in range(int(d * 14)):
        s = int(r.uniform(0, d - 0.08) * SR); tt = T(0.06); f0 = r.uniform(250, 700)
        b = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 2.5 * tt / 0.06)) / SR) * np.sin(np.pi * tt / 0.06) * r.uniform(0.2, 0.6)
        out[s:s + len(b)] += b
    e = np.minimum(1, np.arange(len(out)) / SR / 0.2) * np.minimum(1, (len(out) - np.arange(len(out))) / SR / 0.3)
    return out * e * v
def key(v=0.2):
    t = T(0.05); return (bp(rng.standard_normal(len(t)), 2000, 7000) * np.exp(-t / 0.006) + np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.01) * 0.5) * v
def squeak(d=0.7, v=0.25):
    t = T(d); f = 500 + 250 * np.sin(2 * np.pi * 1.3 * t) + 40 * np.sin(2 * np.pi * 31 * t)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.3 + np.sin(2 * np.pi * np.cumsum(f * 2) / SR)
    return lp(x, 3000) * np.sin(np.pi * t / d) * v
def thud(v=0.6):
    t = T(0.35); return (np.sin(2 * np.pi * (70 + 80 * np.exp(-t / 0.03)) * t) * np.exp(-t / 0.08) + lp(rng.standard_normal(len(t)), 1500) * np.exp(-t / 0.02) * 0.5) * v
def tick(v=0.2, f=6000):
    t = T(0.02); return bp(rng.standard_normal(len(t)), f * 0.7, f * 1.4) * np.exp(-t / 0.003) * v * 3
def pop(v=0.5):
    t = T(0.12); f = 400 + 900 * np.exp(-t / 0.02); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.04) * v
def subhit(v=1.0):
    t = T(2.5); f = 40 + 30 * np.exp(-t / 0.1); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.8) * v
def reverb(x, sec=1.8, wet=0.25):
    t = T(sec); ir = rng.standard_normal((len(t), 2)) * np.exp(-t / (sec / 5))[:, None]
    ir[:, 0] = lp(ir[:, 0], 5000); ir[:, 1] = lp(ir[:, 1], 5000)
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1)
    return x + y / (np.max(np.abs(y)) + 1e-9) * np.max(np.abs(x)) * wet

mus = np.zeros((N, 2)); drm = np.zeros((N, 2)); bel = np.zeros((N, 2)); fx = np.zeros((N, 2))

# ── hoà âm ──  (MIDI; cello gốc ở quãng 2–3)
MIN = [('F#m', 42, [54, 57, 61, 64]), ('D', 38, [50, 54, 57, 61]), ('Bm', 35, [50, 54, 59, 61]), ('C#7', 37, [49, 53, 56, 59])]
MAJ = [('A', 45, [57, 61, 64, 69]), ('E', 40, [56, 59, 64, 68]), ('F#m', 42, [54, 57, 61, 66]), ('D', 38, [54, 57, 62, 66])]
OST = [0, 0, 7, 0, 12, 0, 7, 10]     # ostinato 8 nốt móc / ô nhịp (10 = quãng 7 thứ, nhấn căng)
OSTM = [0, 7, 12, 7, 16, 12, 7, 4]   # bản trưởng, mở hơn
def chord_at(t, prog, t0): return prog[int((t - t0) // BAR) % 4]

def pulse(t0, t1, prog, base, lvl=1.0, hats=True, drums=True, cel=True, maj=False, plk=False, padv=0.0, seed=0):
    r = np.random.default_rng(seed)
    n0 = int(np.ceil(t0 / (B / 4) - 1e-6)); n1 = int(t1 / (B / 4))
    for n in range(n0, n1):
        t = n * B / 4; s16 = n % 16; name, root, tri = chord_at(t, prog, base)
        if cel and s16 % 2 == 0:
            iv = (OSTM if maj else OST)[(s16 // 2) % 8]
            m = root + iv + (0 if root >= 40 else 12)
            add(mus, cello(m, B / 2 * 0.62, 0.32 * lvl, 1.3 if s16 % 8 == 0 else 0.8), t, 1, -0.25)
        if drums and s16 in (0, 8): add(drm, drum(0.85 if s16 == 0 else 0.6), t, lvl)
        if drums and s16 in (4, 12): add(drm, rim(0.22), t, lvl, 0.2)
        if drums and s16 == 14 and (n // 16) % 2: add(drm, drum(0.4), t, lvl)
        if hats: add(drm, hat(0.16 if s16 % 4 == 2 else 0.08), t, lvl, 0.35 * (1 if s16 % 2 else -1))
        if plk and s16 % 2 == 0:
            m = tri[(s16 // 2 + (n // 16)) % 4] + 12
            add(bel, pluck(m, 0.16 if s16 % 4 else 0.22), t, lvl, 0.4 * np.sin(n * 0.9))
    if padv > 0:
        bt = base + np.ceil((t0 - base) / BAR - 1e-6) * BAR
        if bt > t0 + 0.01: add(mus, pad(chord_at(t0, prog, base)[2], bt - t0 + 0.4, 1400, padv, 0.3), t0)
        while bt < t1 - 0.05:
            d = min(BAR, t1 - bt); add(mus, pad(chord_at(bt + 0.01, prog, base)[2], d + 0.5, 1500 if not maj else 2400, padv, 0.4), bt); bt += BAR

# ── S01 · hook: cello vào thưa, drone, 5 đồng xu ──
add(mus, sub(30, at('S02') + 0.5, 0.28), 0)
add(mus, pad([42, 49, 54, 57], at('S02') + 0.6, 800, 0.16, 0.2), 0)
pulse(at('S01', 1), at('S02'), MIN, 0, 0.7, hats=False, drums=False)
for i, tl in enumerate([0.38, 1.55, 2.25, 2.8, 3.25]): add(fx, coin(0.6 if i == 0 else 0.45), clip('S01', tl), 1, 0.08 * (i - 2))
add(fx, whoosh(0.4, 0.3, False), 0.0)

# ── S02 · nỗi đau: pulse đầy, 3 log in kim ──
pulse(at('S02'), at('S03', 3.0) - B / 2, MIN, at('S02'), 1.0, padv=0.1, seed=2)
for n in (2.4, 5.2, 8.0):
    for k in range(9): add(fx, tick(0.18, 4500), at('S02', n) - 0.2 + k * 0.035, 1, 0.3)
    add(fx, thud(0.25), at('S02', n) + 0.35)
add(fx, riser(at('S03', 3.0) - at('S03', 0.4), 0.4), at('S03', 0.4))

# ── S03 · nứt → vỡ → nước chảy ──
add(fx, crack(at('S03', 3.0) - at('S03', 1.4), 0.5), at('S03', 1.4))
X = at('S03', 3.0)
add(fx, shatter(0.9), X); add(fx, boom(1.0), X); add(fx, whoosh(0.9, 0.3), X - 0.1)
add(mus, pad([42, 49, 56, 61, 64], at('S04') - X + 0.6, 2200, 0.2, 0.05), X)
for k, m in enumerate([73, 76, 80, 81, 85]): add(bel, fmbell(m, 1.8, 0.14), X + 0.6 + k * 0.12, 1, -0.4 + k * 0.2)
add(fx, water(at('S04') - at('S03', 4.0), 0.16, 3), at('S03', 4.0))
pulse(at('S03', 5.0), at('S04'), MIN, at('S03', 5.0), 0.55, drums=False, seed=3)

# ── S04–S07 · dòng tiền có cấu trúc: pulse + pad ──
pulse(at('S04'), at('S08') - B / 2, MIN, at('S04'), 1.0, padv=0.11, seed=4)
for i in range(4): add(fx, water(1.2, 0.1, 40 + i), at('S04', 1.4) + i * 0.3); add(fx, tick(0.15, 7000), at('S04', 1.4) + i * 0.3 + 0.95)
for i in range(4): add(fx, tick(0.15, 5000), at('S04', 1.4) + 1.4 + i * 0.3 + 0.8)
Q = 'vietnamesisch schliersee'
for k in range(len(Q)): add(fx, key(0.16), at('S05', 0.6) + k * 1.6 / len(Q), 1, 0.2)
add(fx, whoosh(0.5, 0.2), at('S05', 3.6)); add(fx, pop(0.3), at('S05', 5.6)); add(fx, water(1.2, 0.14, 50), at('S05', 5.8))
add(fx, squeak(0.7, 0.22), at('S06', 3.0)); add(fx, water(1.1, 0.12, 60), at('S06', 3.2))
add(fx, thud(0.6), at('S06', 3.0) + 1.75)
for i in range(7): add(fx, tick(0.12, 6000), at('S07', 1.4) + i * 0.42 + 0.12, 1, -0.3)
for i in (1, 3, 5): add(fx, thud(0.4), at('S07', 1.4) + i * 0.42 + 0.5)
for i in range(3): add(fx, whoosh(0.5, 0.14, False), at('S07', 6.0) + i * 0.2)
add(fx, riser(1.6, 0.3), at('S08') - 1.6)

# ── S08–S09 · giải toả: La trưởng ──
pulse(at('S08'), at('S10') - B / 2, MAJ, at('S08'), 1.0, plk=True, maj=True, padv=0.14, seed=8)
add(fx, boom(0.4), at('S08'))
for i in range(5): add(bel, fmbell([69, 73, 76, 81, 85][i], 1.4, 0.2), at('S08', 1.6) + i * 0.42 + 0.95, 1, -0.4 + i * 0.2)
p0, p1 = at('S09', 0.8), at('S09', 5.2); tt = p0
while tt < p1: add(fx, tick(0.12, 3800), tt, 1, 0.3); tt += 0.045
add(fx, whoosh(0.6, 0.15, False), p1)

# ── S10 · nhịp thở: im 1 s rồi pad La trưởng + xu ──
s10 = at('S10'); c0 = at('S10', 1.9)
add(fx, whoosh(0.6, 0.12, False), s10 - 0.3)
add(mus, pad([45, 52, 57, 61, 64], at('S11') - s10 + 0.4, 1800, 0.24, 1.0), s10 + 0.3)
add(fx, coin(0.4), c0); add(fx, water(1.4, 0.12, 70), c0 + 0.35)
add(bel, fmbell(81, 2.0, 0.24, 2.0, 1.2), c0 + 1.75); add(bel, fmbell(88, 2.0, 0.14, 2.0, 1.2), c0 + 1.8)
pulse(at('S10', 5), at('S11'), MAJ, at('S10', 5), 0.45, drums=False, hats=False, maj=True, plk=True, seed=10)

# ── S11 · CTA ──
pulse(at('S11'), at('S12'), MAJ, at('S11'), 0.95, plk=True, maj=True, padv=0.12, seed=11)
add(fx, water(at('S11', 3.2) - at('S11', 1.2), 0.12, 80), at('S11', 1.2))
add(fx, pop(0.55), at('S11', 3.2)); add(bel, fmbell(88, 0.9, 0.22), at('S11', 3.2) + 0.05)

# ── S12 · end card ──
e0 = clip('S12', 0.6)
add(fx, whoosh(0.6, 0.2), clip('S12', 0.0)); add(fx, subhit(1.0), e0)
add(mus, pad([45, 52, 57, 61, 64, 69], END - e0 + 0.4, 2600, 0.26, 0.05), e0)
add(mus, cello(33, END - e0 - 0.3, 0.35, 1.0), e0)
for k, m in enumerate([57, 64, 69, 73, 76]): add(bel, fmbell(m, 3.0, 0.18, 2.0, 1.0), e0 + k * 0.04)

# ── trộn ──
mix = reverb(mus, 1.6, 0.22) * 0.95 + reverb(bel, 2.2, 0.35) * 0.8 + drm * 0.75 + reverb(fx, 1.0, 0.18) * 1.0
mix = mix[:int(END * SR)]
fo = int(0.8 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
mix = np.tanh(mix / (np.max(np.abs(mix)) + 1e-9) * 1.5) * 0.9
import soundfile as sf
wav = os.path.join(PROJ, 'public', 'audio', 'music.wav'); sf.write(wav, mix, SR, subtype='PCM_16')
mp3 = os.path.join(PROJ, 'public', 'audio', 'music.mp3')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', '-b:a', '192k', mp3], check=True)
print('ok', round(END, 2), 's →', mp3)
