"""SA13 · nhạc + SFX tự tạo (numpy thuần, tất định).
Piano buồn La thứ 72 BPM (S01–S05) → chuyển điệu ở S06 → Đô trưởng 120 BPM, dây + trống (S07–S09) → lắng, ấm (S10–S11).
Chạy:  python3 audio_src/score.py  → audio_src/mix.wav
       ffmpeg -y -i audio_src/mix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 44100 -b:a 192k public/audio/music.mp3
Mốc SFX lấy từ project.json (giây video = đầu cảnh + giây trong clip - 8/30).
"""
import numpy as np, wave, os, json

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
PJ = json.load(open(os.path.join(HERE, '..', 'project.json'), encoding='utf-8'))
SC = {s['id']: s['start'] / 30 for s in PJ['scenes']}
DUR = PJ['scenes'][-1]['end'] / 30 + 0.3
N = int(SR * DUR)
rng = np.random.default_rng(1913)
L = np.zeros(N); R = np.zeros(N)
OFF = 8 / 30
def cue(scene, clip_t): return SC[scene] + clip_t - OFF
def at(t): return int(round(t * SR))
def tt(d): return np.arange(int(d * SR)) / SR
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def add(sig, t, gain=1.0, pan=0.0, bus=None):
    i = at(t)
    if i >= N or i + len(sig) <= 0: return
    if i < 0: sig = sig[-i:]; i = 0
    s = sig[: N - i] * gain
    (bus or (L, R))[0][i:i + len(s)] += s * np.sqrt(0.5 * (1 - pan))
    (bus or (L, R))[1][i:i + len(s)] += s * np.sqrt(0.5 * (1 + pan))
def lp_fast(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / (1 + (f / cutoff) ** 4), len(x))
def bp_fast(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * (1 / (1 + (f / hi) ** 4)) * (1 / (1 + (lo / np.maximum(f, 1)) ** 4)), len(x))

# ── nhạc cụ
def piano(m, d=2.6, vel=1.0, bright=1.0):
    t = tt(d); f0 = hz(m); s = np.zeros(len(t))
    for k in range(1, 10):
        fk = f0 * k * np.sqrt(1 + 0.00035 * k * k)
        if fk > 12000: break
        s += np.sin(2 * np.pi * fk * t + k) * (1 / k ** 1.25) * np.exp(-t * (0.9 + 0.55 * k / bright) * (1 + f0 / 900))
    s += 0.004 * rng.standard_normal(len(t)) * np.exp(-t * 60)
    env = np.minimum(1, t / 0.004) * np.minimum(1, (d - t) / 0.25)
    return s * env * 0.16 * vel
def strings(ms, d, att=1.2):
    t = tt(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-0.07, 0.0, 0.06):
            f = hz(m + det); vib = 1 + 0.003 * np.sin(2 * np.pi * 5.2 * t + m)
            ph = 2 * np.pi * np.cumsum(f * vib) / SR
            s += (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.18 * np.sin(3 * ph) + 0.08 * np.sin(4 * ph))
    env = np.minimum(1, t / att) * np.minimum(1, (d - t) / 0.9)
    return s * env * 0.012
def kick():
    t = tt(0.4); f = 46 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * 0.9
def snare():
    t = tt(0.3); n = bp_fast(rng.standard_normal(len(t)), 900, 7000)
    return (n * np.exp(-t * 16) * 0.5 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25) * 0.3)
def hat(d=0.06):
    t = tt(d); n = np.diff(rng.standard_normal(len(t) + 1)); return n * np.exp(-t * 70) * 0.12
def sub_hit():
    t = tt(2.2); f = 38 + 50 * np.exp(-t * 6)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6) * 1.0
def bell(f=1760, d=2.5):
    t = tt(d); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 2.2) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 5)) * 0.18
def tick():
    t = tt(0.03); return bp_fast(rng.standard_normal(len(t)), 2500, 8000) * np.exp(-t * 200) * 0.25
def click():
    t = tt(0.025); return bp_fast(rng.standard_normal(len(t)), 1500, 9000) * np.exp(-t * 260) * 0.3
def whoosh(d=0.8, up=True):
    t = tt(d); n = rng.standard_normal(len(t)); env = np.sin(np.pi * t / d) ** 2
    return lp_fast(n, 2500) * env * 0.35
def swish(d=0.9):
    t = tt(d); return bp_fast(rng.standard_normal(len(t)), 600, 3500) * np.sin(np.pi * t / d) ** 3 * 0.12
def paper():
    t = tt(0.16); return bp_fast(rng.standard_normal(len(t)), 1800, 9000) * np.exp(-t * 30) * (1 + np.sin(2 * np.pi * 70 * t)) * 0.16
def pop():
    t = tt(0.18); f = 500 + 900 * np.exp(-t * 40); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22) * 0.4

# ── nền: mưa (S01–S10), sôi nồi (S02), tiếng quán đông (S08–S09)
rain = bp_fast(rng.standard_normal(N), 400, 9000)
drops = np.zeros(N)
for i in range(int(DUR * 9)):
    p = int(rng.uniform(0, N - 2000)); drops[p:p + 400] += rng.standard_normal(400) * np.exp(-np.arange(400) / 50) * rng.uniform(0.2, 1)
