"""SA08 · nhạc + SFX tự tạo (numpy thuần, không sample ngoài).
Music box + pizzicato, 96 BPM, Mi giáng trưởng. Đọc events.json (core/render/events.mjs) → out/mix.wav.
Chạy: python3 audio_src/score.py <thư mục phim>
"""
import json, sys, wave, os
import numpy as np

SR = 48000
BPM = 96.0
BEAT = 60 / BPM
BAR = BEAT * 4
HERE = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EV = json.load(open(os.path.join(HERE, 'events.json')))
DUR = EV['dur']
N = int((DUR + 0.5) * SR)
rng = np.random.default_rng(8)

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def tt(d): return np.arange(int(d * SR)) / SR

# ---------- nhạc cụ ----------
def musicbox(m, vel=1.0, d=2.2):
    t = tt(d); f = hz(m)
    parts = [(1, 1.0, 1.4), (3.0, .32, .45), (5.4, .12, .2), (8.9, .05, .1)]
    y = sum(a * np.sin(2 * np.pi * f * r * t + r) * np.exp(-t / tau) for r, a, tau in parts if f * r < 16000)
    click = rng.standard_normal(len(t)) * np.exp(-t / 0.002) * 0.08
    return (y + click) * vel * 0.32

def glock(m, vel=1.0, d=1.6):
    t = tt(d); f = hz(m)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.9) + .25 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / .25) + .1 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / .1)
    return y * vel * 0.22

def pizz(m, vel=1.0, d=None):
    f = hz(m); d = d or (0.9 if m < 48 else 0.55); t = tt(d)
    tau = 0.42 if m < 48 else 0.22
    y = np.zeros(len(t))
    for n in range(1, 12):
        if f * n > 9000: break
        y += (1 / n ** 1.25) * np.sin(2 * np.pi * f * n * t * (1 + 0.0004 * n * n)) * np.exp(-t * n ** 0.7 / tau)
    att = np.minimum(1, t / 0.003)
    thump = rng.standard_normal(len(t)) * np.exp(-t / 0.006) * 0.06
    return (y * att + thump) * vel * (0.34 if m < 48 else 0.2)

