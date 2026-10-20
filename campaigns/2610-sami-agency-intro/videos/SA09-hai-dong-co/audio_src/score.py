"""SA09 · nhạc + SFX tự tạo (numpy thuần, tất định).
Synthwave · 100 BPM (1 nhịp 0,6 s, 1 ô nhịp 2,4 s = 72 khung; cắt cảnh ở 72k+1) · Mi thứ (Em – C – G – D)
arpeggio analog (saw cộng hài có "lọc"), snare gated reverb, bass octave, pad, kick 4/4.
Chạy:  python3 audio_src/score.py  → audio_src/mix.wav  (rồi ffmpeg loudnorm -14 LUFS → public/audio/music.mp3)
Mốc SFX lấy từ thời gian cảnh trong project.json (giây video = đầu cảnh + giây trong clip - 8/30).
"""
import numpy as np, wave, os, json

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
P = json.load(open(os.path.join(HERE, '..', 'project.json'), encoding='utf-8'))
SC = {s['id']: s['start'] / 30 for s in P['scenes']}
DUR = P['scenes'][-1]['end'] / 30 + 0.6
N = int(SR * DUR)
BEAT = 0.6; BAR = 2.4; S16 = BEAT / 4
rng = np.random.default_rng(909)
L = np.zeros(N); R = np.zeros(N)
OFF = 8 / 30
def cue(scene, clip_t): return SC[scene] + clip_t - OFF

def at(t): return int(round(t * SR))
def add(sig, t, gain=1.0, pan=0.0, buf=None):
    i = at(t)
    if i >= N or i < 0: return
    s = sig[: N - i] * gain
    L[i:i + len(s)] += s * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(s)] += s * np.sqrt(0.5 * (1 + pan))
def tt(d): return np.arange(int(d * SR)) / SR
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def lp(x, k): return np.convolve(x, np.ones(k) / k, mode='same')

# ── nhạc cụ
def saw(f, t, fc, det=0.0):
    """saw cộng hài, "lọc" bằng hệ số 1/(1+(kf/fc)^4) — kiểu analog mềm"""
    s = np.zeros(len(t)); k = 1
    while k * f < min(fc * 3, 16000):
        s += np.sin(2 * np.pi * k * f * (1 + det) * t) / k / (1 + (k * f / fc) ** 4); k += 1
    return s
def arp(m, d, fc=2400, g=1.0):
    t = tt(d); f = hz(m)
    s = saw(f, t, fc) + 0.7 * saw(f, t, fc, 0.004)
    env = np.minimum(1, t / 0.004) * np.exp(-t * 7)
    return s * env * 0.11 * g
def bass(m, d):
    t = tt(d); f = hz(m)
    s = saw(f, t, 420) + 0.6 * np.sin(2 * np.pi * f * t)
    env = np.minimum(1, t / 0.006) * np.minimum(1, np.maximum(0, (d - t) / 0.02)) * np.exp(-t * 2.2)
    return np.tanh(1.5 * s) * env * 0.30
def pad(ms, d, fc=1400):
    t = tt(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-0.006, 0.0, 0.006):
            s += saw(hz(m), t, fc, det)
    env = np.minimum(1, t / 0.8) * np.minimum(1, (d - t) / 0.8)
    return s * env * 0.020
def kick():
    t = tt(0.42); f = 45 + 120 * np.exp(-t * 32)
    return np.tanh(1.8 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5)) * 0.85
def snare():
    """snare gated reverb: thân + nhiễu dày, cắt gọn sau 0,32 s"""
    t = tt(0.36); n = rng.standard_normal(len(t)); n = n - lp(n, 4)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.5
    tail = lp(rng.standard_normal(len(t)), 3) * 0.55
    gate = np.where(t < 0.30, 1.0, np.maximum(0, 1 - (t - 0.30) / 0.03))
    return (body + n * np.exp(-t * 26) * 0.6 + tail * np.exp(-t * 4) * gate) * 0.30
def hat(open_=False):
    t = tt(0.22 if open_ else 0.05); n = rng.standard_normal(len(t)); n = n - lp(n, 2)
    return n * np.exp(-t * (14 if open_ else 80)) * 0.07

# ── SFX
def blip(f=2200, d=0.06, g=0.22):
    t = tt(d); return np.sin(2 * np.pi * f * t) * np.exp(-t * 70) * g
def tick(g=0.25):
    t = tt(0.03); n = rng.standard_normal(len(t)); return np.diff(n, prepend=0) * np.exp(-t * 220) * g + blip(4200, 0.03, 0.05)