rain = rain * 0.05 + bp_fast(drops, 1500, 8000) * 0.12
tr = np.arange(N) / SR
renv = np.clip(np.minimum(tr / 0.6, 1), 0, 1) * np.interp(tr, [0, SC['S07'] - 1, SC['S07'] + 2, SC['S08'], SC['S09'], SC['S10'] + 3, DUR], [1, 1, .55, .5, .25, .05, 0])
L += rain * renv * 0.32; R += np.roll(rain, 337) * renv * 0.32
boil = bp_fast(rng.standard_normal(at(9)), 150, 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 3.1 * tt(9)) ** 8)
add(boil * np.minimum(1, tt(9) / 1) * np.minimum(1, (9 - tt(9)) / 1.5) * 0.12, SC['S02'] - 0.2, pan=0.3)
crowd = bp_fast(rng.standard_normal(N), 250, 2200) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.37 * tr) * np.sin(2 * np.pi * 0.23 * tr + 1))
cenv = np.interp(tr, [0, SC['S08'] + 0.8, SC['S08'] + 6.5, SC['S09'] + 4.5, SC['S10'] + 1.5, DUR], [0, 0, 1, .7, 0, 0])
L += crowd * cenv * 0.05; R += np.roll(crowd, 911) * cenv * 0.05

# ── A · La thứ 72 BPM (S01 → hết S05)
B72 = 60 / 72
A_end = SC['S06']
prog_a = [(57, [45, 52, 57, 60, 64]), (53, [41, 48, 53, 57, 60]), (48, [36, 43, 48, 52, 55]), (55, [43, 50, 55, 59, 62])]  # Am F C G
mel_a = [76, 74, 72, 71, 72, 69, None, 71, 72, 74, 76, 79, 76, None, 74, 72]
t0 = 0.4; bar = 0
while t0 < A_end - 0.5:
    root, ch = prog_a[bar % 4]
    pat = [ch[0], ch[2], ch[3], ch[4], ch[3], ch[2]]
    for j, m in enumerate(pat):
        add(piano(m, 2.4, 0.75 if j else 1.0, 0.9), t0 + j * B72 / 2, pan=-0.15 + 0.06 * j)
    if bar >= 1:
        for j in range(2):
            m = mel_a[(bar * 2 + j) % len(mel_a)]
            if m: add(piano(m, 3.2, 0.95, 1.2), t0 + j * B72 * 1.5, pan=0.2)
    if bar >= 2: add(strings([ch[0] + 12, ch[2] + 12], B72 * 3 + 0.6, 1.5), t0, 0.7)
    t0 += B72 * 3; bar += 1
# tink khi kim vào số 6
add(bell(1760), cue('S01', 1.9), 0.8, 0.1)
for i in range(1, 6): add(tick(), i * 1.0 + 0.05, 0.7, -0.3)

# ── chuyển điệu S06: F → G7 (át của Đô trưởng), dây phồng lên
t6 = SC['S06']
add(strings([53, 57, 60, 65], 2.2, 0.8), t6 - 0.2, 1.1)
add(strings([55, 59, 62, 65, 67], 2.4, 1.2), t6 + 1.8, 1.3)
for j, m in enumerate([41, 48, 53, 57]): add(piano(m, 2.6, 0.8), t6 + j * 0.3)
for j, m in enumerate([43, 50, 55, 59, 65]): add(piano(m, 2.6, 0.8, 1.2), t6 + 2.0 + j * 0.22)
rs = tt(1.6); add(lp_fast(rng.standard_normal(len(rs)), 3000) * (rs / 1.6) ** 2 * 0.25, SC['S07'] - 1.6)

# ── B · Đô trưởng 120 BPM (S07 → S09)
B = 0.5
B_start, B_end = SC['S07'], SC['S09'] + 5.0       # 1,5 s cuối S09 là nhịp thở (chỉ piano tắt dần)
prog_b = [[48, 55, 60, 64, 67], [43, 50, 55, 59, 62], [45, 52, 57, 60, 64], [41, 48, 53, 57, 60]]  # C G Am F
mel_b = [72, 74, 76, 79, 77, 76, 74, 72, 71, 72, 74, 76, 72, 69, 71, 72]
t0 = B_start; bar = 0
while t0 < B_end - 0.1:
    ch = prog_b[bar % 4]; sec8 = t0 >= SC['S08']
    for j in range(8):
        m = [ch[1], ch[2], ch[3], ch[4], ch[3], ch[2], ch[3], ch[4]][j]
        add(piano(m, 1.4, 0.55, 1.1), t0 + j * B / 2, pan=-0.2 + 0.05 * j)
    add(piano(ch[0] - 12 if ch[0] > 40 else ch[0], 2.2, 0.9), t0, pan=-0.1)
    for j in range(4):
        m = mel_b[(bar * 4 + j) % len(mel_b)]
        add(piano(m, 1.8, 0.85 if not sec8 else 1.0, 1.3), t0 + j * B, pan=0.18)
    add(strings([ch[2] + 12, ch[3] + 12, ch[4] + 12], 2.3, 0.6), t0, 0.9 if not sec8 else 1.5)
    if sec8: add(strings([ch[0], ch[2]], 2.3, 0.4), t0, 1.2)
    for j in range(4):
        tb = t0 + j * B
        if tb >= B_end - 0.05: break
        if j in (0, 2): add(kick(), tb, 0.8 if sec8 else 0.6)
        if j in (1, 3) and (sec8 or bar >= 2): add(snare(), tb, 0.45 if sec8 else 0.3, 0.05)
        add(hat(), tb + 0.25, 0.8, 0.3); add(hat(0.04), tb, 0.5, 0.3)
    t0 += B * 4; bar += 1
