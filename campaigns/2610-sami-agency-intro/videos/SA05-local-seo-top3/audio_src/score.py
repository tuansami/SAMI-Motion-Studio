"""SA05 · nhạc + SFX tự tạo (numpy thuần, tất định).
Afro-house · 120 BPM (khớp lưới cắt Studio) · La thứ (Am – F – C – G) · marimba + shaker + conga + bass ấm.
Chạy:  python3 audio_src/score.py  → audio_src/mix.wav  (rồi ffmpeg loudnorm -14 LUFS → public/audio/music.mp3)
Mốc SFX lấy từ thời gian cảnh trong project.json (giây video = đầu cảnh + giây trong clip - 8/30).
"""
import numpy as np, wave, os, json

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
P = json.load(open(os.path.join(HERE, '..', 'project.json'), encoding='utf-8'))
SC = {s['id']: s['start'] / 30 for s in P['scenes']}
DUR = P['scenes'][-1]['end'] / 30
N = int(SR * DUR)
BEAT = 0.5; S16 = 0.125
rng = np.random.default_rng(505)
L = np.zeros(N); R = np.zeros(N)
OFF = 8 / 30
def cue(scene, clip_t): return SC[scene] + clip_t - OFF

def at(t): return int(round(t * SR))
def add(sig, t, gain=1.0, pan=0.0):
    i = at(t)
    if i >= N or i < 0: return
    s = sig[: N - i] * gain
    L[i:i + len(s)] += s * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(s)] += s * np.sqrt(0.5 * (1 + pan))
def tt(d): return np.arange(int(d * SR)) / SR
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def lp(x, k): return np.convolve(x, np.ones(k) / k, mode='same')

# ── nhạc cụ
def kick():
    t = tt(0.45); f = 48 + 110 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(1.6 * np.sin(ph) * np.exp(-t * 7)) * 0.9
def shaker(acc=1.0):
    t = tt(0.09); n = rng.standard_normal(len(t)); n = n - lp(n, 6)
    env = np.minimum(1, t / 0.012) * np.exp(-t * 55)
    return n * env * 0.10 * acc
def clap():
    t = tt(0.28); n = rng.standard_normal(len(t)); n = n - lp(n, 3)
    env = np.exp(-t * 20) * (1 + 0.7 * ((t < 0.012) | ((t > 0.02) & (t < 0.03))))
    return n * env * 0.18
def conga(m, d=0.25, slap=False):
    t = tt(d); f = hz(m) * (1 + 0.25 * np.exp(-t * 60))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (14 if not slap else 26))
    if slap: s += lp(rng.standard_normal(len(t)), 2) * np.exp(-t * 80) * 0.4
    return s * 0.35
def marimba(m, d=0.7, g=1.0):
    t = tt(d); f = hz(m)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t * 7) + 0.35 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t * 22) + 0.12 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t * 50)
    return s * np.minimum(1, t / 0.002) * 0.28 * g
def bass(m, d):
    t = tt(d); f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.08 * np.sin(6 * np.pi * f * t)
    env = np.minimum(1, t / 0.008) * np.minimum(1, np.maximum(0, (d - t) / 0.03)) * np.exp(-t * 1.8)
    return np.tanh(1.3 * s) * env * 0.42
def pad(ms, d):
    t = tt(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-0.07, 0.0, 0.07):
            f = hz(m + det)
            for k in (1, 2, 3):
                s += np.sin(2 * np.pi * f * k * t + k * 0.7) / (k * k)
    env = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.6)
    return lp(s, 4) * env * 0.022

# ── SFX (đồ chơi, có cao độ)
def blip(f=2600, d=0.05, g=0.25):
    t = tt(d); return np.sin(2 * np.pi * f * t) * np.exp(-t * 90) * g
def key():
    t = tt(0.035); n = rng.standard_normal(len(t)); return np.diff(n, prepend=0) * np.exp(-t * 170) * 0.22 + blip(3400, 0.035, 0.05)
