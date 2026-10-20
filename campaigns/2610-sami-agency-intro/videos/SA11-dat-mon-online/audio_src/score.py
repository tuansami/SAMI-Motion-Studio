"""SA11 · nhạc + SFX tự tạo (numpy thuần, tất định).
Bouncy funk · 112 BPM (1 nhịp 0,5357 s, 1 ô nhịp 2,1429 s; cắt cảnh ở đầu ô nhịp = round(ô × 450/7) khung) · Rê trưởng
Hoà âm: Dmaj9 – G6/9 – Em9 – A13 (mỗi hợp âm 1 ô). Clavinet tổng hợp (xung lọc + gảy), horn stab (saw lệch tông, lọc theo đường bao), bass funk, trống 16 nốt có swing.
Đoạn: S01–S03 (ô 0–9) groove mỏng, bị lọc + tiếng giọt rỉ · S04 (ô 10–11) kéo căng, cắt ống, dừng 1 nhịp, hàn · ô 12–34 full groove + horn · S11 (ô 35–37) thở: clav + pad · S12 (ô 38–41) groove nhẹ + nốt kết.
Chạy:  python3 audio_src/score.py  → audio_src/mix.wav  (rồi ffmpeg loudnorm -14 LUFS → public/audio/music.mp3)
Mốc SFX lấy từ thời gian cảnh trong project.json (giây video = đầu cảnh + giây trong clip − 8/30).
"""
import numpy as np, wave, os, json

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
P = json.load(open(os.path.join(HERE, '..', 'project.json'), encoding='utf-8'))
SC = {s['id']: s['start'] / 30 for s in P['scenes']}
DUR = P['scenes'][-1]['end'] / 30 + 0.8
N = int(SR * DUR)
BEAT = 60 / 112; BAR = 4 * BEAT; S16 = BEAT / 4; SW = 0.17 * S16   # swing nốt 16 lẻ
rng = np.random.default_rng(1111)
L = np.zeros(N); R = np.zeros(N)
OFF = 8 / 30
def cue(scene, clip_t): return SC[scene] + clip_t - OFF

def at(t): return int(round(t * SR))
def add(sig, t, gain=1.0, pan=0.0):
    i = at(t)
    if i >= N: return
    if i < 0: sig = sig[-i:]; i = 0
    s = sig[: N - i] * gain
    L[i:i + len(s)] += s * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(s)] += s * np.sqrt(0.5 * (1 + pan))
def tt(d): return np.arange(int(d * SR)) / SR
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def lp(x, k): return np.convolve(x, np.ones(k) / k, mode='same') if k > 1 else x
# ── nhạc cụ
def saw(f, t, fc, det=0.0):
    s = np.zeros(len(t)); k = 1
    while k * f < min(fc * 3, 15000):
        s += np.sin(2 * np.pi * k * f * (1 + det) * t) / k / (1 + (k * f / fc) ** 4); k += 1
    return s
def pulse(f, t, fc, w=0.25):
    s = np.zeros(len(t)); k = 1
    while k * f < min(fc * 3, 15000):
        s += np.sin(np.pi * k * w) * np.cos(2 * np.pi * k * f * t) / k / (1 + (k * f / fc) ** 4); k += 1
    return s
def clav(ms, d=0.16, bright=1.0, g=1.0):
    """clavinet: xung hẹp, gảy sáng rồi tắt nhanh; 'bright' < 1 = bị lọc (phần nỗi đau)"""
    t = tt(d + 0.05); s = np.zeros(len(t))
    for m in ms:
        f = hz(m); fc = 900 + 3800 * bright
        s += pulse(f, t, fc, 0.18) + 0.25 * pulse(f * 2, t, fc * 0.8, 0.3)
    env = np.minimum(1, t / 0.002) * np.exp(-t * 16) * np.minimum(1, np.maximum(0, (d - t) / 0.02) + 0.0)
    return np.tanh(1.4 * s * env) * 0.11 * g
