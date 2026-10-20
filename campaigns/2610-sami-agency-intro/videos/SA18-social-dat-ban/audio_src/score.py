"""SA18 · nhạc + SFX tự tạo (numpy thuần, tất định).
Trap-pop half-time 140 BPM (cảm giác 70) · Sol thứ · 808 trượt + pluck sáng + hi-hat cuộn.
S01–S05 mỏng (pluck lọc, 808 thưa, không kick) → riser → DROP ở lúc feed bắt đầu uốn thành phễu (S06)
→ beat đầy tới S11 → S12 tắt beat (nhịp thở) → S13 pluck + sub-hit logo.
Chạy:  python audio_src/score.py  → audio_src/mix.wav  (rồi ffmpeg loudnorm -14 LUFS → public/audio/music.mp3)
Mốc SFX: giây video = đầu cảnh + giây trong clip - 8/30.
"""
import numpy as np, wave, os

SR = 44100
DUR = 89.7
N = int(SR * DUR)
BPM = 140.0
B = 60.0 / BPM            # 1 phách
rng = np.random.default_rng(1810)
L = np.zeros(N); R = np.zeros(N)

def at(t): return int(round(t * SR))
def add(sig, t, gain=1.0, pan=0.0):
    i = at(t)
    if i >= N or i + len(sig) <= 0: return
    if i < 0: sig = sig[-i:]; i = 0
    s = sig[: N - i] * gain
    L[i:i + len(s)] += s * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(s)] += s * np.sqrt(0.5 * (1 + pan))
def tt(d): return np.arange(int(d * SR)) / SR
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def lp(x, a):  # low-pass 1 cực
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += a * (x[i] - acc); y[i] = acc
    return y

CUT = [0, 171, 366, 561, 801, 996, 1206, 1446, 1686, 1896, 2121, 2376, 2511, 2691]
SC = {f'S{i + 1:02d}': CUT[i] / 30 for i in range(13)}
END = {f'S{i + 1:02d}': CUT[i + 1] / 30 for i in range(13)}
OFF = 8 / 30
def cue(s, ct): return SC[s] + ct - OFF

# ── nhạc cụ
def kick():
    t = tt(0.5); f = 48 + 120 * np.exp(-t * 32); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(1.6 * np.sin(ph) * np.exp(-t * 6)) * 0.9
def clap():
    t = tt(0.32); n = rng.standard_normal(len(t)); n = np.diff(n, prepend=0)
    env = np.zeros(len(t))
    for d in (0, 0.011, 0.022): env += np.exp(-np.maximum(0, t - d) * 60) * (t >= d)
    env += 0.5 * np.exp(-t * 14)
    return n * env * 0.16
def snare():
    t = tt(0.25); n = rng.standard_normal(len(t))
    return (n * np.exp(-t * 26) * 0.35 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.4) * 0.5
def hat(d=0.05, g=1.0):
    t = tt(d); n = rng.standard_normal(len(t)); n = np.diff(np.diff(n, prepend=0), prepend=0)
    return n * np.exp(-t * 90) * 0.08 * g
def b808(m, d, glide_from=None):
    t = tt(d); f0 = hz(m)
    f = f0 if glide_from is None else hz(glide_from) + (f0 - hz(glide_from)) * (1 - np.exp(-t * 22))
    ph = 2 * np.pi * np.cumsum(np.ones(len(t)) * f) / SR
    env = np.minimum(1, t / 0.005) * np.exp(-t * 1.1) * np.minimum(1, (d - t) / 0.03)
    return np.tanh(2.2 * np.sin(ph)) * env * 0.55
def pluck(m, d=0.5, bright=1.0):
    t = tt(d); f = hz(m); s = np.zeros(len(t))
    for k in range(1, 8):
        s += np.sin(2 * np.pi * f * k * t + k * 0.3) / k * np.exp(-t * (7 + 10 * k / bright))
    return s * np.minimum(1, t / 0.002) * 0.3
def pad(ms, d, g=1.0):
    t = tt(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-0.1, 0.0, 0.1):
            f = hz(m + det)
            for k in (1, 2, 3): s += np.sin(2 * np.pi * f * k * t + k * m) / (k * k)
    env = np.minimum(1, t / 0.9) * np.minimum(1, (d - t) / 0.9)
    return s * env * 0.022 * g