def pip(m, g=0.3):
    t = tt(0.16); return (np.sign(np.sin(2 * np.pi * hz(m) * t)) * 0.4 + np.sin(2 * np.pi * hz(m) * t)) * np.exp(-t * 26) * g
def pop(g=0.4):
    t = tt(0.12); f = 500 + 1100 * np.exp(-t * 45)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * g
def thud(g=0.6):
    t = tt(0.35); f = 70 + 120 * np.exp(-t * 35)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) + lp(rng.standard_normal(len(t)), 6) * np.exp(-t * 40) * 0.5) * g
def whoosh(d=0.6, g=0.2):
    t = tt(d); n = lp(rng.standard_normal(len(t)), 10)
    return n * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2 * 1.6 * g
def riser(d, g=0.3):
    t = tt(d); f = 300 + 1500 * (t / d) ** 2
    n = lp(rng.standard_normal(len(t)), 8)
    return (0.4 * n + 0.25 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * (t / d) ** 2 * g
def zap(g=0.35):  # "TĂNG TỐC!" vút lên
    t = tt(0.4); f = 400 + 2400 * (t / 0.4) ** 1.5
    return np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-t * 6) * 0.25 * g + whoosh(0.4, g * 0.6)
def buzzer(g=0.3):
    t = tt(0.55); s = np.sign(np.sin(2 * np.pi * 110 * t)) + 0.6 * np.sign(np.sin(2 * np.pi * 116 * t))
    return lp(s, 5) * np.minimum(1, (0.55 - t) / 0.05) * g * 0.35
def ding(m=88, g=0.4):
    t = tt(1.6); f = hz(m)
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3) + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 6)) * np.exp(-t * 2.5) * g * 0.4
def bell(g=0.6):  # chuông hạng 1: nhiều phần âm lệch, ngân dài
    t = tt(3.0); s = np.zeros(len(t))
    for r, a, dc in [(1, 1, 1.2), (2.0, .6, 1.8), (2.76, .5, 2.4), (5.4, .3, 4), (8.9, .15, 6)]:
        for f0 in (hz(84), hz(91)):
            s += a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t * dc)
    return s * np.minimum(1, t / 0.002) * g * 0.18
def crash(g=0.3):
    t = tt(2.0); n = rng.standard_normal(len(t)); n = n - lp(n, 3)
    return n * np.exp(-t * 2.2) * g * 0.3
def stamp(g=0.9):
    a, b = thud(g), clap() * 1.2
    out = np.zeros(max(len(a), len(b))); out[:len(a)] += a; out[:len(b)] += b
    return out
def impact(g=1.0):
    t = tt(1.8); f = 38 + 60 * np.exp(-t * 8)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    return (s + lp(rng.standard_normal(len(t)), 8) * np.exp(-t * 12) * 0.5) * g
def flip(g=0.2):
    t = tt(0.07); n = rng.standard_normal(len(t)); return (n - lp(n, 4)) * np.exp(-t * 60) * g

# ── hoà âm: Am – F – C – G (mỗi hợp âm 1 ô nhịp = 2 s)
CH = [[57, 60, 64], [53, 57, 60], [55, 60, 64], [55, 59, 62]]
ROOT = [33, 29, 36, 31]
# riff marimba 16 nốt / ô nhịp (None = nghỉ), lệch kiểu afro
RIFF = [[69, None, 72, None, 76, None, 72, 74, None, 72, None, 69, None, 67, 69, None],
        [65, None, 69, None, 72, None, 69, 72, None, 74, None, 72, None, 69, 65, None],
        [67, None, 72, None, 76, None, 72, 79, None, 76, None, 72, None, 74, 72, None],
        [67, None, 71, None, 74, None, 71, 74, None, 79, None, 74, None, 71, 74, None]]