def horn(ms, d=0.32, g=1.0, fall=False):
    t = tt(d + 0.1); s = np.zeros(len(t))
    for m in ms:
        f = hz(m) * (1 - (0.06 * np.maximum(0, t - d * 0.55) / d if fall else 0))
        ph = 2 * np.pi * np.cumsum(f * np.ones(len(t))) / SR
        for det in (-0.006, 0.0, 0.007):
            k = 1
            while k * hz(m) < 9000:
                s += np.sin(k * ph * (1 + det)) / k / (1 + (k * hz(m) / (1200 + 2600 * np.exp(-t * 9))) ** 2); k += 1
    env = np.minimum(1, t / 0.012) * np.minimum(1, np.maximum(0, (d - t) / 0.06))
    return np.tanh(0.9 * s * env / len(ms)) * 0.20 * g
def bass(m, d, g=1.0, pop=False):
    t = tt(d); f = hz(m)
    s = saw(f, t, 650 if pop else 320) * 0.7 + np.sin(2 * np.pi * f * t)
    env = np.minimum(1, t / 0.004) * np.minimum(1, np.maximum(0, (d - t) / 0.015)) * np.exp(-t * 3.5)
    return np.tanh(1.6 * s) * env * 0.30 * g
def pad(ms, d, fc=1200, g=1.0):
    t = tt(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-0.005, 0.0, 0.005): s += saw(hz(m), t, fc, det)
    env = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.6)
    return s * env * 0.016 * g
def kick(g=1.0):
    t = tt(0.38); f = 48 + 110 * np.exp(-t * 34)
    return np.tanh(1.7 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8)) * 0.8 * g
def snare(g=1.0):
    t = tt(0.24); n = rng.standard_normal(len(t)); n = n - lp(n, 3)
    body = np.sin(2 * np.pi * 200 * t) * np.exp(-t * 28) * 0.5
    return (body + n * np.exp(-t * 20) * 0.55) * 0.32 * g
def hat(open_=False, g=1.0):
    t = tt(0.2 if open_ else 0.04); n = rng.standard_normal(len(t)); n = n - lp(n, 2)
    return n * np.exp(-t * (16 if open_ else 90)) * 0.06 * g
def clap(g=1.0):
    t = tt(0.2); n = rng.standard_normal(len(t)); n = n - lp(n, 5); e = np.zeros(len(t))
    for o in (0, 0.009, 0.019): e += np.exp(-np.maximum(0, t - o) * 60) * (t >= o)
    return n * e * 0.12 * g

# ── SFX
def blip(f=2200, d=0.06, g=0.22):
    t = tt(d); return np.sin(2 * np.pi * f * t) * np.exp(-t * 70) * g
def tick(g=0.25):
    t = tt(0.03); n = rng.standard_normal(len(t)); return np.diff(n, prepend=0) * np.exp(-t * 220) * g + blip(4200, 0.03, 0.05)
def ding(f=1568, g=0.25, d=1.2):
    t = tt(d); s = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (3 + 2 * k)) / k for k in (1, 2.76, 5.4))
    return s * np.minimum(1, t / 0.002) * g
def plink(f=2600, g=0.12):
    t = tt(0.18); f2 = f * (1 + 0.6 * np.exp(-t * 40))
    return np.sin(2 * np.pi * np.cumsum(f2) / SR) * np.exp(-t * 26) * g
def pop(g=0.4):
    t = tt(0.12); f = 500 + 1100 * np.exp(-t * 45)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * g
def thud(g=0.5):
    t = tt(0.4); f = 60 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11) * g
def whoosh(d=0.7, g=0.25):
    t = tt(d); n = rng.standard_normal(len(t)); env = np.sin(np.pi * t / d) ** 2
    return (lp(n, 4) * 0.5 + lp(n, 12) * 0.8) * env * g
