"""SA03 · nhạc + SFX tự tạo (numpy thuần, tất định).
Cinematic build → anthem house 122 BPM · Si giáng thứ (Bbm–Gb–Db–Ab) → Si giáng trưởng ở điệp khúc (Bb–F–Gm–Eb, khoảnh khắc chữ ký S09).
Trống taiko + clap. Mỗi chặng bánh răng thêm một lớp: kick+bass → hat+clap → piano stab → taiko roll.
Foley in ấn khớp hình: clack chữ chì, nhát dao snick, giấy trượt, bánh răng tạch, tem, pop bong bóng, sub-hit logo.
Chạy:  python3 audio_src/score.py  → audio_src/mix.wav  (rồi ffmpeg loudnorm -14 LUFS → public/audio/music.mp3)
Mốc SFX: giây video = đầu cảnh (khung/30) + n × nhịp  (vì nhịp n của cảnh = SAMI.t0 + n·BEAT, t0 = 8/30 = phần chồng).
"""
import numpy as np, wave, os

SR = 44100
DUR = 89.5
N = int(SR * DUR)
BEAT = 60 / 122
BAR = 4 * BEAT
rng = np.random.default_rng(2603)
L = np.zeros(N); R = np.zeros(N)
VL = np.zeros(N); VR = np.zeros(N)   # bus reverb

def at(t): return int(round(t * SR))
def tt(d): return np.arange(int(d * SR)) / SR
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def add(sig, t, gain=1.0, pan=0.0, verb=0.0):
    i = at(t)
    if i >= N or i + len(sig) <= 0: return
    if i < 0: sig = sig[-i:]; i = 0
    s = sig[: N - i] * gain
    gl, gr = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
    L[i:i + len(s)] += s * gl; R[i:i + len(s)] += s * gr
    if verb:
        VL[i:i + len(s)] += s * gl * verb; VR[i:i + len(s)] += s * gr * verb

# ── cảnh (khung bắt đầu)
SC = dict(S01=0, S02=192, S03=369, S04=575, S05=738, S06=900, S07=1062, S08=1225, S09=1387, S10=1564, S11=1770, S12=1948, S13=2125, S14=2302, S15=2449)
def cue(sc, n): return SC[sc] / 30 + n * BEAT
T = {k: v / 30 for k, v in SC.items()}

# ── nhạc cụ
def smooth(x, k):
    c = np.cumsum(np.concatenate([[0], x])); y = (c[k:] - c[:-k]) / k
    return np.concatenate([y, np.zeros(len(x) - len(y))])
def kick(g=1.0):
    t = tt(0.45); f = 48 + 110 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * np.exp(-t * 7) + 0.3 * np.sin(ph * 2) * np.exp(-t * 40)) * g
def taiko(f0=95, d=1.2):
    t = tt(d); f = f0 * (0.55 + 0.45 * np.exp(-t * 14))
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 4.2) + 0.35 * np.sin(ph * 1.52) * np.exp(-t * 7)
    skin = smooth(rng.standard_normal(len(t)), 18) * np.exp(-t * 26) * 1.6
    return (body + skin) * np.minimum(1, t / 0.002)
def clap():
    t = tt(0.32); n = np.diff(rng.standard_normal(len(t)), prepend=0)
    env = np.exp(-t * 18) + 0.8 * sum(np.exp(-(t - o) * 120) * (t >= o) for o in (0.0, 0.011, 0.023))
    return n * env * 0.16
def hat(d=0.06, g=0.12):
    t = tt(d); n = rng.standard_normal(len(t)); n = np.diff(np.diff(n, prepend=0), prepend=0)
    return n * np.exp(-t * 70) * g
def tone(m, d, harm=6, roll=1.0, att=0.005, rel=6.0, det=0.0):
    t = tt(d); f = hz(m) * (1 + det); s = np.zeros(len(t))
    for k in range(1, harm + 1):
        s += np.sin(2 * np.pi * f * k * t + k * 0.7) / k ** roll
    return s * np.minimum(1, t / att) * np.exp(-t * rel)
def bass(m, d):
    t = tt(d); f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    env = np.minimum(1, t / 0.006) * np.minimum(1, (d - t) / 0.02 + 0.0001)
    return s * np.clip(env, 0, 1) * 0.5
