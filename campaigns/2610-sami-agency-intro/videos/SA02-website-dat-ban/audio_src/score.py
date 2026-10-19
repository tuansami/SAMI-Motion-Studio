"""SA02 · nhạc + SFX tự tạo (numpy, không sample ngoài): future-funk Fa trưởng, lưới 120 BPM (khớp lưới cắt của Studio).
Rhodes FM, bass slap tổng hợp, trống tổng hợp, tiếng click chuột làm bộ gõ, phanh băng (tape-stop) ở cú phanh S05.
Chạy:  python audio_src/score.py  →  public/audio/music.wav (+ .mp3 nếu có ffmpeg)
Mốc thời gian lấy từ project.json (đầu cảnh) + nhịp trong cảnh (SAMI.beat(n) = đầu cảnh + 0,5 n giây).
"""
import json, os, subprocess
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

HERE = os.path.dirname(os.path.abspath(__file__)); PROJ = os.path.dirname(HERE)
SR = 48000; BEAT = 0.5; OFF = 1 / 30
rng = np.random.default_rng(2602)
P = json.load(open(os.path.join(PROJ, 'project.json'), encoding='utf-8'))
SC = {s['id']: s['start'] / 30 for s in P['scenes']}
END = P['scenes'][-1]['end'] / 30
N = int((END + 0.2) * SR)
def at(scene, beat=0.0): return SC[scene] + beat * BEAT           # SAMI.beat(n) tuyệt đối
def clip(scene, t): return SC[scene] - 8 / 30 + t                  # thời gian clip HTML → tuyệt đối
def bar(b): return OFF + b * 4 * BEAT