def slurp(d=0.5, g=0.25):
    t = tt(d); f = 900 * np.exp(-t * 3) + 120
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 28 * t))
    return lp(s + 0.3 * rng.standard_normal(len(t)), 6) * np.sin(np.pi * t / d) * g
def snip(g=0.35):
    t = tt(0.09); n = rng.standard_normal(len(t)); n = n - lp(n, 2)
    return (n * np.exp(-t * 90) + np.sin(2 * np.pi * 3400 * t) * np.exp(-t * 60) * 0.5) * g
def clank(g=0.4, f0=523):
    t = tt(0.5); s = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * dk) for f, dk in ((f0, 9), (f0 * 2.51, 14), (f0 * 4.1, 22)))
    th = np.zeros(len(t)); h = thud(0.4 * g); th[:min(len(h), len(t))] = h[:len(t)]
    return s * 0.2 * g + th
def sizzle(d=1.2, g=0.16):
    t = tt(d); n = rng.standard_normal(len(t)); n = n - lp(n, 3)
    crack = (rng.random(len(t)) > 0.9985) * rng.standard_normal(len(t)) * 6
    return (n * (0.5 + 0.5 * np.sin(2 * np.pi * 13 * t) ** 2) + lp(crack, 2)) * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.15) * g
def printer(d=1.0, g=0.12):
    t = tt(d); s = np.sign(np.sin(2 * np.pi * 95 * t)) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 7 * t)))
    return lp(s + 0.3 * rng.standard_normal(len(t)), 5) * np.minimum(1, t / 0.03) * np.minimum(1, (d - t) / 0.05) * g
def riser(d=1.0, g=0.18):
    t = tt(d); n = rng.standard_normal(len(t)); n = n - lp(n, 8)
    return (n * 0.6 + np.sin(2 * np.pi * np.cumsum(300 + 1500 * (t / d) ** 2) / SR) * 0.3) * (t / d) ** 2 * g
def subhit(g=0.8):
    t = tt(1.8); f = 38 + 50 * np.exp(-t * 8)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6) * g
def shimmer(d=1.6, g=0.12):
    t = tt(d); s = sum(np.sin(2 * np.pi * hz(m) * t) for m in (78, 81, 85, 90))
    return s * np.minimum(1, t / 0.3) * np.exp(-t * 1.6) * g
def kaching(g=0.25):
    o = np.zeros(int(0.9 * SR)); a = ding(2093, 1.0, 0.8); b = ding(2637, 1.0, 0.8)
    o[:len(a)] += a; j = int(0.08 * SR); o[j:j + len(b)] += b[:len(o) - j]
    return o * g

# ── hoà âm (Rê trưởng): Dmaj9 – G6/9 – Em9 – A13
CL = [[66, 69, 73, 76], [67, 71, 74, 76], [67, 71, 74, 78], [67, 71, 73, 78]]     # clav voicing (F#4 A4 C#5 E5 …)
HN = [[78, 81, 85], [79, 83, 86], [79, 83, 86], [79, 83, 85]]                      # horn stab
PD = [[62, 66, 69, 73], [55, 62, 67, 71], [52, 59, 62, 66], [57, 61, 67, 71]]
BS = [38, 43, 40, 45]                                                               # D2 G2 E2 A2
CLAV_PAT = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0]
GHOST = [0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1]
BASS_PAT = [(0, 0, 3), (3, 0, 1), (6, 12, 1), (8, 0, 2), (10, 7, 1), (11, 9, 1), (14, 12, 2)]  # (bước 16, quãng, độ dài 16)
NB = int(np.ceil(DUR / BAR))
def sec(b):
    if b <= 9: return 'thin'
    if b <= 11: return 'cut'
    if b <= 34: return 'full'
    if b <= 37: return 'breath'
    return 'end'
def st(b, k): return b * BAR + k * S16 + (SW if k % 2 else 0)