def bell(m, d=1.2):
    t = tt(d); f = hz(m)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)) * np.exp(-t * 3.5) * 0.25

# ── SFX
def tick(): t = tt(0.025); return np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 300) * 0.25
def pop(f=900):
    t = tt(0.14); fr = f * (1 + 1.4 * np.exp(-t * 40)); ph = 2 * np.pi * np.cumsum(fr) / SR
    return np.sin(ph) * np.exp(-t * 32) * 0.4
def thud():
    t = tt(0.45); f = 40 + 90 * np.exp(-t * 25); ph = 2 * np.pi * np.cumsum(f) / SR
    n = rng.standard_normal(len(t)) * np.exp(-t * 50) * 0.2
    return (np.sin(ph) * np.exp(-t * 9) + n) * 0.9
def whoosh(d=0.6, up=True):
    t = tt(d); n = rng.standard_normal(len(t)); x = t / d
    a = 0.02 + 0.25 * (x if up else 1 - x)
    s = lp(n, 0.1) * 0 + n
    y = np.empty_like(s); acc = 0.0
    for i in range(len(s)):
        acc += a[i] * (s[i] - acc); y[i] = acc
    return y * np.sin(np.pi * x) ** 1.5 * 0.5
def riser(d):
    t = tt(d); x = t / d; n = rng.standard_normal(len(t))
    y = np.empty_like(n); acc = 0.0; a = 0.01 + 0.35 * x ** 2
    for i in range(len(n)): acc += a[i] * (n[i] - acc); y[i] = acc
    tone = np.sin(2 * np.pi * np.cumsum(200 + 900 * x ** 2) / SR) * 0.15
    return (y * 0.5 + tone) * x ** 1.6
def buzz(d=0.5):
    t = tt(d); s = np.sign(np.sin(2 * np.pi * 150 * t)) * 0.5 + np.sin(2 * np.pi * 300 * t) * 0.3
    return lp(s, 0.2) * (0.5 + 0.5 * np.sin(2 * np.pi * 24 * t)) * np.minimum(1, (d - t) / 0.05) * 0.18
def step(): t = tt(0.09); n = rng.standard_normal(len(t)); return lp(n, 0.08) * np.exp(-t * 45) * 0.9
def chime(): return bell(84, 1.2) + bell(91, 1.2) * 0.6
def boing():
    t = tt(0.45); f = 220 + 160 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 6); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 7) * 0.35
def click(): t = tt(0.03); n = rng.standard_normal(len(t)); return (n * np.exp(-t * 250) * 0.2 + np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 200) * 0.2)
def stamp(): x = thud() * 0.5; x[:len(click())] += click() * 1.5; return x
def scrape():
    t = tt(0.32); n = rng.standard_normal(len(t)); grain = 1 + 0.8 * np.sign(np.sin(2 * np.pi * 38 * t))
    return lp(n, 0.25) * grain * np.sin(np.pi * t / 0.32) * 0.35
def subhit():
    t = tt(2.2); f = 38 + 30 * np.exp(-t * 8); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 1.6) * 0.9

# ── hoà âm Sol thứ: Gm – Eb – Bb – F (i–VI–III–VII), mỗi hợp âm 1 ô nhịp (4 phách)
CH = [(55, [67, 70, 74]), (51, [67, 70, 75]), (46, [65, 70, 74]), (53, [65, 69, 72])]
ROOT808 = [31, 27, 34, 29]   # G1 Eb1 Bb1 F1
DROP = cue('S06', 1.5)       # feed bắt đầu uốn
BREATH = SC['S12'] - 0.1
OUTRO = SC['S13'] - OFF
BAR = 4 * B

def chord_at(t): return int(np.floor(t / BAR)) % 4

# ── phần 1: mỏng (0 → DROP)
t = 0.0
ARP = [0, 2, 1, 2, 0, 2, 1, 2]
while t < DROP - 0.05:
    c = chord_at(t); root, ns = CH[c]
    j = int(round(t / (B / 2)))
    add(pluck(ns[ARP[j % 8]] + 12, 0.45, 0.45), t, 0.55, -0.25 + 0.5 * (j % 2))
    if j % 8 == 0: add(b808(ROOT808[c], BAR * 0.9), t, 0.55)
    if j % 2 == 1 and t > cue('S02', 0.3): add(hat(0.04, 0.7), t, 1.0, 0.3)
    t += B / 2