# ── công cụ ──
def T(d): return np.arange(int(d * SR)) / SR
def lp(x, f, o=2): return sosfilt(butter(o, min(f, SR / 2 - 100), 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def hz(m): return 440 * 2 ** ((m - 69) / 12)
NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def mid(n): return 12 * (int(n[-1]) + 1) + NOTE[n[0]] + (1 if '#' in n else -1 if 'b' in n[1:] else 0)
def add(buf, x, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= len(buf) or i + len(x) <= 0: return
    if i < 0: x = x[-i:]; i = 0
    x = x[:len(buf) - i]
    if x.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        buf[i:i + len(x), 0] += x * g * l * 1.414; buf[i:i + len(x), 1] += x * g * r * 1.414
    else: buf[i:i + len(x)] += x * g
def env(d, a=0.005, dec=0.3, sus=0.0, rel=0.05):
    t = T(d); e = np.minimum(1, t / max(a, 1e-4)) * (sus + (1 - sus) * np.exp(-np.maximum(0, t - a) / dec))
    r = int(rel * SR); e[-r:] *= np.linspace(1, 0, min(r, len(e)))
    return e

# ── nhạc cụ ──
def rhodes(m, d, v=0.7):
    f = hz(m); t = T(d + 0.6)
    idx = 2.2 * v * np.exp(-t / 0.35) + 0.4
    x = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
    tine = 0.25 * v * np.sin(2 * np.pi * f * 14 * t) * np.exp(-t / 0.03)
    bell = 0.12 * np.sin(2 * np.pi * f * 3.98 * t) * np.exp(-t / 0.25)
    e = np.exp(-t / (1.6 if m < 64 else 1.1)) * np.minimum(1, t / 0.003)
    e *= np.where(t > d, np.exp(-(t - d) / 0.12), 1)
    trem = 1 + 0.12 * np.sin(2 * np.pi * 4.6 * t)
    return (x + tine + bell) * e * trem * v
def chord(buf, ms, t, d, v=0.55, pan=0.0, g=1.0):
    for k, m in enumerate(ms): add(buf, rhodes(m, d, v * (0.9 if k else 1)), t + k * 0.008, g * 0.32, pan + (k - len(ms) / 2) * 0.12)
def slap(m, d, v=0.8, pop=False):
    f = hz(m); t = T(d + 0.08)
    ph = 2 * np.pi * f * t
    raw = 0.6 * np.sin(ph) + 0.35 * (2 * ((f * t) % 1) - 1) + 0.25 * np.sin(2 * ph)
    cut = 300 + (4200 if pop else 2600) * np.exp(-t / 0.06)
    y = np.zeros_like(raw); s = 0.0
    a = np.exp(-2 * np.pi * cut / SR)
    for i in range(len(raw)): s = a[i] * s + (1 - a[i]) * raw[i]; y[i] = s
    e = np.exp(-t / (0.22 if pop else 0.45)) * np.minimum(1, t / 0.002); e[t > d] *= np.exp(-(t[t > d] - d) / 0.03)
    tr = bp(rng.standard_normal(len(t)), 1800, 5000) * np.exp(-t / 0.008) * (0.9 if pop else 0.5)
    return np.tanh(1.6 * (y * e + tr)) * v
def kick(v=1.0):
    t = T(0.42); f = 45 + 95 * np.exp(-t / 0.035)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    x += 0.2 * bp(rng.standard_normal(len(t)), 2500, 7000) * np.exp(-t / 0.003)
    return np.tanh(1.8 * x) * v
def snare(v=1.0):
    t = T(0.3); n = bp(rng.standard_normal(len(t)), 1200, 9000) * np.exp(-t / 0.07)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05)
    clap = sum(bp(rng.standard_normal(len(t)), 900, 4000) * np.exp(-np.maximum(0, t - k * 0.009) / 0.03) * (t >= k * 0.009) for k in range(3))
    return (0.4 * n + 0.6 * tone + 0.3 * clap) * v
def hat(v=0.5, open_=False):
    t = T(0.3 if open_ else 0.06); x = hp(rng.standard_normal(len(t)), 7500) * np.exp(-t / (0.09 if open_ else 0.012))
    return x * v
def mclick(v=0.6, pitch=1.0):
    """click chuột: 'tách' nhựa = xung cao + thân thấp, rất ngắn"""
    t = T(0.04)
    a = np.sin(2 * np.pi * 3900 * pitch * t) * np.exp(-t / 0.0016)
    b = bp(rng.standard_normal(len(t)), 1500 * pitch, 6000) * np.exp(-t / 0.003)
    c = np.sin(2 * np.pi * 900 * pitch * t) * np.exp(-t / 0.004)
    return (0.5 * a + 0.6 * b + 0.3 * c) * v
def supersaw(ms, d, cut=3000, v=0.5):
    t = T(d + 0.1); x = np.zeros_like(t)
    for m in ms:
        for k in range(5):
            f = hz(m) * (1 + (k - 2) * 0.006); x += 2 * ((f * t + k * 0.13) % 1) - 1
    x = lp(x, cut, 2) * np.minimum(1, t / 0.01) * np.exp(-t / 0.25); x[t > d] *= np.exp(-(t[t > d] - d) / 0.05)
    return x / (len(ms) * 5) * v
def pad(ms, d, cut=900, v=0.4):
    t = T(d); x = np.zeros_like(t)
    for m in ms:
        for k in range(3): f = hz(m) * (1 + (k - 1) * 0.004); x += np.sin(2 * np.pi * f * t + k) + 0.3 * (2 * ((f * t) % 1) - 1)
    a = min(1.2, d / 3); e = np.minimum(1, t / a) * np.minimum(1, (d - t) / a)
    return lp(x, cut) * e / len(ms) * v
def whoosh(d=0.6, v=0.5, up=True):
    t = T(d); n = rng.standard_normal(len(t)); e = np.sin(np.pi * t / d) ** 2
    lo = np.linspace(300, 3000, len(t)) if up else np.linspace(3000, 300, len(t))
    out = np.zeros_like(n); seg = 2400
    for i in range(0, len(n), seg): out[i:i + seg] = bp(n[i:i + seg + 200], lo[i] * 0.7, lo[i] * 1.6)[:len(n[i:i + seg])]
    return out * e * v
def ring(d=1.0, v=0.4):
    """chuông điện thoại hiện đại (2 nốt xen kẽ, rung)"""
    t = T(d); f = np.where((t * 12).astype(int) % 2 == 0, 1318.5, 1046.5)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(2 * np.pi * np.cumsum(f * 2) / SR)
    e = np.minimum(1, t / 0.02) * np.minimum(1, (d - t) / 0.05)
    return x * e * v
def buzz(d=0.5, v=0.3):
    t = T(d); x = np.sign(np.sin(2 * np.pi * 110 * t)) * (0.5 + 0.5 * np.sin(2 * np.pi * 30 * t)); return lp(x, 900) * np.minimum(1, (d - t) / 0.05) * v
def thump(v=0.8):
    t = T(0.5); return (np.sin(2 * np.pi * (40 + 60 * np.exp(-t / 0.03)) * t) * np.exp(-t / 0.18) + 0.5 * lp(rng.standard_normal(len(t)), 600) * np.exp(-t / 0.05)) * v
def chime(ms, v=0.4):
    out = np.zeros(int(1.6 * SR))
    for k, m in enumerate(ms):
        t = T(1.6 - k * 0.07); f = hz(m); x = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.2)) * np.exp(-t / 0.5) * np.minimum(1, t / 0.002)
        out[int(k * 0.07 * SR):int(k * 0.07 * SR) + len(x)] += x
    return out * v