for b in range(NB):
    s = sec(b); c = b % 4; last = b >= 41
    if last and b > 41: break
    br = {'thin': 0.15 + 0.03 * b, 'cut': 0.5, 'full': 1.0, 'breath': 0.45, 'end': 0.85}[s]
    # pad
    if s in ('thin', 'breath', 'end', 'full'):
        add(pad(PD[c], BAR + 0.5, 700 if s == 'thin' else 1400, 1.2 if s == 'breath' else (0.6 if s == 'full' else 0.9)), b * BAR - 0.1)
    if last:
        add(pad(PD[0], 3.0, 1400, 1.2), b * BAR); add(clav(CL[0], 0.5, 1.0, 1.3), b * BAR); add(horn(HN[0], 0.9, 1.1), b * BAR)
        add(bass(BS[0], 1.2), b * BAR); add(kick(), b * BAR); add(clap(0.8), b * BAR)
        break
    # clav
    for k in range(16):
        if s == 'cut' and b == 11 and k >= 4: break      # dừng khi ống bị cắt
        if CLAV_PAT[k]: add(clav(CL[c], 0.15, br, 1.0 if s != 'thin' else 0.8), st(b, k), 1.0, 0.25)
        elif GHOST[k] and s in ('full', 'end'): add(clav([CL[c][0]], 0.05, br, 0.35), st(b, k), 1.0, 0.25)
    if s == 'cut' and b == 11: continue
    # bass
    if s in ('thin', 'full', 'end', 'cut'):
        for (k, iv, ln) in BASS_PAT:
            if s == 'thin' and k not in (0, 8, 10): continue
            add(bass(BS[c] + iv, ln * S16 * 0.9, 0.85 if s == 'thin' else 1.0, iv == 12), st(b, k))
    # trống
    if s in ('full', 'end'):
        for k in (0, 6, 8, 11): add(kick(), st(b, k), 0.9 if k else 1.0)
        for k in (4, 12): add(snare(), st(b, k)); add(clap(0.6), st(b, k))
        for k in range(16): add(hat(k == 14, 1.0 if k % 2 == 0 else 0.55), st(b, k), 1.0, 0.3 if k % 2 else -0.2)
    elif s == 'thin':
        for k in (0, 8): add(kick(0.6), st(b, k))
        for k in range(0, 16, 2): add(hat(False, 0.5), st(b, k), 1.0, 0.3)
        if b >= 6: add(snare(0.5), st(b, 12))
    elif s == 'cut':
        for k in range(16): add(snare(0.15 + 0.04 * k), st(b, k))   # trống dồn kéo căng
    elif s == 'breath':
        for k in range(0, 16, 4): add(hat(False, 0.4), st(b, k), 1.0, 0.3)
    # horn stab
    if s == 'full' and (b % 2 == 0 or b == 12):
        add(horn(HN[c], 0.22, 1.0), st(b, 0)); add(horn(HN[c], 0.18, 0.8), st(b, 3))
        if b % 8 == 6: add(horn(HN[c], 0.5, 0.9, fall=True), st(b, 10))
    if s == 'end': add(horn(HN[c], 0.22, 0.8), st(b, 0))

# ── SFX khớp hình
# S01
add(ding(1568, 0.22), cue('S01', 0.3)); add(ding(2093, 0.15), cue('S01', 0.42))
add(pop(0.35), cue('S01', 0.75)); add(thud(0.4), cue('S01', 1.25)); add(slurp(0.5, 0.3), cue('S01', 1.35))
add(whoosh(1.2, 0.18), cue('S01', 1.3))
# S01–S03: giọt rỉ
for i in range(46):
    tq = cue('S01', 2.0) + i * 0.41 + (i * 0.137 % 0.2)
    if tq < cue('S04', 0.3): add(plink(2200 + 500 * ((i * 7) % 5), 0.10), tq, 1.0, 0.5 * np.sin(i))
