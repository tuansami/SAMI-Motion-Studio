#!/usr/bin/env python3
"""Nhạc nền tự tổng hợp cho mẫu "SAMI Agency Intro" (numpy, không bản quyền, tất định).

120 BPM, La thứ, vòng hợp âm Am | F | C | G (mỗi ô nhịp 2 s), nhịp đầu ở 0,03 s (lưới của Studio: nhịp n = 1 + 15n khung).
Bố cục bám điểm cắt cảnh (tính bằng nhịp, 1 nhịp = 0,5 s):
  0-9    S01 hook Google Maps: pad lọc tối, hi-hat, riser     9   DROP 1 (S02 logo): impact + stab
  15-22  S03 8 dịch vụ: groove đầy đủ                         22  S04-S05 tua nhanh: thêm arpeggio 1/16 + tiếng tick
  52-74  S06-S07 website, đặt bàn: groove + giai điệu pluck    74  S08-S09 maps, social: đỉnh năng lượng
  93-101 S10 dự án thật: breakdown, riser + trống dồn          101 DROP 2 (S11 offer)
  111    S12 FINAL HIT: impact + hợp âm ngân, tắt dần tới 120 (60,03 s)

Chạy:  python make_music.py [out.wav] [--mp3 out.mp3]   (cần numpy; mp3 cần ffmpeg trên PATH)
Bản chữ dài (cảnh được giữ thêm nhịp): --beats <tổng nhịp> --marks DROP1,S03,LAPSE,S06,PEAK,BREAK,DROP2,FINAL
  (nhịp bắt đầu của S02,S03,S04,S06,S08,S10,S11,S12; tools/build-lang.mjs in sẵn lệnh này).
"""
import math
import subprocess
import sys
import wave

import numpy as np

SR = 44100
BEAT = 0.5
T0 = 0.03            # nhịp đầu tiên
BEATS = 120
# ── mốc (nhịp) ──
DROP1, S03, LAPSE, S06, PEAK, BREAK, DROP2, FINAL = 9, 15, 22, 52, 74, 93, 101, 111
if '--beats' in sys.argv:
    BEATS = int(sys.argv[sys.argv.index('--beats') + 1])
if '--marks' in sys.argv:
    DROP1, S03, LAPSE, S06, PEAK, BREAK, DROP2, FINAL = (int(x) for x in sys.argv[sys.argv.index('--marks') + 1].split(','))
DUR = T0 + BEATS * BEAT
N = int(round(DUR * SR))
TAU = 2 * math.pi
rng = np.random.default_rng(20261019)


def tb(beat):
    return T0 + beat * BEAT


def idx(t):
    return int(round(t * SR))


def tax(d):
    return np.arange(int(d * SR)) / SR


def fft_filter(x, lo=None, hi=None, slope=6.0):
    """lọc tần số bằng FFT (không pha), lo = cắt dưới, hi = cắt trên (Hz), sườn mềm"""
    n = len(x)
    if n < 8:
        return x
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if hi:
        g /= np.sqrt(1 + (f / hi) ** (2 * slope / 6))
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * slope / 6))
    return np.fft.irfft(X * g, n)


def env(n, a, d, curve=4.0):
    e = np.ones(n)
    na = max(1, min(n, int(a * SR)))
    e[:na] = np.linspace(0, 1, na, endpoint=False)
    rest = n - na
    if rest > 0:
        e[na:] = np.exp(-curve * np.arange(rest) / max(1, d * SR))
    return e


def saw(freq, d, harm_max=9000, detune=0.0, phase=0.0):
    t = tax(d)
    out = np.zeros_like(t)
    f = freq * (1 + detune)
    k = 1
    while k * f < harm_max and k < 60:
        out += ((-1) ** (k + 1)) * np.sin(TAU * k * f * t + phase * k) / k
        k += 1
    return out * (2 / math.pi)