def subhit(v=1.0):
    t = T(2.5); return np.tanh(1.5 * np.sin(2 * np.pi * (34 + 50 * np.exp(-t / 0.05)) * t) * np.exp(-t / 0.7)) * v
def riser(d, v=0.4):
    t = T(d); n = rng.standard_normal(len(t)); y = np.zeros_like(n); seg = 2400
    for i in range(0, len(n), seg): c = 400 + 7000 * (i / len(n)) ** 2; y[i:i + seg] = bp(n[i:i + seg + 100], c * 0.8, c * 1.3)[:len(n[i:i + seg])]
    s = np.sin(2 * np.pi * np.cumsum(200 + 600 * (t / d) ** 2) / SR) * 0.2
    return (y + s) * (t / d) ** 1.5 * v
def creak(v=0.25):
    t = T(0.7); f = 180 + 60 * np.sin(2 * np.pi * 1.3 * t); x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (np.sin(2 * np.pi * 23 * t) > 0.3)
    return bp(x, 400, 2400) * np.sin(np.pi * t / 0.7) * v
def reverb(x, sec=1.4, wet=0.22):
    t = T(sec); ir = rng.standard_normal((len(t), 2)) * np.exp(-t / (sec / 5))[:, None]; ir[:, 0] = lp(ir[:, 0], 6000); ir[:, 1] = lp(ir[:, 1], 6000)
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1)
    return x + wet * y / np.abs(ir).sum(0).max() * 30

# ── hoà âm (Fa trưởng; mở đầu đêm ở Rê thứ) ──
PROG = [  # (gốc bass, giọng Rhodes)
    ('F2', ['A3', 'C4', 'E4', 'G4']),      # Fmaj9
    ('A2', ['G3', 'C4', 'E4', 'G4']),      # Am7
    ('D2', ['F3', 'A3', 'C4', 'E4']),      # Dm9
    ('Bb1', ['A3', 'D4', 'F4', 'C5']),     # Bbmaj9  (nửa sau: C9sus)
]
C9 = ('C2', ['Bb3', 'D4', 'F4', 'G4'])

music = np.zeros((N, 2)); drums = np.zeros((N, 2)); fx = np.zeros((N, 2)); keys = np.zeros((N, 2))
side = np.ones(N)

def groove(b0, b1, level=1.0, full=True, hats=True, bassline=True, keysOn=True, clicks=True):
    for b in range(b0, b1):
        t0 = bar(b); root, voic = PROG[b % 4]
        for q in range(16):
            tq = t0 + q * BEAT / 4
            if full and q in (0, 6, 8, 11) and not (q == 11 and b % 2 == 0): add(drums, kick(0.95 * level), tq, 0.9); idx = int(tq * SR); side[idx:idx + int(0.18 * SR)] = np.minimum(side[idx:idx + int(0.18 * SR)], 0.55 + 0.45 * np.linspace(0, 1, int(0.18 * SR)) ** 0.5)
            if full and q in (4, 12): add(drums, snare(0.75 * level), tq, 0.8, 0.05)
            if hats: add(drums, hat(0.15 * level * (1.0 if q % 2 else 0.55)), tq, 0.7, 0.3)
            if hats and q in (2, 10): add(drums, hat(0.09 * level, True), tq, 0.6, 0.3)
            if clicks and q in (3, 7, 9, 14, 15): add(drums, mclick(0.3 * level, 1.0 + 0.08 * (q % 3)), tq, 0.8, -0.45 + 0.3 * (q % 2))
        if bassline:
            r = mid(root) if (b % 4) != 3 else mid(root)
            pat = [(0, 0, 0.35, False), (0.75, 12, 0.12, True), (1.5, 0, 0.25, False), (2.0, 7, 0.2, False), (2.5, 12, 0.12, True), (3.0, 10, 0.2, False), (3.5, 12, 0.1, True)]
            for (bt, iv, d, pop) in pat:
                rr = r
                if (b % 4) == 3 and bt >= 2: rr = mid(C9[0])
                add(music, slap(rr + iv, d, 0.55 * level, pop), t0 + bt * BEAT, 0.9)
        if keysOn:
            vo = [mid(n) for n in voic]
            if (b % 4) == 3: stabs = [(0, vo, 0.6), (1.5, vo, 0.4), (2.0, [mid(n) for n in C9[1]], 0.6), (3.5, [mid(n) for n in C9[1]], 0.3)]
            else: stabs = [(0, vo, 0.7), (1.5, vo, 0.3), (2.5, vo, 0.35), (3.5, vo, 0.2)]
            for (bt, ms, d) in stabs: chord(keys, ms, t0 + bt * BEAT, d * BEAT * 2, 0.55 * level)