def saw_chord(ms, d, bright=10, g=0.06):
    t = tt(d); s = np.zeros(len(t))
    for m in ms:
        for dt in (-0.006, -0.002, 0.002, 0.006):
            f = hz(m) * (1 + dt)
            for k in range(1, bright + 1):
                s += np.sin(2 * np.pi * f * k * t + dt * 900 * k) / k
    env = np.minimum(1, t / 0.04) * np.minimum(1, (d - t) / 0.15 + 1e-4)
    return s * np.clip(env, 0, 1) * g
def pad(ms, d, g=0.05):
    t = tt(d); s = np.zeros(len(t))
    for m in ms:
        for dt in (-0.004, 0.004):
            s += np.sin(2 * np.pi * hz(m) * (1 + dt) * t) + 0.3 * np.sin(4 * np.pi * hz(m) * (1 + dt) * t)
    env = np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.6 + 1e-4)
    return s * np.clip(env, 0, 1) * g
def piano(m, d=0.9):
    return tone(m, d, harm=8, roll=1.4, att=0.002, rel=3.5) * 0.22
def pluck(m, d=0.35):
    return tone(m, d, harm=7, roll=1.1, att=0.002, rel=11) * 0.2

# ── foley in ấn
def clack(g=0.5):
    t = tt(0.09); n = rng.standard_normal(len(t))
    return (smooth(n, 3) * np.exp(-t * 90) + 0.6 * np.sin(2 * np.pi * 1900 * t) * np.exp(-t * 140)) * g
def snick(g=0.4):
    t = tt(0.22); n = np.diff(rng.standard_normal(len(t)), prepend=0)
    sweep = np.sin(2 * np.pi * np.cumsum(3000 + 5000 * t / 0.22) / SR)
    return (n * 0.5 + sweep * 0.3) * np.exp(-t * 22) * np.minimum(1, t / 0.01) * g
def whoosh(d=0.5, g=0.3, up=True):
    t = tt(d); n = rng.standard_normal(len(t)); k = int(SR * 0.0006)
    x = n - smooth(n, k + 1)
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** (1.5 if up else 0.7)
    return x * env * g
def thud(g=0.6, f0=70):
    t = tt(0.35); ph = 2 * np.pi * np.cumsum(f0 * (0.6 + 0.4 * np.exp(-t * 20))) / SR
    return (np.sin(ph) * np.exp(-t * 11) + smooth(rng.standard_normal(len(t)), 30) * np.exp(-t * 40) * 2) * g
def tick(g=0.18, f=3200):
    t = tt(0.03); return np.sin(2 * np.pi * f * t) * np.exp(-t * 260) * g
def ratchet(g=0.22):
    t = tt(0.06); n = smooth(rng.standard_normal(len(t)), 2)
    return (n * 0.6 + np.sin(2 * np.pi * 1200 * t)) * np.exp(-t * 120) * g
def pop(g=0.45):
    t = tt(0.16); f = 500 + 900 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22) * g
def subhit(g=0.9, d=2.2):
    t = tt(d); ph = 2 * np.pi * np.cumsum(38 + 50 * np.exp(-t * 6)) / SR
    return np.sin(ph) * np.exp(-t * 1.8) * np.minimum(1, t / 0.004) * g
def riser(d, g=0.25):
    t = tt(d); n = rng.standard_normal(len(t)); x = n - smooth(n, 6)
    f = 200 * (8 ** (t / d)); s = np.sin(2 * np.pi * np.cumsum(f) / SR)
    return (x * 0.6 + s * 0.25) * (t / d) ** 2 * g
def stamp(g=0.7):
    a = thud(g, 95); b = clack(0.4); a[:len(b)] += b; return a
def slide(d=0.5, g=0.25):
    t = tt(d); n = smooth(rng.standard_normal(len(t)), 8)
    return n * np.sin(np.pi * t / d) * g

# ── hoà âm
BB_MIN = [[46, 49, 53], [42, 46, 49], [49, 53, 56], [44, 48, 51]]   # Bbm Gb Db Ab
BB_MAJ = [[46, 50, 53], [41, 45, 48], [43, 46, 50], [39, 43, 46]]   # Bb F Gm Eb
ROOT_MIN = [34, 30, 37, 32]; ROOT_MAJ = [34, 29, 31, 27]
def bar_of(t): return int(np.floor(t / BAR + 1e-9))