def note(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# hợp âm (MIDI) theo ô nhịp: Am | F | C | G
CH = [
    {'root': 45, 'pad': [57, 60, 64, 67], 'arp': [57, 60, 64, 69, 72, 76]},   # Am7
    {'root': 41, 'pad': [53, 57, 60, 64], 'arp': [53, 57, 60, 65, 69, 72]},   # Fmaj7
    {'root': 48, 'pad': [55, 60, 64, 71], 'arp': [60, 64, 67, 72, 76, 79]},   # Cmaj7
    {'root': 43, 'pad': [55, 59, 62, 69], 'arp': [55, 59, 62, 67, 71, 74]},   # Gadd9
]


def chord_at(beat):
    return CH[int(beat // 4) % 4]


# ── buses ──
L = np.zeros(N + SR * 4)
R = np.zeros_like(L)
REV = np.zeros_like(L)          # gửi vào reverb (mono)
DUCK = np.ones_like(L)          # sidechain theo kick


def put(sig, t, gain=1.0, pan=0.0, rev=0.0):
    i = idx(t)
    if i >= len(L):
        return
    j = min(len(L), i + len(sig))
    s = sig[: j - i] * gain
    gl, gr = math.cos((pan + 1) * math.pi / 4) * math.sqrt(2), math.sin((pan + 1) * math.pi / 4) * math.sqrt(2)
    L[i:j] += s * gl
    R[i:j] += s * gr
    if rev:
        REV[i:j] += s * rev


DUCKED_L = np.zeros_like(L)
DUCKED_R = np.zeros_like(L)


def put_duck(sig, t, gain=1.0, pan=0.0, rev=0.0):
    i = idx(t)
    j = min(len(L), i + len(sig))
    s = sig[: j - i] * gain
    gl, gr = math.cos((pan + 1) * math.pi / 4) * math.sqrt(2), math.sin((pan + 1) * math.pi / 4) * math.sqrt(2)
    DUCKED_L[i:j] += s * gl
    DUCKED_R[i:j] += s * gr
    if rev:
        REV[i:j] += s * rev


# ── nhạc cụ ──
def kick(strength=1.0):
    t = tax(0.42)
    f = 46 + 120 * np.exp(-t * 30)
    body = np.sin(TAU * np.cumsum(f) / SR) * env(len(t), 0.001, 0.2, 3.5)
    click = fft_filter(rng.standard_normal(len(t)), lo=2000) * env(len(t), 0.0005, 0.006, 6) * 0.25
    return (body + click) * strength


def clap():
    n = int(0.3 * SR)
    s = np.zeros(n)
    for k, off in enumerate((0, 0.009, 0.019, 0.03)):
        i = int(off * SR)
        b = rng.standard_normal(n - i) * env(n - i, 0.0005, 0.012 if k < 3 else 0.14, 5)
        s[i:] += b
    return fft_filter(s, lo=900, hi=6500) * 0.9


def hat(open_=False):
    n = int((0.3 if open_ else 0.06) * SR)
    return fft_filter(rng.standard_normal(n), lo=7000) * env(n, 0.0005, 0.12 if open_ else 0.018, 5)


def tick():
    t = tax(0.05)
    return np.sin(TAU * 2600 * t) * env(len(t), 0.0002, 0.012, 6)


def bass(m, d):
    f = note(m)
    s = saw(f, d, harm_max=1600) * 0.6 + np.sin(TAU * f * tax(d)) * 0.7
    return s * env(int(d * SR), 0.004, d * 0.9, 1.6)


def pluck(m, d=0.32, bright=1.0):
    f = note(m)
    t = tax(d)
    s = np.zeros_like(t)
    for k in range(1, 12):
        if k * f > 12000:
            break
        s += np.sin(TAU * k * f * t) / k * np.exp(-t * (6 + k * 5 / bright))
    return s * env(len(t), 0.002, d, 1.2)


def bell(m, d=1.6):
    f = note(m)
    t = tax(d)
    s = np.sin(TAU * f * t) * np.exp(-t * 2.2) + 0.5 * np.sin(TAU * f * 2.76 * t) * np.exp(-t * 4) + 0.25 * np.sin(TAU * f * 5.4 * t) * np.exp(-t * 7)
    return s * env(len(t), 0.003, d, 0.5)


def pad_chord(ms, d, bright):
    s = np.zeros(int(d * SR))
    for i, m in enumerate(ms):
        for dt in (-0.006, 0.0, 0.007):
            s += saw(note(m), d, harm_max=bright * 2.2, detune=dt, phase=i * 0.7 + dt * 300)
    s = fft_filter(s, hi=bright)
    e = np.minimum(1, tax(d) / 0.25) * np.minimum(1, (d - tax(d)) / 0.2).clip(0)
    return s * e / len(ms)


def impact(d=2.5):
    t = tax(d)
    boom = np.sin(TAU * np.cumsum(30 + 60 * np.exp(-t * 7)) / SR) * np.exp(-t * 1.6)
    nz = fft_filter(rng.standard_normal(len(t)), hi=2500) * np.exp(-t * 9) * 0.6
    return boom + nz


def riser(d):
    t = tax(d)
    p = t / d
    sweep = np.sin(TAU * np.cumsum(180 * 2 ** (p * 3)) / SR) * 0.25
    nlo = fft_filter(rng.standard_normal(len(t)), lo=300, hi=2500)
    nhi = fft_filter(rng.standard_normal(len(t)), lo=3000, hi=12000)
    return (sweep + nlo * (1 - p) * 0.5 + nhi * p * 0.7) * p ** 2.2


def reverse_cym(d=1.0):
    t = tax(d)
    return fft_filter(rng.standard_normal(len(t)), lo=5000) * (t / d) ** 3


def snare_roll(b0, b1, gain=0.5):
    """trống dồn: nhặt dần từ 1/8 → 1/32 trong khoảng [b0, b1)"""
    t = tb(b0)
    end = tb(b1)
    c = clap()
    k = 0
    while t < end - 1e-6:
        p = (t - tb(b0)) / (end - tb(b0))
        step = BEAT / 2 if p < 0.4 else BEAT / 4 if p < 0.75 else BEAT / 8
        put(c[: int(0.12 * SR)], t, gain * (0.4 + 0.6 * p), pan=(k % 2 - 0.5) * 0.3, rev=0.15)
        t += step
        k += 1


# ── sắp xếp ──
def sec(beat):
    if beat < DROP1:
        return 'intro'
    if beat < S03:
        return 'reveal'
    if beat < LAPSE:
        return 'groove'
    if beat < S06:
        return 'lapse'
    if beat < PEAK:
        return 'groove2'
    if beat < BREAK:
        return 'peak'
    if beat < DROP2:
        return 'break'
    if beat < FINAL:
        return 'drop2'
    return 'final'


K = kick()
Cl = clap()
HC, HO = hat(), hat(True)
TK = tick()
drums = {'reveal', 'groove', 'lapse', 'groove2', 'peak', 'drop2'}

for s16 in range(BEATS * 4):
    beat = s16 / 4
    t = tb(beat)
    q = s16 % 16          # vị trí trong ô nhịp (16 nốt móc kép)
    sc = sec(beat)
    if sc in drums:
        if s16 % 4 == 0:
            if not (sc == 'reveal' and beat < DROP1 + 1):
                put(K, t, 0.95)
                i = idx(t)
                dl = np.concatenate([np.linspace(1, 0.35, int(0.03 * SR)), np.linspace(0.35, 1, int(0.32 * SR))])
                j = min(len(DUCK), i + len(dl))
                DUCK[i:j] = np.minimum(DUCK[i:j], dl[: j - i])
        if sc != 'reveal' and q in (4, 12):
            put(Cl, t, 0.55, pan=0.05, rev=0.12)
        hv = 0.16 if q % 2 else 0.24
        if sc == 'reveal':
            hv *= 0.5
        put(HC, t, hv, pan=0.25 if q % 4 == 1 else -0.2)
        if q % 4 == 2 and sc in ('groove', 'groove2', 'peak', 'drop2'):
            put(HO, t, 0.13 if sc != 'peak' else 0.18, pan=-0.3)
        if sc == 'peak' and q % 2 == 1:
            put(hat(), t, 0.1, pan=0.5)                      # shaker thêm
    elif sc == 'intro':
        if s16 % 2 == 0:
            put(HC, t, 0.05 + 0.1 * beat / DROP1, pan=0.2 if q % 4 else -0.2)
        if s16 % 4 == 0 and beat >= 3:
            put(kick(0.45), t, 0.6)                          # nhịp tim
    elif sc == 'break':
        if s16 % 2 == 0:
            put(HC, t, 0.08, pan=0.3)
    # tick tua nhanh (chương thiết kế)
    if sc == 'lapse' and s16 % 2 == 0:
        put(TK, t, 0.09 if q % 4 else 0.14, pan=0.6 if q % 4 else -0.6)

# bass: 1/8, nốt gốc + quãng tám, có nghỉ
for e8 in range(BEATS * 2):
    beat = e8 / 2
    sc = sec(beat)
    if sc in ('intro', 'final', 'break'):
        continue
    if sc == 'reveal' and beat < DROP1 + 1:
        continue
    c = chord_at(beat)
    m = c['root'] + (12 if (sc == 'peak' and e8 % 4 == 3) else 0)
    if e8 % 8 == 6 and sc != 'peak':
        m += 7
    put_duck(bass(m, 0.42), tb(beat), 0.55)

# sub drone ở intro + breakdown
for b0, b1, g in ((0, DROP1, 0.2), (BREAK, DROP2, 0.2)):
    d = (b1 - b0) * BEAT
    t = tax(d)
    f = note(33)
    put(np.sin(TAU * f * t) * np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.1).clip(0), tb(b0), g)

# pad theo ô nhịp: tối ở intro, mở dần; breakdown sáng + reverb nhiều
for bar in range(BEATS // 4 + 1):
    beat = bar * 4
    if beat >= FINAL:
        break
    sc = sec(beat)
    c = CH[bar % 4]
    d = 4 * BEAT + 0.15
    bright = {'intro': 500 + 200 * bar, 'reveal': 1800, 'break': 3200}.get(sc, 2400)
    g = {'intro': 0.17, 'break': 0.26, 'reveal': 0.3}.get(sc, 0.22)
    sig = pad_chord(c['pad'], d, bright)
    if sc in ('intro', 'break'):
        put(sig, tb(beat), g, rev=0.35)
    else:
        put_duck(sig, tb(beat), g, rev=0.2)

# arpeggio 1/16 (chương tua nhanh) + giai điệu pluck (groove2, drop2)
for s16 in range(BEATS * 4):
    beat = s16 / 4
    sc = sec(beat)
    c = chord_at(beat)
    if sc in ('lapse', 'drop2', 'peak'):
        a = c['arp'][(s16 * 5) % len(c['arp'])] + (12 if (s16 // 8) % 2 else 0)
        put_duck(pluck(a, 0.22, 1.4), tb(beat), 0.12 if sc != 'lapse' else 0.15, pan=0.35 if s16 % 2 else -0.35, rev=0.12)
    if sc in ('groove2', 'drop2') and s16 % 16 in (0, 3, 6, 10, 12):
        a = c['arp'][(s16 // 2) % len(c['arp'])] + 12
        put_duck(pluck(a, 0.4, 1.0), tb(beat), 0.16, pan=0.1, rev=0.2)
    if sc == 'break' and s16 % 4 == 0:
        put(bell(c['arp'][(s16 // 4) % len(c['arp'])] + 12, 1.4), tb(beat), 0.09, pan=0.2 if s16 % 8 else -0.2, rev=0.45)

# stab ở các cú drop
for b in (DROP1, DROP2):
    c = chord_at(b)
    st = pad_chord(c['pad'] + [c['pad'][0] + 12], 0.6, 5000) * env(int(0.6 * SR), 0.002, 0.35, 2.5)
    put(st, tb(b), 0.55, rev=0.4)

# FX: riser + reverse cymbal trước drop, impact ở drop, trống dồn trước drop 2
for b, d in ((DROP1, 1.8), (DROP2, 2.0)):
    put(riser(d), tb(b) - d, 0.5, rev=0.2)
    put(reverse_cym(0.9), tb(b) - 0.9, 0.35)
    put(impact(2.2), tb(b), 1.0, rev=0.35)
snare_roll(DROP2 - 2, DROP2, 0.45)
# chuyển chương nhẹ: cymbal ngược trước S04, S06, S08
for b in (LAPSE, S06, PEAK):
    put(reverse_cym(0.6), tb(b) - 0.6, 0.18)

# FINAL HIT: impact + hợp âm Am(add9) ngân dài, tắt dần
put(impact(3.5), tb(FINAL), 0.9, rev=0.5)
fin = pad_chord([57, 60, 64, 71, 76], 4.6, 3600)
fin *= np.exp(-tax(4.6) * 0.55)
put(fin, tb(FINAL), 0.55, rev=0.6)
put(bell(81, 3.5), tb(FINAL), 0.18, rev=0.6)
put(bell(76, 3.5), tb(FINAL) + 0.25, 0.12, pan=0.3, rev=0.6)

# ── trộn: sidechain, reverb, master ──
L += DUCKED_L * DUCK
R += DUCKED_R * DUCK
# reverb: IR nhiễu tắt dần (2,6 s), lọc tối, hai kênh khác nhau
ir_n = int(2.6 * SR)
tt = np.arange(ir_n) / SR
irs = []
for ch in range(2):
    ir = rng.standard_normal(ir_n) * np.exp(-tt * 2.4)
    ir = fft_filter(ir, lo=200, hi=5500)
    ir[: int(0.012 * SR)] = 0
    irs.append(ir / np.sqrt(np.sum(ir ** 2)))
nfft = 1 << int(math.ceil(math.log2(len(REV) + ir_n)))
RV = np.fft.rfft(REV, nfft)
for ch, out in enumerate((L, R)):
    wet = np.fft.irfft(RV * np.fft.rfft(irs[ch], nfft), nfft)[: len(out)]
    out += wet * 0.55

# tắt dần cuối bài, cắt đúng độ dài
L, R = L[:N], R[:N]
fade = int(1.4 * SR)
fl = np.ones(N)
fl[-fade:] = np.linspace(1, 0, fade) ** 1.5
L *= fl
R *= fl
# master: lọc DC/sub < 28 Hz, chuẩn hoá RMS, soft clip
L, R = fft_filter(L, lo=28), fft_filter(R, lo=28)
rms = math.sqrt(float(np.mean(L ** 2 + R ** 2) / 2))
g = 10 ** (-15 / 20) / max(rms, 1e-9)
L, R = np.tanh(L * g * 1.1) / np.tanh(1.1), np.tanh(R * g * 1.1) / np.tanh(1.1)
pk = max(np.max(np.abs(L)), np.max(np.abs(R)))
if pk > 0.95:
    L, R = L * 0.95 / pk, R * 0.95 / pk

out = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'sami-intro-120.wav'
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.stack([L, R], 1) * 32767).astype('<i2').tobytes())
print(f'{out}: {DUR:.2f} s, {SR} Hz')
if '--mp3' in sys.argv:
    mp3 = sys.argv[sys.argv.index('--mp3') + 1]
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', out, '-codec:a', 'libmp3lame', '-b:a', '192k', mp3], check=True)
    print(mp3)