def put(buf, x, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= buf.shape[1] or i + len(x) <= 0: return
    if i < 0: x = x[-i:]; i = 0
    x = x[:buf.shape[1] - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + len(x)] += x * gain * l * 1.414
    buf[1, i:i + len(x)] += x * gain * r * 1.414

def fft_band(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.clip((f - lo * 0.7) / (lo * 0.3 + 1e-9), 0, 1) * np.clip((hi * 1.3 - f) / (hi * 0.3), 0, 1)
    return np.fft.irfft(X * m, len(x))

# ---------- hoà âm: Eb – Cm – Ab – Bb ----------
CH = [(51, [63, 67, 70]), (48, [60, 63, 67]), (44, [60, 63, 68]), (46, [62, 65, 70])]
def chord(bar): return CH[bar % 4]
# giai điệu (bậc trong hợp âm + nốt lướt), 8 nốt móc đơn / ô nhịp, 2 ô nhịp một câu
MEL_A = [[75, None, 79, 82, 80, None, 79, 77], [79, None, 75, 74, 75, None, None, 72],
         [72, None, 75, 80, 79, None, 77, 75], [77, None, 74, 70, 74, None, 77, None]]
MEL_B = [[82, None, 84, 87, 86, None, 84, 82], [84, None, 79, 82, 84, None, 87, None],
         [80, None, 84, 87, 84, None, 82, 80], [82, None, 86, 89, 87, None, None, None]]

M = np.zeros((2, N))
def bar_t(b): return b * BAR

def arp(b, vel=0.7, oct=12):
    _, ch = chord(b)
    pat = [0, 1, 2, 1, 0, 2, 1, 2]
    for k, p in enumerate(pat):
        put(M, musicbox(ch[p] + oct, vel * (1 if k % 2 == 0 else .7)), bar_t(b) + k * BEAT / 2, 1, -0.3 + 0.2 * p)

def bass(b, vel=1.0):
    r, _ = chord(b)
    for k, s in enumerate([0, 7, 12, 7]):
        put(M, pizz(r - 12 + s if k != 2 else r, vel), bar_t(b) + k * BEAT, 1, -0.1)

def offbeat(b, vel=0.8):
    _, ch = chord(b)
    for k in range(4):
        for j, n in enumerate(ch): put(M, pizz(n - 12, vel * 0.6), bar_t(b) + k * BEAT + BEAT / 2 + j * 0.008, 1, 0.35)

def melody(b, mel, inst=musicbox, vel=0.9, shift=0, pan=0.15):
    for k, n in enumerate(mel[b % 4]):
        if n is not None: put(M, inst(n + shift, vel), bar_t(b) + k * BEAT / 2, 1, pan)

# 0–10 s (ô 0–3): music box rải, ghim = glock
for b in range(0, 4): arp(b, 0.55 + 0.05 * b)
for b in range(2, 4): bass(b, 0.6)
# 10–29,4 (ô 4–11): đủ dàn
for b in range(4, 12):
    arp(b, 0.5); bass(b); offbeat(b, 0.7 if b >= 6 else 0.4); melody(b, MEL_A, vel=0.85)
# 37,5–62,5 (ô 15–24): thêm bè theo từng lớp SAMI
for b in range(15, 25):
    arp(b, 0.55)
    if b >= 17: bass(b, 0.9)
    if b >= 20: offbeat(b, 0.6)
    if b >= 22: melody(b, MEL_A, inst=glock, vel=0.8, pan=-0.25)
    if b >= 23: melody(b, MEL_A, vel=0.7, shift=0, pan=0.3)
# 62,5–70 (ô 25–27): A' sáng hơn
for b in range(25, 28): arp(b, 0.5); bass(b); offbeat(b, 0.75); melody(b, MEL_B, vel=0.9); melody(b, MEL_B, inst=glock, vel=0.45, shift=-12, pan=-0.3)
# 70–76 (ô 28–30): thưa dần
for b in range(28, 30): arp(b, 0.45); bass(b, 0.6)
put(M, musicbox(75, 0.6, 3), bar_t(30)); put(M, musicbox(70, 0.5, 3), bar_t(30) + BEAT * 1.5); put(M, musicbox(79, 0.55, 4), 76.0)
# end card (ô 31–34): chủ đề solo + pizz, kết Eb
for b in range(31, 34): melody(b, MEL_A, vel=0.95, shift=12 if b == 33 else 0); bass(b, 0.55)
for n in [63, 67, 70, 75, 79]: put(M, musicbox(n, 0.7, 4), bar_t(34) - 0.6 + (n - 63) * 0.012)
put(M, pizz(39, 0.9), bar_t(34) - 0.6)

# tape-stop 29,4 → 30,0 rồi im lặng tới 35,0
T0, T1 = 29.4, 30.0
i0, i1 = int(T0 * SR), int(T1 * SR)
u = np.arange(i1 - i0) / (i1 - i0)
rate = 1 - 0.85 * u
pos = i0 + np.cumsum(rate)
seg = np.stack([np.interp(pos, np.arange(N), M[c]) for c in range(2)]) * (1 - u ** 2)
M[:, i0:i1] = seg
M[:, i1:int(35.0 * SR)] = 0
M[:, int(35.0 * SR):int(37.5 * SR)] *= 0  # sạch
put(M, musicbox(75, 0.7, 3), 35.0, 1, 0.1)
put(M, musicbox(70, 0.45, 3), 36.25, 1, -0.1)

# ---------- SFX ----------
X = np.zeros((2, N))
def noise(d): return rng.standard_normal(int(d * SR))
def env(d, a, r): t = tt(d); return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / r)
def whoosh(d=0.9, lo=300, hi=4000):
    x = fft_band(noise(d), lo, hi); t = tt(d); return x * np.sin(np.pi * t / d) ** 2 * 0.25
def blip(f, d=0.08, g=0.3): t = tt(d); return np.sin(2 * np.pi * f * t) * np.exp(-t / (d / 4)) * g
def pop(): t = tt(0.09); f = 500 + 900 * t / 0.09; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.025) * 0.35
def click(g=0.25): t = tt(0.02); return fft_band(noise(0.02), 1500, 9000) * np.exp(-t / 0.003) * g
def bell(m, d=1.5, g=0.3): return glock(m, 1, d) * g * 3
def clink(): t = tt(0.4); return sum(np.sin(2 * np.pi * f * t) * np.exp(-t / 0.08) for f in (3100, 4270, 5650)) * 0.06
pin_n = [75, 77, 79, 80, 82, 84, 86, 87, 89]
pi = 0
for e in EV['ev']:
    t, ty = e['t'], e['type']
    if ty == 'pin': put(X, glock(pin_n[pi % 9], 0.9) * 1.2, t, 1, -0.4 + 0.1 * pi); put(X, click(0.12), t); pi += 1
    elif ty == 'whoosh': put(X, whoosh(1.0), t - 0.45, 0.9)
    elif ty == 'bubble': put(X, pop(), t, 0.8, 0.2)
    elif ty == 'cap': put(X, click(0.06), t)
    elif ty == 'route':
        for k in range(10): put(X, blip(1800 + k * 60, 0.03, 0.08), t + k * 0.09, 1, -0.5 + k * 0.1)
    elif ty == 'bell': put(X, bell(91, 1.4, 0.35), t, 1, 0.5); put(X, bell(88, 1.4, 0.3), t + 0.18, 1, 0.5)
    elif ty == 'sigh': x = fft_band(noise(1.0), 300, 2500) * np.sin(np.pi * tt(1.0)) ** 2 * 0.05; put(X, x, t)
    elif ty == 'phone': put(X, fft_band(noise(0.25), 800, 6000) * env(0.25, 0.05, 0.08) * 0.08, t)
    elif ty == 'tap': put(X, click(0.1), t, 1, 0.1)
    elif ty == 'send': put(X, whoosh(0.35, 1500, 7000) * 1.2, t - 0.1, 1, 0.2); put(X, blip(1320, 0.12, 0.15), t + 0.12)
    elif ty == 'tile': put(X, click(0.18), t, 1, 0.1); put(X, blip(880, 0.05, 0.06), t)
    elif ty == 'screen': put(X, bell(96, 1.6, 0.25), t)
    elif ty == 'pinrise':
        tq = tt(0.5); put(X, np.sin(2 * np.pi * np.cumsum(400 + 900 * tq / 0.5) / SR) * np.sin(np.pi * tq / 0.5) * 0.12, t); put(X, bell(94, 1.6, 0.3), t + 0.55)
    elif ty == 'card': put(X, pop(), t, 0.7)
    elif ty == 'ripple': tq = tt(0.9); put(X, (np.sin(2 * np.pi * 150 * tq) * 0.25 + fft_band(noise(0.9), 100, 600) * 0.2) * np.exp(-tq / 0.25) * 0.6, t)
    elif ty == 'star':
        for k, m in enumerate([96, 100, 103]): put(X, bell(m, 0.8, 0.12), t + k * 0.07, 1, 0.3)
    elif ty == 'lights':
        for k, m in enumerate([87, 91, 94, 99]): put(X, bell(m, 1.0, 0.12), t + k * 0.08, 1, -0.2 + k * 0.15)
    elif ty == 'clink': put(X, clink(), t, 1, rng.uniform(-0.6, 0.6))
    elif ty == 'off': put(X, click(0.3), t, 1, rng.uniform(-0.5, 0.5)); tq = tt(0.2); put(X, np.sin(2 * np.pi * 90 * tq) * np.exp(-tq / 0.05) * 0.15, t)
    elif ty == 'iris': put(X, whoosh(1.2, 200, 3000) * 1.2, t - 0.3)
    elif ty == 'logo':
        tq = tt(1.6); f = 70 * np.exp(-tq * 1.2) + 38; put(X, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tq / 0.6) * 0.7, t)
        put(X, fft_band(noise(0.15), 60, 400) * np.exp(-tt(0.15) / 0.04) * 0.5, t)
    elif ty == 'pop': put(X, pop(), t, 1.0); put(X, bell(91, 0.8, 0.15), t + 0.05)
    elif ty == 'tick': put(X, click(0.15), t)