# ── phần 1 · intro điện ảnh (S01–S04): drone + taiko xa + máy đếm nhịp
add(pad([34, 41, 46], T['S05'] + 0.3, 0.05), 0, 1.0, 0, 0.5)
add(pad([58, 61, 65], T['S03'] - 0.5, 0.025), 0.5, 1.0, 0.2, 0.7)
add(pad([57, 61, 64], T['S05'] - T['S03'], 0.03), T['S03'], 1.0, -0.2, 0.7)   # S03 căng: A thăng lơ lửng
for b in range(0, int(T['S05'] / BEAT)):
    tb = b * BEAT
    add(tick(0.07 if b % 4 else 0.12, 2600 if b % 4 else 3400), tb, 1.0, 0.3)
    if b % 4 == 0 and tb > 0.5: add(taiko(80, 1.4), tb, 0.38 + 0.04 * (tb / T['S05']), 0, 0.35)
for k in range(8):   # S03: thình thịch tăng dần
    add(taiko(130, 0.5), T['S03'] + (2 + k * 1.5) * BEAT, 0.12 + 0.03 * k, -0.4 + 0.1 * k, 0.3)
add(riser(T['S05'] - cue('S04', 6.5)), cue('S04', 6.5), 1.0, 0, 0.2)

# ── phần 2 · groove thứ (S05–S08): kick 4/4 + bass, từng chặng thêm lớp
g0, g1 = T['S05'], T['S09']
duck = np.ones(N)
b0 = int(round(g0 / BEAT)); b1 = int(round(g1 / BEAT))
for b in range(b0, b1):
    tb = b * BEAT; br = bar_of(tb) % 4; chord = BB_MIN[br]; root = ROOT_MIN[br]
    add(kick(0.9), tb)
    i = at(tb); dl = min(N - i, int(0.25 * SR)); duck[i:i + dl] = np.minimum(duck[i:i + dl], 0.35 + 0.65 * np.linspace(0, 1, dl) ** 0.5)
    add(bass(root + (12 if b % 2 else 0), BEAT * 0.45), tb + BEAT * 0.5, 0.9)
    if tb >= T['S06'] - 0.01:
        add(hat(0.06, 0.13), tb + BEAT * 0.5, 1.0, 0.25)
        if b % 2 == 1: add(clap(), tb, 1.0, 0, 0.3)
    if tb >= T['S07'] - 0.01 and b % 4 in (0, 3):
        for m in chord: add(piano(m + 12), tb + (BEAT * 0.5 if b % 4 == 3 else 0), 1.0, 0.1, 0.4)
    if tb >= T['S08'] - 0.01 and b % 4 == 3:
        for k in range(4): add(taiko(150, 0.4), tb + k * BEAT / 4, 0.12 + 0.05 * k, 0.3 - 0.2 * k, 0.3)
for br_i in range(bar_of(g0), bar_of(g1) + 1):
    tb = max(g0, br_i * BAR); te = min(g1, (br_i + 1) * BAR)
    if te > tb: add(pad([m + 12 for m in BB_MIN[br_i % 4]], te - tb + 0.3, 0.018), tb, 1.0, 0, 0.6)
add(riser(4 * BEAT, 0.35), g1 - 4 * BEAT, 1.0, 0, 0.3)