# ── 0 → S04: đêm (không trống) ──
nightEnd = SC['S04']
add(music, pad([mid('D3'), mid('F3'), mid('A3'), mid('E4')], 9.2, 700, 0.16), 0.0)
add(music, pad([mid('Bb2'), mid('D3'), mid('F3'), mid('A3')], 9.6, 650, 0.15), 9.0)
for k, (t, m) in enumerate([(at('S01', 3), 'A4'), (at('S01', 6), 'F4'), (at('S02', 2), 'E4'), (at('S02', 6), 'D4'), (at('S03', 1), 'C4'), (at('S03', 5), 'A3'), (at('S03', 9), 'Bb3')]):
    add(keys, rhodes(mid(m), 1.4, 0.4), t, 0.22, 0.25)
for k in range(int(nightEnd / BEAT)):                    # đồng hồ tích tắc nhỏ
    add(fx, mclick(0.12, 0.6 if k % 2 else 0.7), OFF + k * BEAT, 0.5, 0.6)
# S01: chuông + rung + cuộc gọi nhỡ
for a, b in [(1, 3), (4, 6)]:
    add(fx, ring(at('S01', b) - at('S01', a), 0.14), at('S01', a), 1.0, 0.1)
    t = T(at('S01', b) - at('S01', a)); add(fx, lp(np.sign(np.sin(2 * np.pi * 150 * t)), 250) * 0.15, at('S01', a), 1.0)
add(fx, chime([mid('E5'), mid('C5')], 0.18), at('S01', 7.4), 1.0)
# S02: tap, ù lỗi, tem đóng
add(fx, mclick(0.5, 1.2), at('S02', 0.5), 0.6); add(fx, buzz(0.45, 0.22), at('S02', 6), 1.0)
add(fx, mclick(0.6, 1.4), at('S02', 5.6), 0.7)
add(fx, thump(0.9), at('S02', 7.4) + 0.27, 1.0); add(fx, whoosh(0.3, 0.3, False), at('S02', 7.4), 1.0)
# S03: vuốt, chạm, ding thắng của quán bên, ghế tắt dần
add(fx, whoosh(0.35, 0.35), at('S03', 0.3), 1.0, 0.3)
add(fx, mclick(0.5, 1.3), at('S03', 1.2), 0.7); add(fx, mclick(0.5, 1.3), at('S03', 2.8), 0.7)
add(fx, chime([mid('C6'), mid('G6')], 0.16), at('S03', 3.2), 1.0, 0.3)
for i in range(4): add(keys, rhodes(mid(['A3', 'G3', 'F3', 'E3'][i]), 1.0, 0.3), at('S03', 5.6 + i * 0.6), 0.2, -0.2)

# ── S04: bước ngoặt → groove lọc dần, riser ──
s4 = SC['S04']; b4 = int(round((s4 - OFF) / 2))          # thanh nhịp gần nhất
add(fx, whoosh(0.7, 0.4), s4 - 0.35, 1.0)
build = np.zeros((N, 2)); bufs = (music, drums, keys)
m0, d0, k0 = music.copy(), drums.copy(), keys.copy()
groove(b4, b4 + 3, level=0.7, full=False, hats=True, bassline=True, keysOn=True, clicks=True)
add(fx, riser(SC['S05'] - at('S04', 3.4), 0.35), at('S04', 3.4), 1.0)
# lọc thông thấp mở dần trên đoạn S04 (chỉ phần mới thêm)
i0, i1 = int(s4 * SR), int(SC['S05'] * SR)
for buf, base in ((music, m0), (drums, d0), (keys, k0)):
    new = buf[i0:i1] - base[i0:i1]; out = np.zeros_like(new); seg = 4800
    for j in range(0, len(new), seg):
        c = 350 + 9000 * (j / len(new)) ** 2
        for ch in range(2): out[j:j + seg, ch] = lp(new[max(0, j - 2400):j + seg, ch], c)[-len(new[j:j + seg]):]
    buf[i0:i1] = base[i0:i1] + out

