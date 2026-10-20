"""SA17 · nhạc + SFX tự tạo (numpy thuần, tất định).
Chill R&B 95 BPM, Si giáng trưởng: Rhodes FM + bass mềm + snap + kick/hat swing.
Ebmaj9 → Dm7 → Cm9 → F13 (IV–iii–ii–V), về Bbmaj9 ở end card.
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
rng = np.random.default_rng(1717)
L = np.zeros(N); R = np.zeros(N)
OFF = 8 / 30
def cue(scene, clip_t): return SC[scene] + clip_t - OFF
def at(t): return int(round(t * SR))
def tt(d): return np.arange(int(d * SR)) / SR
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def add(sig, t, gain=1.0, pan=0.0):
    i = at(t)
    if i >= N or i + len(sig) <= 0: return
    if i < 0: sig = sig[-i:]; i = 0
    s = sig[: N - i] * gain
    L[i:i + len(s)] += s * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(s)] += s * np.sqrt(0.5 * (1 + pan))
def lp_fast(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / (1 + (f / cutoff) ** 4), len(x))
def bp_fast(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * (1 / (1 + (f / hi) ** 4)) * (1 / (1 + (lo / np.maximum(f, 1)) ** 4)), len(x))

# ── nhạc cụ
def rhodes(m, d=2.0, vel=1.0):
    t = tt(d); f = hz(m)
    idx = (1.6 + 1.2 * vel) * np.exp(-t * 5)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
    s += 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3)
    s += 0.12 * np.sin(2 * np.pi * 14 * f * t) * np.exp(-t * 40)          # tine
    env = np.exp(-t * (0.9 + f / 1400)) * np.minimum(1, t / 0.003) * np.minimum(1, (d - t) / 0.2)
    return s * env * (1 + 0.18 * np.sin(2 * np.pi * 4.6 * t)) * 0.09 * vel
def bass(m, d=0.6):
    t = tt(d); f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) * np.exp(-t * 6)
    env = np.minimum(1, t / 0.01) * np.exp(-t * 1.2) * np.minimum(1, (d - t) / 0.06)
    return s * env * 0.32
def pad(ms, d, att=1.5):
    t = tt(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-0.08, 0.07):
            f = hz(m + det); ph = 2 * np.pi * f * t
            s += np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.1 * np.sin(3 * ph)
    env = np.minimum(1, t / att) * np.minimum(1, (d - t) / 1.0)
    return lp_fast(s, 2400) * env * 0.01
def kick(g=1.0):
    t = tt(0.45); f = 44 + 70 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5) * 0.85 * g
def snap():
    t = tt(0.18); n = bp_fast(rng.standard_normal(len(t)), 1400, 6000)
    e = np.exp(-t * 38) + 0.6 * np.exp(-np.maximum(t - 0.012, 0) * 45) * (t > 0.012)
    return n * e * 0.32
def hat(d=0.05, g=1.0):
    t = tt(d); n = np.diff(rng.standard_normal(len(t) + 1)); return n * np.exp(-t * 80) * 0.07 * g
def sub_hit():
    t = tt(2.2); f = 36 + 46 * np.exp(-t * 6)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6) * 1.0
def click(g=1.0):
    t = tt(0.025); return bp_fast(rng.standard_normal(len(t)), 1500, 9000) * np.exp(-t * 260) * 0.3 * g
def whoosh(d=0.8):
    t = tt(d); n = rng.standard_normal(len(t)); env = np.sin(np.pi * t / d) ** 2
    return lp_fast(n, 2500) * env * 0.35
def swish(d=0.5):
    t = tt(d); return bp_fast(rng.standard_normal(len(t)), 900, 5000) * np.sin(np.pi * t / d) ** 3 * 0.25
def crayon(d=0.6):
    t = tt(d); n = bp_fast(rng.standard_normal(len(t)), 1800, 7000)
    am = 0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 7 * t)) ** 0.5
    return n * am * np.sin(np.pi * t / d) ** 0.6 * 0.16
def plink(f=1400):
    t = tt(0.25); fr = f * (1 + 0.6 * np.exp(-t * 30))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 18) * 0.22
def splash():
    t = tt(1.0); n = bp_fast(rng.standard_normal(len(t)), 300, 6000) * np.exp(-t * 6) * 0.45
    for k in range(8):
        add_t = 0.05 + 0.08 * k
        n[at(add_t):at(add_t) + at(0.25)] += plink(700 + 140 * k)[:len(n[at(add_t):at(add_t) + at(0.25)])] * 0.5
    return n
def pop(g=1.0):
    t = tt(0.18); f = 500 + 900 * np.exp(-t * 40); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22) * 0.4 * g
def tap():
    t = tt(0.12); return (np.sin(2 * np.pi * 140 * t) * np.exp(-t * 40) * 0.4 + bp_fast(rng.standard_normal(len(t)), 800, 5000) * np.exp(-t * 90) * 0.25)
def chime():
    t = tt(1.6); s = np.zeros(len(t))
    for m, d0 in ((82, 0), (86, 0.09), (89, 0.18)):
        tt0 = np.maximum(t - d0, 0); s += np.sin(2 * np.pi * hz(m) * tt0) * np.exp(-tt0 * 3) * (t >= d0)
    return s * 0.12
def shutter():
    return np.concatenate([click(1.4), np.zeros(at(0.06)), click(1.0)])
def hum(d):
    t = tt(d); s = np.sin(2 * np.pi * 100 * t) + 0.4 * np.sin(2 * np.pi * 200 * t) + 0.2 * np.sin(2 * np.pi * 300 * t)
    return s * np.minimum(1, t / 0.2) * np.minimum(1, (d - t) / 0.4) * 0.018

# ── lưới nhịp 95 BPM
B = 60 / 95; BAR = 4 * B
# Ebmaj9, Dm7, Cm9, F13 (voicing Rhodes, MIDI) + bass gốc
CH = [([63, 67, 70, 74, 77], 39), ([62, 65, 69, 72, 76], 38), ([60, 63, 67, 70, 74], 36), ([60, 63, 65, 69, 74], 41)]
FINAL = ([58, 62, 65, 69, 72, 77], 34)                                # Bbmaj9
MEL = [77, 79, 74, None, 72, 74, 70, None, 74, 72, 67, 69, 72, None, 70, 69]
tr = np.arange(N) / SR
def sec(t):
    """độ dày phối theo cảnh"""
    if t < SC['S02']: return 'intro'
    if t < SC['S03']: return 'kick'
    if t < SC['S04']: return 'bass'
    if t < SC['S05'] - 0.2: return 'filt'
    if t < SC['S07']: return 'full'
    if t < SC['S08']: return 'light'
    if t < SC['S09']: return 'full'
    if t < SC['S10']: return 'breath'
    return 'end'
nb = int((SC['S10'] - 0.05) / BAR) + 1
music = [np.zeros(N), np.zeros(N)]
for bar in range(nb):
    t0 = bar * BAR
    if t0 >= SC['S10']: break
    ch, root = CH[bar % 4]
    s = sec(t0 + 0.01)
    # Rhodes: hợp âm trên phách 1 và "và của 2" (đẩy nhẹ), kiểu R&B
    for j, m in enumerate(ch):
        add(rhodes(m, BAR * 0.62, 0.8), t0 + j * 0.012, 0.9 if s != 'filt' else 0.6, -0.25 + 0.12 * j)
    for j, m in enumerate(ch[1:4]):
        add(rhodes(m + 12 if s in ('full',) else m, BAR * 0.4, 0.55), t0 + 2.5 * B + j * 0.01, 0.6, 0.2)
    if s in ('full', 'light', 'end'):
        for j in range(2):
            m = MEL[(bar * 2 + j) % len(MEL)]
            if m: add(rhodes(m, 1.4, 1.0), t0 + (j * 2 + 0.5) * B * (1 if j == 0 else 0.95), 0.75, 0.3)
    if s in ('bass', 'full', 'light', 'end'):
        for bt, m in ((0, root), (1.5, root), (2.5, root + 7), (3.5, root + 12 if bar % 2 else root)):
            add(bass(m, B * 0.9), t0 + bt * B, 1.0 if s != 'light' else 0.8)
    if s in ('bass', 'full', 'light', 'breath', 'end'):
        add(pad([m - 12 for m in ch[:3]], BAR + 0.6, 0.8), t0, 1.0 if s != 'breath' else 1.6)
    if s in ('kick', 'bass', 'full', 'light'):
        add(kick(0.75 if s == 'kick' else 1.0), t0); add(kick(0.7), t0 + 2.5 * B)
    if s in ('full', 'light', 'bass'):
        add(snap(), t0 + B, 0.9, 0.1); add(snap(), t0 + 3 * B, 0.9, 0.1)
    if s == 'full':
        for k in range(8):
            sw = 0.09 * B if k % 2 else 0
            add(hat(0.05, 1.0 if k % 2 == 0 else 0.6), t0 + k * B / 2 + sw, 0.9, 0.35)
    if s == 'full' and SC['S06'] <= t0 < SC['S07']:                 # arpeggio "tua nhanh"
        for k in range(16): add(rhodes(ch[k % 5] + 12, 0.4, 0.4), t0 + k * B / 4, 0.4, -0.3 + 0.04 * k)
# S04: lọc tối (phòng tối) → riser vào S05
a, b = at(SC['S04']), at(SC['S05'] - 0.2)
L[a:b] = lp_fast(L[a:b], 700); R[a:b] = lp_fast(R[a:b], 700)
rs = tt(1.8); add(lp_fast(rng.standard_normal(len(rs)), 4000) * (rs / 1.8) ** 2.5 * 0.22, SC['S05'] - 1.8)
# end card: Bbmaj9 ngân + groove nhẹ
te = SC['S10']
for j, m in enumerate(FINAL[0]): add(rhodes(m, 5.5, 0.9), te + 0.15 + j * 0.09, 0.9, -0.3 + 0.1 * j)
add(bass(FINAL[1], 3.0), te + 0.15, 1.0); add(pad([58, 62, 65, 69], DUR - te, 1.2), te, 1.6)
for k in range(int((DUR - te - 2.2) / BAR) + 1):
    t0 = te + 2.1 + k * BAR
    add(kick(0.6), t0); add(snap(), t0 + B, 0.6); add(snap(), t0 + 3 * B, 0.6)
    for j, m in enumerate(FINAL[0][1:4]): add(rhodes(m + 12, 1.5, 0.5), t0 + 2.5 * B + j * 0.01, 0.5, 0.2)
# vinyl crackle nhẹ suốt bài
cr = np.zeros(N)
for i in range(int(DUR * 14)):
    p = int(rng.uniform(0, N - 300)); cr[p:p + 60] += rng.standard_normal(60) * np.exp(-np.arange(60) / 10) * rng.uniform(0.1, 1)
cr = bp_fast(cr, 1500, 9000) * 0.05 + bp_fast(rng.standard_normal(N), 200, 3000) * 0.004
L += cr; R += np.roll(cr, 211)

# ── SFX khớp hình
add(whoosh(1.1), cue('S01', 0.6), 0.7)
q = PJ['copy']['S01_q']['value']
for i in range(len(q)): add(click(0.5), cue('S01', 0.0) + i * 1.3 / len(q), 0.6, 0.25)
add(swish(0.6), cue('S01', 1.85), 1.0, 0.2)
for tc in (0.9, 2.9, 4.9): add(crayon(), cue('S02', tc), 1.0, 0.25)
for tc in (0.3, 2.3, 4.3): add(click(0.4), cue('S02', tc), 0.6, -0.2)
add(whoosh(1.6) * 0.7, cue('S03', 0.3), 0.6)
add(whoosh(1.2), cue('S03', 6.8), 0.9)
add(click(1.6), cue('S04', 0.55), 1.0); add(click(1.0), cue('S04', 0.7), 0.7)
add(hum(cue('S05', 0) - cue('S04', 0.6)), cue('S04', 0.6), 1.0)
for k in range(3): add(plink(1300), cue('S04', 0.9 + 0.55 + 1.6 * k), 0.8, 0.2)
add(splash(), cue('S05', 2.3), 0.9)
add(click(0.8), cue('S05', 8.6), 1.0)                                  # kẹp
for i in range(7): add(plink(1100 + 90 * i), cue('S05', 9.4 + i * 0.32 + 0.55), 0.6, -0.2 + 0.07 * i)
add(whoosh(1.2), cue('S05', 11.0), 0.8, 0.1)
add(shutter(), cue('S05', 12.25), 1.0)
for i in range(6):
    add(tap(), cue('S06', 1.6 + 1.2 * i + 0.4), 0.9, -0.2 + 0.08 * i)
    add(pop(0.6), cue('S06', 1.6 + 1.2 * i + 0.5), 0.5)
rep = PJ['copy']['S07_reply']['value']
for i in range(0, len(rep), 2): add(click(0.45), cue('S07', 1.4) + i * 4.2 / len(rep), 0.7, 0.15)
add(click(1.2), cue('S07', 6.4), 1.0); add(pop(), cue('S07', 6.5), 0.6)
for tc in (1.5, 2.3, 3.1): add(click(0.9), cue('S08', tc), 0.8)
add(tap(), cue('S08', 4.15), 1.0); add(chime(), cue('S08', 4.3), 1.0)
add(click(1.3), cue('S09', 0.5), 0.7); add(hum(0.6) * 2, cue('S09', 0.3), 0.6)
add(pop(), cue('S10', 0.35), 0.8)
add(sub_hit(), cue('S10', 2.1), 0.55)

# ── reverb + master
def reverb(x, d=2.2, mix=0.2, seed=3):
    r = np.random.default_rng(seed); n = int(d * SR); ir = r.standard_normal(n) * np.exp(-np.arange(n) / SR * 3.2); ir[:int(0.012 * SR)] = 0
    ir = lp_fast(ir, 5500); ir /= np.sqrt(np.sum(ir ** 2))
    m = len(x) + n; F = 1 << int(np.ceil(np.log2(m)))
    y = np.fft.irfft(np.fft.rfft(x, F) * np.fft.rfft(ir, F), F)[:len(x)]
    return x + y * mix
L = reverb(L, seed=3); R = reverb(R, seed=4)
fin = np.minimum(1, tr / 0.05); fade = np.minimum(1, (DUR - tr) / 1.4); L *= fade * fin; R *= fade * fin
pk = max(np.max(np.abs(L)), np.max(np.abs(R))); L /= pk / 0.89; R /= pk / 0.89
out = np.stack([L, R], 1)
with wave.open(os.path.join(HERE, 'mix.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype('<i2').tobytes())
print('ok', round(DUR, 2), 's')