# ── phần 3 · điệp khúc trưởng (S09) + groove trưởng nhẹ hơn (S10–S13)
c0, c1 = T['S09'], T['S14']
b0 = int(round(c0 / BEAT)); b1 = int(round(c1 / BEAT))
for b in range(b0, b1):
    tb = b * BEAT; br = (b - b0) // 4 % 4; chord = BB_MAJ[br]; root = ROOT_MAJ[br]
    full = tb < T['S10'] - 0.01
    add(kick(0.95 if full else 0.8), tb)
    i = at(tb); dl = min(N - i, int(0.25 * SR)); duck[i:i + dl] = np.minimum(duck[i:i + dl], 0.35 + 0.65 * np.linspace(0, 1, dl) ** 0.5)
    add(bass(root + (12 if b % 2 else 0), BEAT * 0.45), tb + BEAT * 0.5, 0.9)
    add(hat(0.05, 0.12), tb + BEAT * 0.5, 1.0, 0.25)
    add(hat(0.03, 0.05), tb + BEAT * 0.25, 1.0, -0.3)
    if b % 2 == 1: add(clap(), tb, 1.1 if full else 0.8, 0, 0.35)
    if full and b % 4 == 0: add(taiko(85, 1.2), tb, 0.5, 0, 0.3)
    if b % 4 == 0:
        dd = 4 * BEAT
        add(saw_chord([m + 12 for m in chord] + [chord[0] + 24], dd, 12 if full else 6, 0.08 if full else 0.03), tb, 1.0, 0, 0.5)
    if not full:
        arp = [chord[0] + 24, chord[1] + 24, chord[2] + 24, chord[1] + 24]
        add(pluck(arp[b % 4]), tb + BEAT * 0.5, 1.0, 0.35 if b % 2 else -0.35, 0.4)
add(subhit(1.0, 2.5), c0); add(taiko(70, 2.0), c0, 0.7, 0, 0.4); add(whoosh(0.6, 0.35), c0 - 0.6)
# ngoại lệ biết hát: sóng sine trượt lên theo mũi tên doanh thu (S09, tuyến tính)
a0, a1 = cue('S09', 3), T['S10'] + 8 / 30
t = tt(a1 - a0); f = hz(70) * 2 ** (t / (a1 - a0) * 1.0)
add(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.3) * np.minimum(1, (a1 - a0 - t) / 0.2) * 0.06, a0, 1.0, 0.4, 0.6)

# ── phần 4 · lời hứa (S14): 3 hit, rồi im (nhịp thở)
for n, ch in zip((0.5, 1.5, 2.5), (BB_MAJ[0], BB_MAJ[3], BB_MAJ[1])):
    tb = cue('S14', n)
    add(taiko(75, 1.6), tb, 0.42, 0, 0.5); add(kick(0.6), tb); add(clap(), tb, 0.7, 0, 0.5)
    add(saw_chord([m + 12 for m in ch], 1.6, 10, 0.04), tb, 1.0, 0, 0.6)
    add(bass(ch[0] - 12, 1.2), tb, 0.55)
add(pad([46, 50, 53, 58], cue('S14', 7.4) - cue('S14', 3), 0.03), cue('S14', 3), 1.0, 0, 0.6)

# ── phần 5 · end card (S15): hợp âm trưởng nở chậm + nhịp nhẹ, kết
e0 = cue('S15', 0.6)
add(pad([34, 41, 46, 50, 53, 58], DUR - e0, 0.045), e0, 1.0, 0, 0.7)
for b in range(int(round(cue('S15', 4) / BEAT)), int(DUR / BEAT) - 1):
    tb = b * BEAT
    add(pluck([70, 74, 77, 74][b % 4]), tb, 0.8, 0.3 if b % 2 else -0.3, 0.6)
    if b % 2 == 0: add(kick(0.45), tb)