# ── S05: DROP ×16 → phanh băng ──
b5 = int(round((SC['S05'] - OFF) / 2)); BRAKE, STOP, TAP = clip('S05', 10.8), clip('S05', 11.7), clip('S05', 12.75)
add(drums, snare(0.6), SC['S05'] - 0.25, 0.5); add(fx, subhit(0.5), SC['S05'], 0.7)
groove(b5, int((STOP - OFF) / 2) + 1, level=1.0)
for s in [0.8, 2.6, 4.2, 6.2, 7.8, 9.6]:                 # mỗi bước dựng: stab supersaw + click kép
    add(music, supersaw([mid('F4'), mid('A4'), mid('C5')], 0.18, 4200, 0.35), clip('S05', s), 0.8, 0.2)
    add(fx, mclick(0.6, 1.5), clip('S05', s), 0.8, -0.3)
for k in range(60):                                     # click chuột dày đặc lúc tua nhanh
    t = clip('S05', 0.8 + k * 0.165)
    if t < BRAKE: add(fx, mclick(0.25 + 0.15 * ((k * 7) % 3 == 0), 1.0 + 0.3 * ((k * 5) % 4) / 4), t, 0.6, ((k * 37) % 9 - 4) / 6)

# ── S06–S09: groove nhẹ → điệp khúc ──
b6 = int(round((SC['S06'] - OFF) / 2)); b8 = int(round((SC['S08'] - OFF) / 2)); b10 = int(round((SC['S10'] - OFF) / 2))
groove(b6, b8, level=0.75, full=True, clicks=False)
groove(b8, b10, level=1.0)

# ── tape-stop: S05 phanh (chỉ nhạc + trống + phím) ──
def tapestop(buf, a, b, tail=0.0):
    ia, ib = int(a * SR), int(b * SR); n = ib - ia
    sp = (1 - np.linspace(0, 1, n)) ** 1.6; ph = ia + np.cumsum(sp)
    seg = np.stack([np.interp(ph, np.arange(len(buf)), buf[:, c]) for c in range(2)], 1) * np.linspace(1, 0.2, n)[:, None] ** 0.5
    seg[:, 0] = lp(seg[:, 0], 6000); seg[:, 1] = lp(seg[:, 1], 6000)
    buf[ia:ib] = seg; buf[ib:int((b + tail) * SR)] = 0
for buf in (music, drums, keys): tapestop(buf, BRAKE, STOP, SC['S06'] - STOP - 0.02)
side[int(BRAKE * SR):int(SC['S06'] * SR)] = 1
# sau phanh: hợp âm treo + chạm nút
chord(keys, [mid('F3'), mid('A3'), mid('C4'), mid('E4'), mid('G4')], STOP + 0.1, 2.2, 0.5)
add(music, pad([mid('F2'), mid('C3'), mid('A3')], SC['S06'] - STOP, 1200, 0.35), STOP)
add(fx, mclick(0.9, 0.8), TAP, 1.0); add(fx, chime([mid('C6'), mid('F6'), mid('A6')], 0.22), TAP + 0.02, 1.0)
add(fx, whoosh(0.5, 0.3), SC['S06'] - 0.3, 1.0)

# S06: chạm UI, gõ tên, chime xong
for b_ in [2.4, 4, 5.4, 6.2, 7.2, 9.4]: add(fx, mclick(0.55, 1.25), at('S06', b_), 0.8, 0.1)
for k in range(5): add(fx, mclick(0.3, 1.7 + 0.1 * (k % 2)), at('S06', 7.6) + 0.09 * (k + 1), 0.7, 0.2)
add(fx, chime([mid('A5'), mid('C6'), mid('F6')], 0.3), at('S06', 10), 1.0)
# S07: email, bình minh, dòng mới
add(fx, whoosh(0.4, 0.3, False), at('S07', 0.8), 1.0, -0.2); add(fx, chime([mid('E6'), mid('A6')], 0.2), at('S07', 1.2), 1.0)
add(fx, riser(1.2, 0.18), at('S07', 4.4) - 0.6, 1.0); add(fx, chime([mid('F5'), mid('A5'), mid('C6'), mid('F6')], 0.18), at('S07', 4.6), 1.0)
add(fx, chime([mid('C6'), mid('E6')], 0.25), at('S07', 7.2), 1.0, 0.2)
# S08: pop mỗi thẻ · S09: whoosh vào + thẻ
for b_ in [1.6, 5.6, 9.6]:
    t = T(0.12); add(fx, np.sin(2 * np.pi * (500 + 900 * np.exp(-t / 0.02)) * t) * np.exp(-t / 0.04) * 0.5, at('S08', b_), 1.0)