# nền: rì rầm phố + hiss tua nhanh + gió/phố thật ở ×1
tl = np.arange(N) / SR
murmur = fft_band(rng.standard_normal(N), 200, 1400) * 0.035
hiss = fft_band(rng.standard_normal(N), 4000, 12000) * 0.018
fast = ((tl < 29.4) | ((tl >= 37.5) & (tl < 77.5))).astype(float)
fast = np.convolve(fast, np.ones(4800) / 4800, mode='same')
real = ((tl >= 30.0) & (tl < 37.5)).astype(float); real = np.convolve(real, np.ones(9600) / 9600, mode='same')
wind = fft_band(rng.standard_normal(N), 80, 700) * (0.5 + 0.5 * np.sin(tl * 0.9)) * 0.07
end = (tl < 77.6).astype(float); end = np.convolve(end, np.ones(24000) / 24000, mode='same')
for c in range(2):
    X[c] += (murmur * (0.6 + 0.4 * fast) * end + hiss * fast * end + wind * real)
for k in range(9):   # tiếng chân thật
    put(X, fft_band(noise(0.05), 300, 3000) * np.exp(-tt(0.05) / 0.01) * 0.12, 30.5 + k * 0.55 + rng.uniform(0, .1), 1, 0.6)

mix = M * 0.85 + X
mix = np.tanh(mix * 1.1) / 1.1
mix /= np.max(np.abs(mix)) / 0.89
out = os.path.join(HERE, 'out', 'mix.wav'); os.makedirs(os.path.dirname(out), exist_ok=True)
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix.T * 32767).astype('<i2').tobytes())
print(out, f'{mix.shape[1] / SR:.1f}s')