# ── SFX khớp hình
for n in (0,): add(thud(0.7), cue('S01', n)); add(whoosh(0.35, 0.15), cue('S01', n) - 0.35)
add(whoosh(0.9, 0.18, False), cue('S01', 1))
for n in (2.3, 4.2, 6.1, 7): add(clack(0.55), cue('S01', n), 1.0, -0.1)
add(thud(0.6, 60), cue('S01', 6.5) + 0.25)
for n in (0.2, 0.7, 1.2): add(snick(0.45), cue('S02', n), 1.0, 0.2)
add(clack(0.5), cue('S02', 2.4)); add(slide(0.7, 0.25), cue('S02', 3))
q = 'Restaurant in der Nähe'
for k in range(len(q)): add(tick(0.12, 2200 + 300 * (k % 3)), cue('S02', 4) + (cue('S02', 6.6) - cue('S02', 4)) * k / len(q), 1.0, 0.3)
add(whoosh(0.4, 0.15), cue('S03', 0.3)); add(snick(0.45), cue('S03', 0.6))
for n in (1.6, 2.15, 2.9, 3.3, 4.05): add(thud(0.55, 85), cue('S03', n) + 0.3, 1.0, rng.uniform(-0.5, 0.5))
add(clack(0.5), cue('S03', 1)); add(clack(0.4), cue('S03', 3.6))
for k in range(8): add(tick(0.1, 4200), cue('S03', 5 + k), 1.0, 0.5)
add(whoosh(0.5, 0.2), cue('S04', 0.3)); add(subhit(0.5, 1.2), cue('S04', 1.0))
for k in range(5): add(clack(0.55), cue('S04', 0.5 + k * 0.5) + 0.3, 1.0, -0.3 + 0.15 * k)
add(clack(0.5), cue('S04', 3.4)); add(whoosh(0.8, 0.3), cue('S04', 9.7))
ACT = [SC[s] / 30 + 1.6 * BEAT for s in ('S05', 'S06', 'S07', 'S08')]
for k, s in enumerate(('S05', 'S06', 'S07', 'S08')):
    add(whoosh(0.4, 0.18), ACT[k] - 0.35); add(thud(0.6, 110), ACT[k] + 0.05); add(clack(0.5), cue(s, 1.5))
    for c in range(4): add(tick(0.12, 2800), cue(s, 3.5 + c * 0.5) + 0.1, 1.0, 0.4)
    if k > 0: add(whoosh(0.6, 0.15), cue(s, 0.2))
for b in range(int(np.ceil(ACT[0] / BEAT)), int(T['S10'] / BEAT)):   # bánh răng tạch mỗi nhịp
    add(ratchet(0.16), ACT[0] + (b - int(np.ceil(ACT[0] / BEAT))) * BEAT, 1.0, 0.45)
add(clack(0.4), cue('S09', 1.6))
add(snick(0.35), cue('S10', 0)); add(clack(0.4), cue('S10', 0.6))
for k in range(3): add(clack(0.6), cue('S10', 2 + 2.5 * k)); add(thud(0.4, 90), cue('S10', 2 + 2.5 * k) + 0.25)
add(clack(0.4), cue('S11', 0.4)); add(slide(0.8, 0.3), cue('S11', 1.5))
for k in range(4): add(tick(0.1, 3000), cue('S11', 3 + 0.5 * k), 1.0, -0.3)
add(stamp(0.75), cue('S11', 6) + 0.18); add(whoosh(0.55, 0.3), cue('S11', 11.1))
for n in (0.6, 1.6, 2.6): add(clack(0.6), cue('S12', n) + 0.1)
add(pop(0.3), cue('S12', 5)); add(pop(0.3), cue('S12', 6.5))
for k in range(15): add(tick(0.09, 2400 + 120 * k), cue('S13', 0.3) + (0 if k == 0 else 0.35 + 1.6 * k / 14), 1.0, -0.4 + k * 0.055)
add(clack(0.45), cue('S13', 0.8))
for n in (7.4, 7.7, 8.0): add(snick(0.5), cue('S14', n))
add(tick(0.2, 1800), cue('S14', 8.9))
add(whoosh(0.7, 0.3), cue('S15', 0.6)); add(subhit(0.7, 1.8), cue('S15', 0.9))
add(pop(0.55), cue('S15', 4)); add(subhit(0.9, 2.4), cue('S15', 7)); add(clack(0.3), cue('S15', 1.6))

# ── reverb (FFT, IR suy giảm) + mix
ir_t = tt(1.9); ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 3.2); ir = smooth(ir, 4); ir /= np.sqrt(np.sum(ir ** 2))
def conv(x):
    n = len(x) + len(ir); nf = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nf) * np.fft.rfft(ir, nf), nf)[:len(x)]
L = L * duck ** 0.6 + conv(VL) * 0.35
R = R * duck ** 0.6 + conv(VR) * 0.35
fade = np.ones(N); fl = int(1.5 * SR); fade[-fl:] = np.linspace(1, 0, fl) ** 2
L *= fade; R *= fade
pk = max(np.abs(L).max(), np.abs(R).max()); L /= pk / 0.9; R /= pk / 0.9
out = os.path.join(os.path.dirname(__file__), 'mix.wav')
d = (np.stack([L, R], 1) * 32767).astype('<i2')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes())
print('ok', out, DUR, 's')