def clack():
    t = tt(0.25); n = rng.standard_normal(len(t))
    return (np.diff(n, prepend=0) * np.exp(-t * 90) * 0.5 + np.sin(2 * np.pi * np.cumsum(140 + 300 * np.exp(-t * 60)) / SR) * np.exp(-t * 25) * 0.6) * 0.8
def powerdown(d=1.3):
    t = tt(d); f = 220 * np.exp(-t * 2.6) + 30
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sign(np.sin(2 * np.pi * np.cumsum(f * 0.5) / SR))
    return lp(s, 6) * np.exp(-t * 1.6) * 0.22
def whoosh(d=0.7, g=0.25):
    t = tt(d); n = rng.standard_normal(len(t)); env = np.sin(np.pi * t / d) ** 2
    k = (3 + 30 * (t / d)).astype(int); out = np.zeros(len(t))
    for kk in (4, 9, 18):
        out += lp(n, kk) * (1 - abs(kk - 3 - 30 * t / d) / 30).clip(0)
    return out * env * g
def riser(d=1.0, g=0.18):
    t = tt(d); n = rng.standard_normal(len(t)); n = n - lp(n, 8)
    return (n * 0.6 + np.sin(2 * np.pi * np.cumsum(300 + 1500 * (t / d) ** 2) / SR) * 0.3) * (t / d) ** 2 * g
def thud(g=0.5):
    t = tt(0.4); f = 60 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11) * g
def rev(d=1.4, g=0.22):
    """động cơ khởi động: tiếng gầm răng cưa lên cao độ + tiếng lách cách"""
    t = tt(d); f = 40 + 90 * (1 - np.exp(-t * 2.5))
    s = np.tanh(2 * np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.6 + np.sin(2 * np.pi * np.cumsum(f * 2) / SR) * 0.5)
    env = np.minimum(1, t / 0.08) * np.minimum(1, (d - t) / 0.4)
    return lp(s, 5) * env * g
def clank():
    t = tt(0.6); s = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * dk) for f, dk in ((523, 9), (1311, 14), (2093, 22), (3301, 30)))
    th = np.zeros(len(t)); h = thud(0.6); th[:len(h)] = h
    return (s * 0.18 + th) * 0.9
def pop(g=0.4):
    t = tt(0.12); f = 500 + 1100 * np.exp(-t * 45)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * g
def subhit(g=0.8):
    t = tt(1.8); f = 38 + 50 * np.exp(-t * 8)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6) * g
def shimmer(d=1.6, g=0.12):
    t = tt(d); s = sum(np.sin(2 * np.pi * hz(m) * t) for m in (76, 83, 88, 91))
    return s * np.minimum(1, t / 0.3) * np.exp(-t * 1.6) * g

# ── hòa âm: Em – C – G – D (mỗi hợp âm 1 ô nhịp)
CH = [[52, 55, 59], [48, 52, 55], [55, 59, 62], [50, 54, 57]]   # pad (E3.., C3.., G3.., D3..)
BS = [40, 36, 43, 38]                                         # bass gốc (E2 C2 G2 D2)
ARP = [[64, 67, 71, 76], [60, 64, 67, 72], [67, 71, 74, 79], [62, 66, 69, 74]]
NB = int(np.ceil(DUR / BAR))

# đoạn (theo ô nhịp): 0-2 intro S01 (0,67 ô sáng rồi tắt) · 3-5 S02 chờ · 6-7 S03 build · 8-30 S04–S08 groove · 31-32 S09 thở · 33-36 S10
def sec(b):
    if b <= 2: return 'intro'
    if b <= 5: return 'wait'
    if b <= 7: return 'build'
    if b <= 30: return 'groove'
    if b <= 32: return 'breath'
    return 'end'