add(fx, whoosh(0.6, 0.4), SC['S08'] - 0.3, 1.0); add(fx, whoosh(0.6, 0.4), SC['S09'] - 0.3, 1.0)
for i in range(4): add(fx, whoosh(0.25, 0.15), at('S09', 2.2 + i * 0.7), 1.0, -0.4 + i * 0.27)

# ── S10: nhịp thở → lật biển → nhạc trở lại ──
FLIP = at('S10', 5)
for buf in (music, drums, keys): buf[int((SC['S10'] + 0.02) * SR):int(FLIP * SR)] *= 0
add(music, supersaw([mid('F3'), mid('A3'), mid('C4')], 0.2, 1500, 0.3), SC['S10'], 0.6)
add(fx, creak(0.18), SC['S10'] + 0.4, 1.0, -0.1); add(fx, creak(0.12), SC['S10'] + 1.6, 1.0, 0.1)
add(music, pad([mid('D3'), mid('A3'), mid('E4')], FLIP - SC['S10'], 600, 0.25), SC['S10'])
add(fx, whoosh(0.5, 0.45), FLIP - 0.25, 1.0); add(fx, chime([mid('F5'), mid('C6'), mid('F6')], 0.3), FLIP + 0.3, 1.0)
chord(keys, [mid('F3'), mid('A3'), mid('C4'), mid('E4'), mid('G4')], FLIP, 1.5, 0.6)
bF = int(np.ceil((FLIP - OFF) / 2)); b12 = int(round((SC['S12'] - OFF) / 2))
add(drums, snare(0.5), bar(bF) - 0.25, 0.6); add(drums, snare(0.6), bar(bF) - 0.125, 0.6)
groove(bF, b12, level=1.0)
# S11: pop CTA
t = T(0.15); add(fx, np.sin(2 * np.pi * (600 + 1200 * np.exp(-t / 0.02)) * t) * np.exp(-t / 0.05) * 0.7, at('S11', 3), 1.0)
add(fx, whoosh(0.5, 0.35), SC['S11'] - 0.25, 1.0)
# ── S12: kết ──
for buf in (music, drums, keys): buf[int(SC['S12'] * SR):] *= 0
add(fx, subhit(1.0), at('S12', 0.2), 0.9); add(drums, kick(1.0), SC['S12'], 0.9)
chord(keys, [mid('F2'), mid('C3'), mid('A3'), mid('E4'), mid('G4'), mid('C5')], SC['S12'], 3.6, 0.7, g=1.3)
add(music, supersaw([mid('F3'), mid('A3'), mid('C4'), mid('E4')], 0.4, 2500, 0.4), SC['S12'], 0.7)
add(fx, chime([mid('C6'), mid('F6'), mid('A6'), mid('C7')], 0.25), at('S12', 0.3), 1.0)

# ── mix ──
keys = reverb(keys, 1.6, 0.3); fx = reverb(fx, 1.0, 0.15)
drums = lp(drums.T, 11000).T
musicbus = (music * 0.62 + keys * 1.7) * side[:, None] + drums * 0.62
fx = lp(fx.T, 12000).T
mix = musicbus + fx * 0.9
mix = hp(mix.T, 28).T
fo = int(1.2 * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix *= 0.89 / np.abs(mix).max()
os.makedirs(os.path.join(PROJ, 'public', 'audio'), exist_ok=True)
out = os.path.join(PROJ, 'public', 'audio', 'music.wav')
import soundfile as sf
sf.write(out, mix.astype(np.float32), SR, subtype='PCM_16')
print('wrote', out, round(len(mix) / SR, 2), 's')
try:
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', out, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', '-b:a', '256k', out.replace('.wav', '.mp3')], check=True)
    print('wrote mp3')
except Exception as e: print('mp3 skipped', e)