add(pad([55, 62, 70], DROP - 0.5, 0.8), 0.0)
add(riser(2.4), DROP - 2.4, 0.7)

# ── phần 2: drop, half-time đầy (DROP → BREATH)
bar0 = DROP
t = bar0; k = 0
while t < BREATH - 0.05:
    c = k // 16 % 4; root, ns = CH[c]
    pos = k % 16                     # 16 nốt móc đơn trong 1 ô (8 phách móc đơn = 16th của half-time)
    sub = B / 4
    if pos in (0, 10): add(kick(), t, 0.95)
    if pos == 8: add(clap(), t, 0.9); add(snare(), t, 0.5)
    # hi-hat: móc kép + cuộn 1/32 cuối ô thứ 2
    add(hat(0.04, 0.9 if pos % 2 == 0 else 0.55), t, 1.0, 0.25)
    if (k // 16) % 2 == 1 and pos >= 12:
        add(hat(0.03, 0.6), t + sub / 2, 1.0, 0.25)
    # 808: gốc ở phách 1, trượt lên quãng 8 ở phách 4
    if pos == 0: add(b808(ROOT808[c], BAR * 0.62, glide_from=ROOT808[(c - 1) % 4]), t, 0.75)
    if pos == 13: add(b808(ROOT808[c] + 12, BAR * 0.18, glide_from=ROOT808[c]), t, 0.5)
    # pluck sáng: móc kép
    if pos % 2 == 0:
        mel = [ns[0] + 12, ns[2] + 12, ns[1] + 12, ns[2] + 12, ns[0] + 24, ns[2] + 12, ns[1] + 12, ns[0] + 12][pos // 2]
        add(pluck(mel, 0.35, 1.4), t, 0.42, -0.3 if pos % 4 else 0.3)
    if pos == 0: add(pad([ns[0] - 12, ns[1] - 12, ns[2] - 12], BAR, 0.7), t)
    t += sub; k += 1
add(whoosh(0.5, False), BREATH - 0.2, 0.5)

# ── phần 3: nhịp thở (pad + chuông), rồi outro
add(pad([55, 62, 67, 70], OUTRO - BREATH + 1.5, 1.2), BREATH)
add(bell(79, 2.5), BREATH + 0.4, 0.5)
t = OUTRO; j = 0
while t < DUR - 0.5:
    c = chord_at(t - OUTRO); root, ns = CH[c]
    add(pluck(ns[ARP[j % 8]] + 12, 0.5, 1.0), t, 0.45, -0.2 + 0.4 * (j % 2))
    if j % 4 == 2: add(hat(0.04, 0.6), t, 1.0, 0.3)
    if j % 8 == 0: add(b808(ROOT808[c], BAR * 0.8), t, 0.45)
    t += B / 2; j += 1
add(pad([55, 62, 70, 74], DUR - OUTRO, 1.0), OUTRO)

# ── SFX khớp hình
for i in range(30): add(tick(), 0.1 + i * 0.17, 0.35, 0.4 * ((i % 3) - 1))            # S01 cuộn feed
for i in range(8): add(pop(1100 + 80 * i), 0.3 + i * 0.6, 0.25, 0.3)                    # tim nổi
add(thud(), cue('S01', 0.78), 0.9)                                                      # "0" đập xuống
add(whoosh(0.7), cue('S01', 5.97 - 0.75), 0.6)                                          # đẩy xuyên màn hình
S02D = END['S02'] - SC['S02'] + 16 / 30
for a in [0.55, 0.95, 1.35, 1.75, 2.15, 2.5]: add(pop(1300), cue('S02', a + 0.75), 0.35, -0.2)
w = 3.3
while w < 5.5: add(step(), cue('S02', w), 0.5, 0.2); w += 0.33
add(chime(), cue('S02', 5.45), 0.35, 0.4)
add(whoosh(0.6), cue('S02', S02D - 0.267 - 0.7), 0.5)
for n in range(5):                                                                      # S03 rung điện thoại
    add(buzz(0.45), cue('S03', 0.05 + n * 1.208), 0.8, 0.3)
    add(pop(1500), cue('S03', 0.3 + n * 1.208), 0.25, 0.3)
S03D = END['S03'] - SC['S03'] + 16 / 30
add(whoosh(0.5, False), cue('S03', S03D - 0.267 - 0.9), 0.5)
add(thud(), cue('S03', S03D - 0.267 - 0.55), 0.5)
for i in range(14): add(tick(), cue('S04', 0.5 + i * 0.42 + 0.447), 0.5)                # tim chạm khe phong bì
add(stamp(), cue('S04', 2.4), 0.5)
S04D = END['S04'] - SC['S04'] + 16 / 30
add(whoosh(0.6), cue('S04', S04D - 0.267 - 0.65), 0.5)
for a in (1.0, 1.35, 1.7): add(boing(), cue('S05', a + 1.3), 0.7, (a - 1.35) * 2)     # mũi tên đâm tường
S05D = END['S05'] - SC['S05'] + 16 / 30
add(whoosh(0.6), cue('S05', S05D - 0.267 - 1.0), 0.5)
add(subhit(), DROP, 0.6)                                                                # drop phễu
for i in range(10): add(pop(1200 + 40 * i), cue('S06', 3.3 + i * 0.16), 0.15, 0.2 * ((i % 3) - 1))
S06D = END['S06'] - SC['S06'] + 16 / 30
add(whoosh(0.6), cue('S06', S06D - 0.267 - 0.65), 0.5)
for i in range(21): add(click(), cue('S07', 1.2 + 5.0 * i / 21 + 0.12), 0.8, 0.3)       # thả ô lịch
S07D = END['S07'] - SC['S07'] + 16 / 30
add(whoosh(0.6), cue('S07', S07D - 0.267 - 0.6), 0.5)
for i in range(3):
    a = 1.6 + i * 1.0
    add(pop(800 + 150 * i), cue('S08', a - 0.25), 0.45); add(whoosh(0.5), cue('S08', a + 0.1), 0.2, 0.4); add(pop(600), cue('S08', a + 0.6), 0.35, 0.5)
S08D = END['S08'] - SC['S08'] + 16 / 30
add(whoosh(0.7), cue('S08', S08D - 0.267 - 0.7), 0.5)
for a in (2.9, 4.6): add(click(), cue('S09', a), 1.0)
add(chime(), cue('S09', 5.1), 0.45)
S09D = END['S09'] - SC['S09'] + 16 / 30
add(whoosh(0.6), cue('S09', S09D - 0.267 - 0.6), 0.5)
for i in range(4): add(stamp(), cue('S10', 2.8 + i * 0.45), 0.5, 0.3)
add(scrape() * 0.5, cue('S10', 3.85), 0.6)
S10D = END['S10'] - SC['S10'] + 16 / 30
add(whoosh(0.6), cue('S10', S10D - 0.267 - 0.6), 0.5)
for k in range(6):                                                                      # ghế kéo ra, khách ngồi
    a = 1.4 + k * 0.82
    add(scrape(), cue('S11', a + 0.55), 0.7, (k % 3 - 1) * 0.5); add(pop(1000), cue('S11', a + 0.6), 0.3)
add(pop(700), cue('S13', 0.45), 0.6)
add(subhit(), cue('S13', 1.6), 0.8)

# ── reverb nhẹ + chuẩn hoá
def verb(x):
    n = int(SR * 1.4); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 4.0); ir[0] = 0
    m = 1 << int(np.ceil(np.log2(len(x) + n)))
    return np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)[: len(x)] * 0.012
L2 = L + verb(L); R2 = R + verb(R)
fo = np.ones(N); nf = int(1.2 * SR); fo[-nf:] = np.linspace(1, 0, nf)
L2 *= fo; R2 *= fo
pk = max(np.abs(L2).max(), np.abs(R2).max()); L2 /= pk / 0.89; R2 /= pk / 0.89
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mix.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.stack([L2, R2], 1) * 32767).astype(np.int16).tobytes())
print('ok', out, round(DUR, 2), 's · drop', round(DROP, 2))