add(whoosh(0.6, 0.18), cue('S02', 0.1))
add(whoosh(0.6, 0.18), cue('S03', 0.1)); add(whoosh(0.8, 0.14), cue('S03', 2.4)); add(tick(0.35), cue('S03', 3.3)); add(blip(900, 0.08, 0.15), cue('S03', 3.32))
# S04 chữ ký
for k in range(3): add(snip(0.35), cue('S04', 0.45 + k * 0.33), 1.0, -0.3 + 0.3 * k)
for k in range(9): add(clank(0.35, 380 + 70 * (k % 4)), cue('S04', 1.4 + k * 0.08), 1.0, np.sin(k))
add(whoosh(1.0, 0.25), cue('S04', 1.35))
add(sizzle(1.3, 0.14), cue('S04', 2.2)); add(riser(1.2, 0.10), cue('S04', 2.2))
for k in range(16): add(plink(1800 + 90 * k, 0.09), cue('S04', 3.4 + k * 0.09 + 0.8), 1.0, 0.3 * np.sin(k))
add(kaching(0.25), cue('S04', 4.7))
# S05
q = 'Pho bestellen Hannover'
for k in range(len(q)): add(tick(0.12), cue('S05', 0.45 + k * 1.05 / len(q)), 1.0, 0.2)
add(pop(0.3), cue('S05', 2.1)); add(whoosh(0.5, 0.12), cue('S05', 2.3)); add(tick(0.35), cue('S05', 4.0)); add(blip(1700, 0.08, 0.15), cue('S05', 4.0)); add(whoosh(0.8, 0.2), cue('S05', 5.4))
# S06
for k in range(18): add(tick(0.10), cue('S06', 0.25 + k * 0.1), 1.0, -0.3)
add(shimmer(1.4, 0.10), cue('S06', 1.9))
for ts in (3.0, 3.55, 4.1): add(pop(0.28), cue('S06', ts)); add(blip(2600, 0.05, 0.10), cue('S06', ts + 0.45))
add(whoosh(0.5, 0.12), cue('S06', 4.7)); add(tick(0.35), cue('S06', 6.1)); add(kaching(0.22), cue('S06', 6.45))
# S07
add(whoosh(0.5, 0.12), cue('S07', 0.1)); add(thud(0.3), cue('S07', 1.5)); add(printer(1.0, 0.10), cue('S07', 1.7)); add(ding(2349, 0.25, 1.5), cue('S07', 2.9))
# S08
add(whoosh(0.5, 0.12), cue('S08', 0.1)); add(pop(0.3), cue('S08', 2.0)); add(pop(0.35), cue('S08', 2.3)); add(shimmer(1.2, 0.08), cue('S08', 2.35))
for ts in (3.4, 4.3, 5.0, 5.6, 6.1, 6.5): add(blip(1900 + 200 * ((ts * 10) % 5), 0.06, 0.12), cue('S08', ts))
# S09
for k, ts in enumerate((1.4, 2.1, 2.8)): add(thud(0.4), cue('S09', ts + 0.25)); add(pop(0.25), cue('S09', ts + 0.55))
add(whoosh(0.5, 0.12), cue('S09', 0.1))
# S10
add(whoosh(0.7, 0.18), cue('S10', 0.2)); add(thud(0.3), cue('S10', 1.0)); add(thud(0.3), cue('S10', 1.3))
# S11
add(shimmer(2.0, 0.08), cue('S11', 1.4))
# S12
add(thud(0.4), cue('S12', 0.45)); add(whoosh(0.8, 0.2), cue('S12', 0.6)); add(pop(0.45), cue('S12', 0.95)); add(subhit(0.8), cue('S12', 2.3))

# ── master
mix = np.stack([L, R], 1)
fade = np.ones(N); fl = int(1.6 * SR); fade[-fl:] = np.linspace(1, 0, fl)
mix *= fade[:, None]
mix = np.tanh(mix * 1.3) / 1.3
mix /= np.max(np.abs(mix)) + 1e-9
mix *= 0.89
with wave.open(os.path.join(HERE, 'mix.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print('ok', round(DUR, 2), 's')
