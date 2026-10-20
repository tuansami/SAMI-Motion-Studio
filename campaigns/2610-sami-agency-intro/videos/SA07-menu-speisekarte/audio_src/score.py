"""SA07 · nhạc + SFX tự tạo (numpy + scipy, tất định).
Indie-pop shuffle · 110 BPM (8 móc lệch kiểu triplet) · Sol trưởng (G – Em – C – D) · ukulele (Karplus-Strong) + glockenspiel + bass + vỗ tay + trống nhẹ.
Đoạn nỗi đau (S01–S03): ukulele bịt tiếng, Mi thứ trước, lọc thấp. S04 nghiền → cả ban nhạc bật. S11 nhịp thở. S12 outro + sub-hit logo.
Chạy:  python audio_src/score.py  → audio_src/mix.wav
       ffmpeg -y -i audio_src/mix.wav -af loudnorm=I=-14:TP=-1.2:LRA=9 -ar 44100 -b:a 192k public/audio/music.mp3
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
BEAT = 60 / 110
SW = 2 / 3  # vị trí móc lệch (shuffle)
rng = np.random.default_rng(707)
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
def uke(m, d=0.9, muted=False):
    """Karplus-Strong: dây nylon sáng, bịt tiếng = tắt nhanh + lọc tối"""
    f = hz(m); L = int(SR / f); n = int((0.18 if muted else d + 0.6) * SR)
    buf = filt(rng.uniform(-1, 1, L), 'low', 5000 if not muted else 1800)
    out = np.zeros(n); damp = 0.985 if muted else 0.9965
    for i in range(n):
        v = buf[i % L]; out[i] = v
        buf[i % L] = damp * 0.5 * (v + buf[(i + 1) % L])
    env = np.minimum(1, np.arange(n) / 30.0)
    if not muted: env *= np.clip((d + 0.5 - np.arange(n) / SR) / 0.5, 0, 1)
    return out * env * 0.32
def glock(m, d=1.4, vel=1.0):
    t = tt(d); f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.756 * t) * np.exp(-t * 7) + 0.15 * np.sin(2 * np.pi * f * 5.404 * t) * np.exp(-t * 14)
    return s * np.minimum(1, t / 0.002) * np.exp(-t * 2.6) * 0.12 * vel
def bass(m, d):
    t = tt(d + 0.1); f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t) + 0.08 * np.sin(6 * np.pi * f * t)
    return s * np.minimum(1, t / 0.006) * np.exp(-t * 2.2) * np.clip((d + 0.08 - t) / 0.08, 0, 1) * 0.30
def kick(g=1.0):
    t = tt(0.4); f = 48 + 110 * np.exp(-t * 32)
    return np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8)) * 0.7 * g
def clap():
    t = tt(0.3); n = filt(rng.standard_normal(len(t)), 'band', [900, 5000]); e = np.zeros(len(t))
    for o in (0, 0.011, 0.022): e += np.exp(-np.clip(t - o, 0, None) * 60) * (t >= o)
    e += 0.5 * np.exp(-t * 14)
    return n * e * 0.22
def shaker(g=1.0):
    t = tt(0.09); return filt(rng.standard_normal(len(t)), 'high', 6500) * np.sin(np.pi * t / 0.09) ** 2 * 0.07 * g
def tamb():
    t = tt(0.18); return filt(rng.standard_normal(len(t)), 'high', 8000) * np.exp(-t * 22) * 0.08


# ── SFX ────────────────────────────────────────────────────────────────
def whoosh(d=0.6, up=True):
    t = tt(d); n = rng.standard_normal(len(t)); f0, f1 = (500, 4200) if up else (4200, 500)
    out = np.zeros(len(t)); seg = 512
    for i in range(0, len(t), seg):
        u = i / len(t); fc = f0 + (f1 - f0) * u
        out[i:i + seg] = filt(n[i:i + seg], 'band', [fc * 0.6, min(fc * 1.6, 18000)], 1)
    return out * np.sin(np.pi * t / d) ** 2 * 0.22
def paper(d=1.9):
    t = tt(d); n = filt(rng.standard_normal(len(t)), 'band', [1500, 7000])
    am = 0.6 + 0.4 * np.sin(2 * np.pi * 23 * t) ** 2
    return n * am * np.minimum(1, t / 0.08) * np.clip((d - t) / 0.4, 0, 1) * 0.12
def stamp():
    t = tt(0.35); body = np.sin(2 * np.pi * (90 + 60 * np.exp(-t * 40)) * t) * np.exp(-t * 18)
    sl = filt(rng.standard_normal(len(t)), 'band', [600, 3500]) * np.exp(-t * 45)
    return (body * 0.6 + sl * 0.5) * 0.5
def pop(f=900):
    t = tt(0.14); return np.sin(2 * np.pi * np.cumsum(f * (1 + 1.2 * np.exp(-t * 60))) / SR) * np.exp(-t * 30) * 0.22
def click():
    t = tt(0.03); return filt(rng.standard_normal(len(t)), 'high', 3000) * np.exp(-t * 260) * 0.25
def tick(f=3200):
    t = tt(0.025); return np.sin(2 * np.pi * f * t) * np.exp(-t * 300) * 0.09
def crunch(d=0.7):
    t = tt(d); n = rng.standard_normal(len(t)); g = (rng.random(len(t)) > 0.985) * rng.uniform(0.4, 1, len(t))
    cr = filt(n * 0.25 + g * 2.2, 'band', [300, 6000]) * np.exp(-t * 4)
    low = np.sin(2 * np.pi * (60 + 40 * np.exp(-t * 20)) * t) * np.exp(-t * 9)
    return (cr * 0.5 + low * 0.7) * 0.6
def snap():
    t = tt(0.12); return (np.sin(2 * np.pi * 1350 * t) * 0.5 + np.sin(2 * np.pi * 2900 * t) * 0.3) * np.exp(-t * 55) * 0.2 + kick(0.25)[:len(t)]
def whirr(d=1.6):
    t = tt(d); n = filt(rng.standard_normal(len(t)), 'band', [200, 1600])
    am = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 14 * t))
    return n * am * np.minimum(1, t / 0.1) * np.clip((d - t) / 0.3, 0, 1) * 0.10
def flip():
    t = tt(0.25); return filt(rng.standard_normal(len(t)), 'band', [800, 5000]) * np.sin(np.pi * t / 0.25) ** 3 * 0.18
def subhit():
    t = tt(2.2); return np.sin(2 * np.pi * (44 + 30 * np.exp(-t * 6)) * t) * np.exp(-t * 1.6) * 0.75


# ── hoà âm & lưới ─────────────────────────────────────────────────────
VO = {'G': [62, 67, 71, 74], 'Em': [64, 67, 71, 76], 'C': [60, 64, 67, 72], 'D': [62, 66, 69, 74], 'Am': [60, 64, 69, 72]}
ROOT = {'G': 43, 'Em': 40, 'C': 36, 'D': 38, 'Am': 45}
PAIN = ['Em', 'C', 'G', 'D']
MAIN = ['G', 'Em', 'C', 'D']
BAR = 4 * BEAT
T_BAND = cue('S04', 3.2)        # cả ban nhạc bật khi chữ khớp vào lưới
T_PAIN_END = cue('S04', 0.8)    # máy ép: ngắt
T_BREAK = SC['S11']             # nhịp thở
T_STOP = cue('S11', 4.6)
T_OUT = SC['S12']


def strum(ch, t, up=False, muted=False, g=1.0, d=0.9):
    notes = VO[ch][::-1] if up else VO[ch]
    for k, m in enumerate(notes):
        add('music', uke(m, d, muted), t + k * 0.011, g * (0.75 if up else 1.0), pan=-0.25 + 0.12 * k)


# 1 · đoạn nỗi đau: ukulele bịt tiếng + kick nhẹ (0 → máy ép)
t = 0.15; b = 0
while t < T_PAIN_END - 0.05:
    ch = PAIN[(b // 4) % 4]
    for s in (0, SW):
        if t + s * BEAT < T_PAIN_END - 0.05: strum(ch, t + s * BEAT, up=s > 0, muted=True, g=0.8)
    if b % 2 == 0: add('drums', kick(0.6), t, 0.8)
    if b >= 8: add('drums', shaker(0.7), t + SW * BEAT, 1, 0.3)
    if b % 4 == 0: add('music', bass(ROOT[ch] + 12, BAR * 0.9), t, 0.45)
    t += BEAT; b += 1

# 2 · vào lại sau cú ép: glock "lấp lánh" khi chữ được hút (rising)
for i, m in enumerate([67, 71, 74, 79, 83, 86]):
    add('music', glock(m + 12, 1.2, 0.9), cue('S04', 3.2 + i * 0.14), pan=-0.4 + 0.16 * i)

# 3 · cả ban nhạc (T_BAND → nhịp thở)
t = T_BAND; b = 0
MEL = [79, 81, 83, 86, 83, 81, 79, 76, 74, 76, 79, 81, 83, 81, 79, 74]
while t < T_BREAK - 0.02:
    ch = MAIN[(b // 4) % 4]; bb = b % 4
    # ukulele: xuống trên phách, lên trên móc lệch, nhấn phách 2 & 4 nhẹ
    strum(ch, t, g=0.9 if bb % 2 == 0 else 0.75, d=0.45)
    strum(ch, t + SW * BEAT, up=True, g=0.6, d=0.3)
    # trống
    if bb in (0, 2): add('drums', kick(), t)
    if bb == 2 and (b // 4) % 2 == 1: add('drums', kick(0.6), t + SW * BEAT)
    if bb in (1, 3): add('drums', clap(), t, 1, 0.1)
    add('drums', shaker(), t + SW * BEAT, 1, 0.35); add('drums', shaker(0.6), t, 1, 0.35)
    if bb == 3: add('drums', tamb(), t + SW * BEAT, 1, -0.3)
    # bass: gốc phách 1, quãng 5 phách 3 (móc lệch)
    if bb == 0: add('music', bass(ROOT[ch], BEAT * 1.5), t, 1)
    if bb == 2: add('music', bass(ROOT[ch] + 7, BEAT * 0.6), t + SW * BEAT, 0.8)
    if bb == 3: add('music', bass(ROOT[ch] + 12, BEAT * 0.4), t + SW * BEAT, 0.6)
    # glock: giai điệu 2 nhịp một nốt, đoạn ×16 (S05–S09) chạy arpeggio 8 móc
    m = MEL[(b // 2) % len(MEL)]
    if b % 2 == 0: add('music', glock(m, 1.4), t, pan=0.3)
    if SC['S05'] <= t < SC['S10']:
        arp = VO[ch]
        add('music', glock(arp[bb] + 24, 0.5, 0.45), t + SW * BEAT, pan=0.5)
    t += BEAT; b += 1

# 4 · nhịp thở S11: chỉ ukulele ngân + glock, dừng hẳn trước end card
t = T_BREAK; i = 0
for ch in ['C', 'D', 'G']:
    if t >= T_STOP: break
    strum(ch, t, g=0.8, d=BAR * 0.9); add('music', glock(VO[ch][-1] + 12, 2.0, 0.8), t + BEAT, pan=0.3)
    add('music', bass(ROOT[ch], BAR * 0.8), t, 0.7)
    t += BAR * 0.75

# 5 · outro S12: hợp âm G ngân + glock rải, sub-hit ở logo
strum('G', cue('S12', 1.2), g=1.0, d=4.0)
add('music', bass(ROOT['G'], 4.0), cue('S12', 1.2), 0.9)
for i, m in enumerate([79, 83, 86, 91, 86, 91]):
    add('music', glock(m, 2.2, 0.8), cue('S12', 1.4 + i * 0.27), pan=-0.3 + 0.12 * i)
t = cue('S12', 2.9)
while t < DUR - 1.2:
    add('music', uke(VO['G'][(int(t * 10)) % 4] + 12, 0.6), t, 0.35, pan=0.2); t += BEAT * 2

# ── SFX khớp hình ─────────────────────────────────────────────────────
add('fx', paper(1.9), cue('S01', 0.1), 1)
add('fx', stamp(), cue('S01', 1.95), 1.1)
for x in (1.0, 2.1, 3.2, 4.3): add('fx', stamp(), cue('S02', x), 0.95, pan=0.2)
for x in (0.5, 0.95, 1.4, 1.85, 2.3): add('fx', pop(700 + 120 * int(x * 2)), cue('S03', x), 0.9, pan=-0.3 + 0.3 * x / 2.3)
add('fx', flip(), cue('S03', 3.0), 1)
add('fx', whoosh(0.5), cue('S04', 0.4), 0.8)
add('fx', crunch(), cue('S04', 0.78), 1.2)
for i in range(46): add('fx', tick(2400 + (i * 137) % 1800), cue('S04', 1.05 + i * 0.026), 0.8, pan=((i * 37) % 11 - 5) / 6)
for i in range(6): add('fx', snap(), cue('S04', 3.2 + i * 0.14), 1, pan=-0.4 + 0.16 * i)
for sc in ('S05', 'S06', 'S07', 'S08', 'S09', 'S10'): add('fx', whoosh(0.55), SC[sc] - 0.28, 0.7)
for x in (1.9, 4.2): add('fx', click(), cue('S05', x), 1)
for i in range(18): add('fx', tick(), cue('S05', 1.75 + i * 0.11), 0.9)
add('fx', click(), cue('S06', 3.0), 1); add('fx', stamp(), cue('S06', 4.0), 0.5); add('fx', pop(1200), cue('S06', 2.5), 0.6)
for i in range(12): add('fx', tick(3600), cue('S07', 1.0 + i * 0.11), 0.8)
for i in range(6): add('fx', stamp(), cue('S07', 2.9 + i * 0.16), 0.35)
add('fx', click(), cue('S07', 4.3), 1); add('fx', click(), cue('S07', 6.6), 1)
for i in range(3):
    add('fx', whirr(0.6), cue('S08', 0.5 + i * 0.35), 0.8); add('fx', whirr(0.6), cue('S08', 1.55 + i * 0.35), 0.8)
add('fx', click(), cue('S08', 4.2), 1); add('fx', stamp(), cue('S08', 4.4), 1)
for i, x in enumerate([0.5, 0.85, 1.2, 1.55, 1.9]): add('fx', whoosh(0.45), cue('S09', x), 0.55, pan=-0.5 + 0.25 * i)
for i, x in enumerate([1.0, 2.4, 3.8, 5.2]): add('fx', stamp(), cue('S10', x), 0.6); add('fx', pop(800 + 150 * i), cue('S10', x + 0.15), 0.7)
add('fx', whoosh(0.9), cue('S12', 0.1), 0.6)
add('fx', pop(1000), cue('S12', 1.25), 1.2)
add('fx', subhit(), cue('S12', 2.4), 1)

# ── mix ────────────────────────────────────────────────────────────────
tv = np.arange(N) / SR
mus = BUS['music'] + BUS['drums']
# đoạn nỗi đau tối hơn (lọc thấp), mở dần khi ban nhạc vào
dark = filt(mus, 'low', 1400)
w = np.clip((tv - (T_BAND - 0.3)) / 0.3, 0, 1)
mus = dark * (1 - w) + mus * w
mus *= np.where(tv < T_BAND, 0.85, 1.0)
mix = mus * 0.9 + BUS['fx'] * 1.0
mix *= np.clip((DUR - tv) / 1.5, 0, 1)
mix = np.tanh(mix * 1.2) / 1.2
mix /= max(1e-9, np.abs(mix).max()) / 0.89
out = os.path.join(HERE, 'mix.wav')
with wave.open(out, 'wb') as f:
    f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR)
    f.writeframes((mix.T * 32767).astype('<i2').tobytes())
print('ok', out, round(DUR, 2), 's')