T_OFF = cue('S01', 1.6)
for b in range(NB):
    t0 = b * BAR; c = b % 4; s = sec(b)
    if s == 'end' and b == NB - 1: c = 0
    # pad
    if s in ('wait', 'build', 'groove', 'breath', 'end'):
        add(pad(CH[c], BAR + 0.8, 900 if s == 'wait' else 1600), t0, 1.0 if s != 'groove' else 0.85)
    if s == 'intro' and b == 0:
        add(pad(CH[0], 1.9, 1600), 0.0, 0.9)
    if s == 'intro' and b > 0:
        add(pad(CH[0] if b == 1 else CH[1], BAR + 0.8, 420), t0 - 0.4, 0.8)   # sau khi tắt: chỉ còn tiếng ù tối
    # arp 16 nốt/ô (nốt 16) — mở lọc dần ở build
    for k in range(16):
        tk = t0 + k * S16
        if s == 'intro' and tk >= T_OFF: break
        if s == 'end' and b == NB - 1 and k > 0: break
        if s in ('intro', 'build', 'groove', 'end') or (s in ('wait', 'breath') and k % 2 == 0):
            fc = {'intro': 2600, 'wait': 700, 'build': 700 + 2200 * ((b - 6) * 16 + k) / 32, 'groove': 2800, 'breath': 1100, 'end': 2800}[s]
            m = ARP[c][[0, 1, 2, 3, 2, 1, 3, 2][k % 8]] + (12 if (k // 8) % 2 and s in ('groove', 'end') else 0)
            add(arp(m, S16 * 1.6, fc, 0.6 if s in ('wait', 'breath') else 1.0), tk, 1.0, pan=0.35 * np.sin(k * 0.9))
    # trống + bass
    if s in ('intro', 'groove', 'end', 'build'):
        for q in range(4):
            tq = t0 + q * BEAT
            if s == 'intro' and tq >= T_OFF: break
            if s == 'end' and b == NB - 1 and q > 0: break
            if s != 'build' or q == 0 or b == 7:
                add(kick(), tq, 0.9)
            if s in ('groove', 'end') and q in (1, 3): add(snare(), tq, 1.0)
            if s in ('groove', 'end', 'intro'):
                add(hat(), tq + BEAT / 2, 1.0, pan=0.3); add(hat(), tq + BEAT / 4, 0.5, pan=-0.3); add(hat(), tq + 3 * BEAT / 4, 0.5, pan=-0.3)
            if s in ('groove', 'end', 'intro'):
                for e in range(2):  # bass octave nốt 8
                    add(bass(BS[c] + (12 if e else 0), BEAT / 2 * 0.9), tq + e * BEAT / 2, 1.0)
    if s == 'build' and b == 7:
        for k in range(8): add(snare(), t0 + BAR / 2 + k * S16, 0.25 + 0.08 * k)
    if s == 'wait':
        for q in range(4): add(tick(0.16), t0 + q * BEAT)   # đồng hồ chờ

# ── SFX khớp hình
add(clack(), T_OFF, 0.9); add(powerdown(), T_OFF + 0.05, 1.0)
for i in range(12): add(tick(0.12), T_OFF + 0.35 + ((i * 0.37) % 1.6), 1.0, pan=0.4 * np.sin(i))
for sc in ('S02', 'S03', 'S05', 'S06', 'S07', 'S08', 'S10'): add(whoosh(), cue(sc, 0.27) - 0.35, 0.9)
add(whoosh(0.9, 0.35), cue('S04', 0.27) - 0.45); add(thud(0.6), cue('S04', 0.27))
for f in (2.1, 4.4): add(tick(0.4), cue('S02', f + 0.25)); add(blip(1400, 0.08, 0.15), cue('S02', f + 0.25))
add(blip(1800), cue('S03', 1.75), 1.0, -0.4); add(blip(2400), cue('S03', 2.85), 1.0, 0.4)
add(riser(4.5, 0.07), cue('S03', 0.3))
add(thud(0.35), cue('S04', 3.4)); add(thud(0.35), cue('S04', 6.6)); add(blip(2600, 0.06, 0.14), cue('S04', 3.4)); add(blip(3100, 0.06, 0.14), cue('S04', 6.6))
for k in range(8): add(tick(0.10), cue('S05', 1.3 + k * 0.3))
add(riser(1.2, 0.14), cue('S05', 8.4)); add(shimmer(1.6, 0.10), cue('S05', 9.6))
add(rev(), cue('S06', 0.4), 1.0, -0.4); add(rev(), cue('S06', 1.8), 1.0, 0.4)
add(clank(), cue('S06', 3.0), 1.0)
for k in range(12): add(tick(0.14), cue('S06', 3.4 + k * 0.2))
add(shimmer(2.0, 0.14), cue('S06', 5.6))
for i in range(6): add(blip(1600 + i * 180, 0.05, 0.12), cue('S07', 1.0 + i * 0.12)); add(blip(2400 + i * 200, 0.05, 0.12), cue('S07', 3.6 + i * 0.16))
for i in range(3): add(tick(0.2), cue('S08', 1.4 + i * 0.35))
add(shimmer(1.8, 0.12), cue('S09', 2.4))
add(pop(0.45), cue('S10', 0.15)); add(subhit(0.8), cue('S10', 1.7))

# ── master: ép mềm + chuẩn hoá đỉnh (loudnorm làm ở ffmpeg)
mix = np.stack([L, R], 1)
fade = np.ones(N); fl = int(1.5 * SR); fade[-fl:] = np.linspace(1, 0, fl)
mix *= fade[:, None]
mix = np.tanh(mix * 1.2) / 1.2
mix /= np.max(np.abs(mix)) + 1e-9
mix *= 0.89
with wave.open(os.path.join(HERE, 'mix.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
print('ok', round(DUR, 2), 's')
