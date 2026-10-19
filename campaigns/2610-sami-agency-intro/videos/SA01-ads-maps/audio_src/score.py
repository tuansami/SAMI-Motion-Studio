"""SA01 · nhạc + SFX tự tạo (numpy thuần, tất định).
Dark minimal tech-house · 120 BPM (khớp lưới cắt Studio) · Rê thứ · pluck + sub bass + ping sonar.
Chạy:  python3 audio_src/score.py  → audio_src/mix.wav  (rồi ffmpeg loudnorm -14 LUFS → public/audio/music.mp3)
Mốc SFX lấy từ thời gian cảnh trong project.json (giây video = đầu cảnh + giây trong clip - 8/30).
"""
import numpy as np, wave, os

SR = 44100
DUR = 89.6
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(2610)
L = np.zeros(N); R = np.zeros(N)

def at(t): return int(round(t * SR))
def add(sig, t, gain=1.0, pan=0.0):
    i = at(t)
    if i >= N: return
    s = sig[: N - i] * gain
    L[i:i + len(s)] += s * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(s)] += s * np.sqrt(0.5 * (1 + pan))
def tt(d): return np.arange(int(d * SR)) / SR
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)

# ── mốc cảnh (giây video)
SC = {k: v / 30 for k, v in dict(S01=0, S02=196, S03=436, S04=646, S05=841, S06=961, S07=1411, S08=1666, S09=2041, S10=2281, S11=2491).items()}
OFF = 8 / 30
def cue(scene, clip_t): return SC[scene] + clip_t - OFF

# ── nhạc cụ
def kick():
    t = tt(0.42); f = 45 + 95 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 7.5) + 0.25 * np.sin(ph * 2) * np.exp(-t * 30)
def hat(d=0.07):
    t = tt(d); n = rng.standard_normal(len(t)); n = np.diff(n, prepend=0); n = np.diff(n, prepend=0)
    return n * np.exp(-t * 60) * 0.18
def clap():
    t = tt(0.25); n = rng.standard_normal(len(t)); n = np.diff(n, prepend=0)
    env = np.exp(-t * 22) * (1 + 0.6 * (np.sin(2 * np.pi * 90 * t) > 0) * (t < 0.03))
    return n * env * 0.22
def sub(m, d):
    t = tt(d); env = np.minimum(1, t / 0.01) * np.exp(-t * 3.2)
    return (np.sin(2 * np.pi * hz(m) * t) + 0.18 * np.sin(4 * np.pi * hz(m) * t)) * env
def pluck(m, d=0.6, bright=1.0):
    t = tt(d); f = hz(m); s = np.zeros(len(t))
    for k in range(1, 9):
        s += np.sin(2 * np.pi * f * k * t) / k * np.exp(-t * (6 + 9 * k / bright))
    return s * np.minimum(1, t / 0.003) * 0.35
def pad(ms, d):
    t = tt(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-0.08, 0.0, 0.08):
            f = hz(m + det)
            for k in (1, 2, 3):
                s += np.sin(2 * np.pi * f * k * t + k) / (k * k)
    env = np.minimum(1, t / 0.8) * np.minimum(1, (d - t) / 0.8)
    return s * env * 0.035
def ping(f=1318.5, d=2.2):
    t = tt(d); s = np.sin(2 * np.pi * f * t) * np.exp(-t * 3.0) + 0.3 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t * 6)
    out = s.copy(); dl = at(0.375)
    for k in range(1, 4):
        out[dl * k:] += s[: len(s) - dl * k] * (0.42 ** k)
    return out * np.minimum(1, t / 0.002) * 0.22
def blip(f=2600, d=0.05, g=0.25):
    t = tt(d); return np.sin(2 * np.pi * f * t) * np.exp(-t * 90) * g
def key():
    t = tt(0.04); n = rng.standard_normal(len(t)); return (np.diff(n, prepend=0) * np.exp(-t * 160) * 0.3 + blip(3200, 0.04, 0.08))