BASSP = [(0.0, 0, .35), (0.75, 0, .2), (1.0, 12, .2), (1.5, 0, .3), (1.75, 7, .2)]  # (giây trong ô, quãng, độ dài)
CONGA = [(0.25, 62, 0), (0.5, 57, 0), (0.875, 62, 1), (1.25, 57, 0), (1.5, 62, 0), (1.625, 64, 1)]

def groove(t0, t1, kick_on=True, clap_on=True, shake=1.0, conga_on=True, bass_on=True, mar=0.0, mar_oct=0):
    t = t0
    while t < t1 - 1e-6:
        bar = int((t + 1e-6) // 2) % 4; inb = (t + 1e-6) % 2
        b16 = int(round(inb / S16)) % 16
        if kick_on and b16 % 4 == 0: add(kick(), t, 0.85)
        if clap_on and b16 in (4, 12): add(clap(), t, 0.8, 0.1)
        if shake > 0: add(shaker(1.0 if b16 % 4 == 2 else 0.55), t, shake, 0.35 if b16 % 2 else -0.2)
        if conga_on:
            for x, m, sl in CONGA:
                if abs(inb - x) < 1e-3: add(conga(m, slap=bool(sl)), t, 0.8, -0.4 if m < 60 else 0.3)
        if bass_on:
            for x, iv, d in BASSP:
                if abs(inb - x) < 1e-3: add(bass(ROOT[bar] + iv, d), t, 1.0)
        if mar > 0:
            n = RIFF[bar][b16]
            if n is not None: add(marimba(n + mar_oct, 0.6), t, mar, 0.25 if b16 % 3 else -0.25)
        t += S16

def pads(t0, t1, g=1.0):
    t = t0 - (t0 % 2)
    while t < t1 - 0.01:
        bar = int((t + 1e-6) // 2) % 4
        d = min(2.0, t1 - max(t, t0)) + 0.5
        add(pad(CH[bar], d), max(t, t0), g)
        t += 2.0

def q(x): return round(x / S16) * S16  # khớp lưới 16 nốt

E = DUR
s = SC
# ── bố cục
pads(0, s['S04'], 0.8)
groove(0.0, s['S03'], kick_on=False, clap_on=False, shake=0.8, conga_on=True, bass_on=False, mar=0.7)
groove(q(s['S03']), q(s['S04']), kick_on=True, clap_on=False, shake=1.0, conga_on=True, bass_on=True, mar=0.75)
pads(s['S04'], s['S05'], 1.1)
groove(q(s['S04']), q(s['S05']) - 1.0, kick_on=False, clap_on=False, shake=0.6, conga_on=True, bass_on=True, mar=0.5)
add(riser(1.0, 0.35), q(s['S05']) - 1.0)
pads(s['S05'], s['S08'], 0.7)
groove(q(s['S05']), q(cue('S05', 28.95)), kick_on=True, clap_on=True, shake=1.0, conga_on=True, bass_on=True, mar=0.85)
groove(q(cue('S05', 28.95)), q(s['S07']), kick_on=True, clap_on=True, shake=1.1, conga_on=True, bass_on=True, mar=0.95, mar_oct=12)
groove(q(s['S07']), q(s['S08']), kick_on=True, clap_on=False, shake=0.9, conga_on=True, bass_on=True, mar=0.75)
pads(s['S08'], E, 1.0)
groove(q(s['S08'] + 1.5), q(s['S09']), kick_on=False, clap_on=False, shake=0.0, conga_on=False, bass_on=False, mar=0.6)
groove(q(s['S09']), E, kick_on=True, clap_on=False, shake=0.7, conga_on=True, bass_on=True, mar=0.6)
add(pad([57, 64, 69, 72], 5.0), E - 4.6, 1.6)

# ── SFX khớp hình
add(thud(0.5), cue('S01', 0.5))
q01 = P['copy']['S01_query']['value']
for i in range(len(q01)):
    if q01[i] != ' ': add(key(), cue('S01', 0.75 + i * 1.6 / len(q01)), 0.8, (i % 3 - 1) * 0.2)
add(key(), cue('S01', 2.55), 1.6); add(blip(1800, 0.08, 0.3), cue('S01', 2.55))
for i in range(10): add(pip(72 + [0, 2, 4, 7, 9, 12, 9, 7, 4, 2][i], 0.18), cue('S01', 2.85 + i * 0.25), 1, (i - 4.5) / 9)
add(stamp(0.8), cue('S02', 1.45)); add(buzzer(0.12), cue('S02', 1.5))
add(pop(), cue('S02', 1.75), 0.8); add(pop(), cue('S02', 2.6), 0.8, 0.3)
add(thud(0.7), cue('S03', 0.55)); add(whoosh(0.7, 0.3), cue('S03', 2.25), 1, -0.2)
add(thud(0.5), cue('S04', 0.8), 1, -0.3); add(thud(0.5), cue('S04', 1.05), 1, 0.3)
add(buzzer(0.35), cue('S04', 2.75), 1, -0.3); add(ding(88, 0.6), cue('S04', 3.55), 1, 0.3)
add(pop(0.5), cue('S05', 0.35))
T = [3.2 + 4.8 * k for k in range(6)]
for k, x in enumerate(T):
    add(pop(0.45), cue('S05', x))
    add(riser(1.0, 0.22), cue('S05', x + 0.3))
    add(blip(1200 + 200 * k, 0.08, 0.25), cue('S05', x + 1.3))
    add(zap(0.5), cue('S05', x + 1.35))
    add(impact(0.35), cue('S05', x + 1.4))
    for j in range(3): add(pip(79 + 2 * j + k, 0.12), cue('S05', x + 1.7 + j * 0.25), 1, 0.3)
    add(whoosh(0.35, 0.12), cue('S05', x + 4.45))
TW = T[5] + 1.75
add(bell(0.9), cue('S05', TW)); add(crash(0.5), cue('S05', TW)); add(impact(0.6), cue('S05', TW))
for j in range(10): add(pop(0.15), cue('S05', TW + 0.2 + j * 0.13), 1, ((j * 7) % 5 - 2) / 3)
for j, x in enumerate([0.35, 0.55, 0.75]): add(thud(0.45), cue('S06', x), 1, (j - 1) * 0.4)
for k in range(7): add(flip(0.35), cue('S06', 1.7 + k * 0.62), 1, 0.3)
add(ding(93, 0.3), cue('S06', 1.25))
add(thud(0.5), cue('S07', 1.4)); add(stamp(1.1), cue('S07', 2.3)); add(impact(0.5), cue('S07', 2.3))
add(pop(0.4), cue('S07', 4.3), 1, -0.3); add(pop(0.4), cue('S07', 4.6), 1, 0.3)
add(ding(81, 0.35), cue('S08', 0.3))
add(pop(0.7), cue('S09', 0.45)); add(impact(0.8), cue('S09', 1.7)); add(ding(93, 0.25), cue('S09', 1.75))

# ── reverb nhẹ + bus + master
ir_t = tt(1.3); ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 4.5); ir /= np.sqrt((ir ** 2).sum())
def conv(x, h):
    n = len(x) + len(h); F = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, F) * np.fft.rfft(h, F), F)[: len(x)]
Lw = L + 0.18 * conv(L, ir); Rw = R + 0.18 * conv(R, np.roll(ir, 37))
fade = np.ones(N); fade[-at(1.8):] = np.linspace(1, 0, at(1.8)); fade[: at(0.03)] = np.linspace(0, 1, at(0.03))
mix = np.stack([Lw, Rw], 1) * fade[:, None]
mix = np.tanh(mix / (np.abs(mix).max() * 0.55)) * 0.88
out = os.path.join(HERE, 'mix.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok', out, round(DUR, 2), 's')