# nhịp thở: hợp âm Đô trưởng ngân
add(strings([60, 64, 67, 72], 3.5, 0.3), B_end - 0.2, 1.0)
for j, m in enumerate([48, 55, 64, 67, 72]): add(piano(m, 4.0, 0.8), B_end + j * 0.12)

# ── C · CTA + end card: piano ấm, chậm
t0 = SC['S10'] + 0.3
for k, ch in enumerate([[41, 53, 57, 60, 65], [43, 55, 59, 62, 67], [48, 55, 60, 64, 67, 72]]):
    for j, m in enumerate(ch): add(piano(m, 4.5, 0.75, 1.0), t0 + k * 2.4 + j * 0.16, pan=-0.2 + 0.08 * j)
    add(strings(ch[1:4], 2.8, 0.8), t0 + k * 2.4, 0.9)
t11 = SC['S11']
add(strings([48, 55, 60, 64, 67], DUR - t11 - 0.2, 1.0), t11, 1.1)
for j, m in enumerate([60, 64, 67, 72, 76]): add(piano(m, 5.0, 0.7, 1.2), cue('S11', 2.1) + 0.15 + j * 0.2, pan=0.15)

# ── SFX khớp hình
for k in range(3):                                   # khăn lau
    add(swish(), cue('S03', 0.5) + k * 2.73, 0.9, 0.2)
add(whoosh(0.9), cue('S03', 7.6), 0.8)                # khăn quét thành mask
add(whoosh(1.3) * 0.8, cue('S04', 3.0), 0.6, -0.5)    # xe chạy qua vũng nước
q = 'Pho in der Nähe'
for i in range(len(q)): add(click(), cue('S05', 0.7) + i * 1.6 / len(q), 0.7, 0.25)
for i in range(3): add(pop(), cue('S05', 2.5 + i * 0.18), 0.35, 0.2)
add(bell(392, 2.0) * 0.8, cue('S05', 6.4), 0.6)
msg = PJ['copy']['S06_msg']['value']
for i in range(0, len(msg), 2): add(click(), cue('S06', 0.7) + i * 1.7 / len(msg), 0.5, 0.15)
add(pop(), cue('S06', 2.7), 0.6)
for tc in (2.4, 5.4, 8.4): add(whoosh(0.7), cue('S07', tc) - 0.25, 0.55)
for i in range(5): add(click(), cue('S07', 3.0 + i * 0.4), 0.6, -0.2)
add(click(), cue('S07', 10.45), 1.0); add(pop(), cue('S07', 10.5), 0.5)
Nf = 13
for i in range(1, Nf + 1):                            # lịch xé
    tf = 0.8 + 5.8 * (0.5 - 0.5 * np.cos(np.pi * i / Nf))
    add(paper(), cue('S08', tf), 1.0, 0.25 * (-1) ** i)
tb = tt(0.25); add(np.sin(2 * np.pi * 180 * tb) * np.exp(-tb * 25) * 0.3 + bp_fast(rng.standard_normal(len(tb)), 300, 2000) * np.exp(-tb * 30) * 0.2, cue('S09', 1.1), 0.8)
add(pop(), cue('S11', 0.35), 0.8)
add(sub_hit(), cue("S11", 2.1), 0.55)

# ── reverb (IR nhiễu tắt dần) + master
def reverb(x, d=2.4, mix=0.22, seed=3):
    r = np.random.default_rng(seed); n = int(d * SR); ir = r.standard_normal(n) * np.exp(-np.arange(n) / SR * 3.0); ir[:int(0.012 * SR)] = 0
    ir = lp_fast(ir, 6000); ir /= np.sqrt(np.sum(ir ** 2))
    m = len(x) + n; F = 1 << int(np.ceil(np.log2(m)))
    y = np.fft.irfft(np.fft.rfft(x, F) * np.fft.rfft(ir, F), F)[:len(x)]
    return x + y * mix
L = reverb(L, seed=3); R = reverb(R, seed=4)
fade = np.minimum(1, (DUR - tr) / 1.2); L *= fade; R *= fade
pk = max(np.max(np.abs(L)), np.max(np.abs(R))); L /= pk / 0.89; R /= pk / 0.89
out = np.stack([L, R], 1)
with wave.open(os.path.join(HERE, 'mix.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype('<i2').tobytes())
print('ok', round(DUR, 2), 's')