def whoosh(d=0.9, up=True):
    t = tt(d); n = rng.standard_normal(len(t))
    # lọc thông thấp một cực thay đổi theo thời gian (bản xấp xỉ: trung bình trượt)
    k = 24; n = np.convolve(n, np.ones(k) / k, mode='same')
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    return n * env * 1.4
def riser(d):
    t = tt(d); f = 200 + 1600 * (t / d) ** 2
    n = np.convolve(rng.standard_normal(len(t)), np.ones(16) / 16, mode='same')
    return (0.5 * n + 0.15 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * (t / d) ** 2
def impact(g=1.0):
    t = tt(1.8); f = 38 + 60 * np.exp(-t * 8)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    n = np.convolve(rng.standard_normal(len(t)), np.ones(8) / 8, mode='same') * np.exp(-t * 12) * 0.5
    return (s + n) * g
def pop():
    t = tt(0.12); f = 600 + 900 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * 0.4

# ── hoà âm: Dm – Bb – F – C (mỗi hợp âm 1 ô nhịp = 2 s)
PROG = [[50, 53, 57], [46, 50, 53], [45, 48, 53], [48, 52, 55]]
ROOT = [38, 34, 41, 36]
ARP = [[62, 65, 69, 72], [58, 62, 65, 70], [60, 65, 69, 72], [60, 64, 67, 72]]

def section(t0, t1, kick_on, hat_on, clap_on, bass_on, arp_on, bright=1.0, arp_g=0.5):
    b = 0
    t = t0
    while t < t1 - 1e-6:
        bar = int((t + 1e-6) // 2) % 4
        beat = int(round((t % 2) / BEAT))
        if kick_on: add(kick(), t, 0.9)
        if hat_on: add(hat(), t + 0.25, 0.8, 0.3)
        if clap_on and beat in (1, 3): add(clap(), t, 0.9, -0.1)
        if bass_on:
            add(sub(ROOT[bar], 0.24), t + 0.25, 0.55)
        if arp_on:
            for s16 in range(2):
                n = ARP[bar][(beat * 2 + s16) % 4]
                if (beat * 2 + s16) % 3 != 2:
                    add(pluck(n, 0.5, bright), t + s16 * 0.25, arp_g, 0.35 if s16 else -0.35)
        t += BEAT

def pads(t0, t1, g=1.0):
    t = t0 - (t0 % 2)
    while t < t1 - 0.01:
        bar = int((t + 1e-6) // 2) % 4
        d = min(2.0, t1 - t) + 0.6
        add(pad(PROG[bar], d), max(t, t0), g)
        t += 2.0

# ── bố cục
pads(0.0, 28.2, 0.8)
section(6.5, 14.5, kick_on=False, hat_on=True, clap_on=False, bass_on=True, arp_on=True, arp_g=0.35)
section(14.5, 21.5, kick_on=True, hat_on=True, clap_on=False, bass_on=True, arp_on=True, arp_g=0.4)
section(21.5, 28.0, kick_on=True, hat_on=True, clap_on=True, bass_on=True, arp_on=True, arp_g=0.45)
pads(28.0, 32.0, 1.0)               # S05 đáy: chỉ còn pad
pads(32.0, 76.0, 0.7)
section(32.0, 47.0, kick_on=True, hat_on=True, clap_on=True, bass_on=True, arp_on=True, bright=1.6, arp_g=0.5)
section(47.0, 55.5, kick_on=True, hat_on=True, clap_on=True, bass_on=True, arp_on=True, bright=2.2, arp_g=0.55)
section(55.5, 76.0, kick_on=True, hat_on=True, clap_on=True, bass_on=True, arp_on=True, bright=1.6, arp_g=0.45)
pads(76.0, 89.6, 0.9)               # S10 nhịp thở → S11
section(77.5, 83.0, kick_on=False, hat_on=True, clap_on=False, bass_on=True, arp_on=True, bright=1.2, arp_g=0.35)
add(pad([50, 57, 62, 65], 6.5), 83.0, 1.4)

# ── SFX khớp hình
for i in range(15):                                    # gõ „Pho in der Nähe"
    add(key(), cue('S01', 0.35 + i * 1.2 / 15), 0.9, (i % 3 - 1) * 0.2)
add(blip(1800, 0.08, 0.4), cue('S01', 1.68)); add(key(), cue('S01', 1.68), 1.4)
add(whoosh(1.3), cue('S01', 1.8), 0.22)
add(impact(0.35), cue('S01', 1.9))
add(ping(), cue('S01', 3.1), 0.6)                      # ghim quán bạn
for k in range(4):                                      # sonar mỗi vòng radar (2 s)
    add(ping(), cue('S02', 0.3 + 2 * k), 0.9)
for k, tH in enumerate([0.5, 0.95, 1.4, 1.75]):
    add(blip(2200 + 200 * k, 0.06, 0.18), cue('S02', 0.3 + tH), 1, 0.4)
add(whoosh(0.8), cue('S02', 2.3), 0.15)                 # danh sách trượt lên
for k in range(8):                                      # bước chân
    add(blip(900, 0.03, 0.1), cue('S03', 0.7 + k * 0.5), 1, -0.3 if k % 2 else 0.3)
add(whoosh(1.4), cue('S04', -0.2), 0.2)
add(ping(880, 3.0), cue('S05', 0.4), 0.7)
add(riser(1.0), cue('S05', 3.27), 0.5)
add(impact(0.9), cue('S06', 0.27))                      # điểm sáng nổ thành HUD
for a in [2.0, 4.8, 7.6, 10.4]:
    add(blip(2400, 0.05, 0.3), cue('S06', a), 1, 0.2); add(blip(3100, 0.05, 0.22), cue('S06', a + 1.4), 1, -0.2)
for i in range(3): add(key(), cue('S06', 8.1 + i * 0.35), 0.9)
add(riser(2.4), cue('S07', 0.35), 0.35)                 # tia quét
for i in range(18):                                     # người sáng lên
    add(blip(1800 + i * 90, 0.05, 0.12), cue('S07', 0.4 + i * 0.13), 1, ((i * 7) % 5 - 2) / 3)
add(impact(1.0), cue('S07', 4.5)); add(ping(1760, 2.5), cue('S07', 4.55), 0.8)
for a in [0.5, 3.9, 7.3]: add(pop(), cue('S08', a), 0.8)
add(whoosh(0.7), cue('S09', 1.0), 0.15); add(impact(0.45), cue('S09', 4.05))
add(ping(1318.5, 3.0), cue('S10', 0.2), 0.7)
add(pop(), cue('S11', 0.4), 1.0); add(impact(0.9), cue('S11', 1.6))

# ── reverb nhẹ (IR nhiễu tắt dần) + sidechain theo kick + master
ir_t = tt(1.6); ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 4.0); ir /= np.sqrt((ir ** 2).sum())
def conv(x, h):
    n = len(x) + len(h); F = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, F) * np.fft.rfft(h, F), F)[: len(x)]
Lw = L + 0.22 * conv(L, ir); Rw = R + 0.22 * conv(R, ir * np.roll(np.ones(1), 0))
fade = np.ones(N); fade[-at(2.0):] = np.linspace(1, 0, at(2.0)); fade[: at(0.05)] = np.linspace(0, 1, at(0.05))
mix = np.stack([Lw, Rw], 1) * fade[:, None]
mix = np.tanh(mix / (np.abs(mix).max() * 0.6)) * 0.85
out = os.path.join(os.path.dirname(__file__), 'mix.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok', out, round(DUR, 1), 's')
