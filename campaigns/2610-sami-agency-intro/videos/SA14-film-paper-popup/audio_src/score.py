#!/usr/bin/env python3
"""SA14 · nhạc + foley tự tạo (chỉ numpy). 90 BPM, Rê trưởng.
nylon guitar (Karplus-Strong) + strings (cộng hưởng răng cưa) + đàn bầu (âm bồi, uốn cần, rung) + bass,
foley giấy tổng hợp từ events.json (xuất bởi core/render/events.mjs). Ghi out/mix.wav (48 kHz stereo).
Chạy: python3 audio_src/score.py <thư mục dự án>"""
import sys, json, wave, os
import numpy as np

HERE = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
EVJ = json.load(open(os.path.join(HERE, 'events.json')))
DUR = EVJ['dur']; EV = EVJ['ev']
N = int(SR * (DUR + .5))
BEAT = 60 / 90; BAR = BEAT * 4
rng = np.random.default_rng(14)

def mtof(m): return 440 * 2 ** ((m - 69) / 12)
def bt(bar, beat=0.0): return bar * BAR + beat * BEAT

# ---------- tiện ích lọc (FFT) ----------
def band(x, lo=0, hi=None, soft=1.3):
    n = len(x); X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR); g = np.ones_like(f)
    if lo > 0: g *= 1 / (1 + (lo / np.maximum(f, 1)) ** (2 * soft))
    if hi: g *= 1 / (1 + (f / hi) ** (2 * soft))
    return np.fft.irfft(X * g, n)
def env_ad(n, a, d):
    t = np.arange(n) / SR; return np.minimum(t / max(a, 1e-4), 1) * np.exp(-np.maximum(t - a, 0) / d)

class Bus:
    def __init__(s): s.L = np.zeros(N); s.R = np.zeros(N)
    def add(s, x, t, g=1.0, pan=0.0):
        i = int(t * SR)
        if i >= N or len(x) == 0: return
        if i < 0: x = x[-i:]; i = 0
        x = x[:N - i] * g; l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
        s.L[i:i + len(x)] += x * l * 1.414; s.R[i:i + len(x)] += x * r * 1.414

gtr, strg, bau, bass, perc, sfx, amb = Bus(), Bus(), Bus(), Bus(), Bus(), Bus(), Bus()

# ---------- nhạc cụ ----------
def ks(freq, dur, bright=.5, damp=.996):
    n = int(dur * SR); P = max(2, int(round(SR / freq)))
    burst = rng.uniform(-1, 1, P)
    k = max(1, int(3 + (1 - bright) * 8)); burst = np.convolve(burst, np.ones(k) / k, 'same')
    y = np.zeros(n + P); y[:P] = burst
    for s in range(P, n + P, P):
        prev = y[s - P:s]; nxt = .5 * (prev + np.roll(prev, 1)) * damp
        e = min(s + P, n + P); y[s:e] = nxt[:e - s]
    y = y[:n]; y -= y.mean()
    rel = np.ones(n); rr = int(.08 * SR); rel[-rr:] = np.linspace(1, 0, rr)
    return y * rel * .5
def nylon(m, dur, vel=.7):
    f = mtof(m); y = ks(f, dur, bright=.35 + vel * .3, damp=.9975 if m < 55 else .9965)
    body = band(y, 90, 4200) + .25 * band(y, 180, 420)
    return body * vel
def pizz(m, dur=.6, vel=.6):
    y = ks(mtof(m), dur, bright=.4, damp=.985); return band(y, 120, 3000) * vel
def saw(f, n, ph=0.0, vib=0.0):
    t = np.arange(n) / SR; fi = f * (1 + vib * np.sin(2 * np.pi * 5.2 * t + ph)); pha = 2 * np.pi * np.cumsum(fi) / SR + ph
    out = np.zeros(n)
    for h in range(1, 12):
        if f * h > 9000: break
        out += np.sin(h * pha) / h
    return out
def pad(ms, dur, vel=.25, att=.7, rel=.9):
    n = int((dur + rel) * SR); y = np.zeros(n)
    for m in ms:
        for d, ph in [(-.06, .3), (0, 1.7), (.07, 2.9)]:
            y += saw(mtof(m + d), n, ph, vib=.0025)
    t = np.arange(n) / SR; e = np.minimum(t / att, 1) * np.clip((dur + rel - t) / rel, 0, 1)
    return band(y * e, 110, 2600) * vel / (len(ms) * 3)
def dan_bau(m, dur, vel=.5, bend_end=0.0, scoop=.6):
    """đàn bầu: tiếng bồi gần như sin, hơi có bậc 2; vào nốt vuốt lên, rung tăng dần, có thể uốn cuối nốt"""
    n = int((dur + .35) * SR); t = np.arange(n) / SR
    semi = -scoop * np.exp(-t / .07)
    vib = .28 * np.clip((t - dur * .35) / (dur * .5 + 1e-3), 0, 1) * np.sin(2 * np.pi * 5.6 * t)
    if bend_end: semi += bend_end * np.clip((t - dur * .7) / (dur * .3 + 1e-3), 0, 1) ** 2
    f = mtof(m) * 2 ** ((semi + vib) / 12); ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) + .22 * np.sin(2 * ph) + .06 * np.sin(3 * ph)
    e = np.minimum(t / .012, 1) * np.exp(-t / 2.4) * np.clip((dur + .35 - t) / .35, 0, 1)
    return y * e * vel
def bassnote(m, dur, vel=.6):
    n = int(dur * SR); t = np.arange(n) / SR; f = mtof(m); ph = 2 * np.pi * f * t
    y = (np.sin(ph) + .35 * np.sin(2 * ph) + .15 * np.sin(3 * ph)) * np.minimum(t / .006, 1) * np.exp(-t / .9)
    y[-int(.05 * SR):] *= np.linspace(1, 0, int(.05 * SR)); return y * vel

# ---------- hoà âm ----------
CH = {'D': [50, 57, 62, 66, 69], 'Bm': [47, 54, 59, 62, 66], 'G': [43, 50, 55, 59, 62], 'A': [45, 52, 57, 61, 64], 'Asus': [45, 52, 57, 62, 64], 'Em': [40, 47, 52, 55, 59]}
PADV = {'D': [62, 66, 69, 74], 'Bm': [59, 62, 66, 71], 'G': [59, 62, 67, 71], 'A': [57, 61, 64, 69], 'Asus': [57, 62, 64, 69], 'Em': [59, 64, 67, 71]}
ROOT = {'D': 38, 'Bm': 35, 'G': 43, 'A': 45, 'Asus': 45, 'Em': 40}
PROG = {}
for i, c in enumerate(['D', 'Bm', 'G', 'A', 'D', 'Asus']): PROG[i] = c                      # bếp 0–6
for i, c in enumerate(['Bm', 'G', 'D', 'Asus', 'Bm', 'G']): PROG[6 + i] = c                  # phố 6–11.5
for i, c in enumerate(['G', 'D', 'A', 'Bm', 'G', 'D', 'Em', 'A', 'G', 'A']): PROG[13 + i] = c  # SAMI 13–23
for i, c in enumerate(['D', 'A', 'Bm', 'G', 'A']): PROG[23 + i] = c                          # đèn lồng 23–28
PROG[28] = 'G'; PROG[29] = 'Asus'

PAT = [0, 2, 3, 4, 1, 3, 4, 2]
for bar, c in PROG.items():
    notes = CH[c]
    if bar < 6: vel, den = .45 + bar * .03, 1
    elif bar < 11.5: vel, den = .38, 2
    elif bar < 23: vel, den = .5 + (bar - 13) * .02, 1
    elif bar < 28: vel, den = .62, 1
    else: vel, den = .42, 2
    last = 4 if bar == 11 else 8           # ô 11 nhạc dừng giữa ô → lặng
    for k in range(0, last, den):
        m = notes[PAT[k] % len(notes)] + (12 if (bar >= 23 and k % 2) else 0)
        gtr.add(nylon(m, 1.6, vel * (1.0 if k % 4 == 0 else .75)), bt(bar, k * .5) + rng.uniform(0, .012), 1, pan=-.25 + .1 * (k % 3))
    # quạt chả ở đoạn SAMI/đèn lồng (phách 2 và 4)
    if 15 <= bar < 28:
        for b in (1, 3):
            for j, m in enumerate(notes[1:]): gtr.add(nylon(m + 12, .5, .22), bt(bar, b) + j * .012, 1, pan=.3)
    # bass
    if not (bar == 11):
        bass.add(bassnote(ROOT[c], BAR * .48, .55), bt(bar), 1)
        bass.add(bassnote(ROOT[c] + (7 if c != 'Bm' else 7), BAR * .45, .4), bt(bar, 2), 1)
    # strings
    if bar >= 13 or bar in (4, 5):
        v = .16 if bar < 13 else (.2 + (bar - 13) * .012 if bar < 23 else (.34 if bar < 28 else .22))
        strg.add(pad(PADV[c], BAR, v), bt(bar), 1)
    # pizz phố
    if 6 <= bar < 11.5:
        for b in range(4): strg.add(pizz(notes[[0, 2, 1, 3][b]] + 12, .5, .5), bt(bar, b), 1, pan=.35)
    # shaker
    if 15 <= bar < 28:
        for e in range(8):
            nz = band(rng.uniform(-1, 1, int(.06 * SR)), 5000, 12000) * env_ad(int(.06 * SR), .008, .025)
            perc.add(nz, bt(bar, e * .5), .22 if e % 2 else .32, pan=.4)

# đàn bầu: (ô, phách, midi, dài phách, uốn cuối)
BAU = [(2, 0, 69, 2, 0), (2, 2, 66, 2, 0), (3, 0, 67, 1.5, 0), (3, 1.5, 66, .5, 0), (3, 2, 64, 2, 0), (4, 0, 62, 3.5, -1),
       (13, 0, 69, 3.5, -2),                               # nốt đầu tiên sau lặng
       (15, 2, 74, 2, 0), (17, 2, 76, 1, 0), (17, 3, 74, 1, 0), (19, 0, 71, 2.5, 0), (21, 2, 69, 1, 0), (21, 3, 71, 1, 0), (22, 0, 74, 3.5, 0),
       (23, 0, 69, 1.5, 0), (23, 1.5, 71, .5, 0), (23, 2, 74, 2, 0), (24, 0, 76, 2, 0), (24, 2, 74, 1, 0), (24, 3, 71, 1, 0),
       (25, 0, 71, 2, 0), (25, 2, 69, 2, 0), (26, 0, 67, 1, 0), (26, 1, 69, 1, 0), (26, 2, 71, 2, 0), (27, 0, 69, 3.5, -1),
       (28, 0, 74, 2, 0), (28, 2, 71, 2, 0), (29, 0, 69, 4, 0), (31, 0, 74, 6, 0)]
for bar, b, m, d, be in BAU:
    bau.add(dan_bau(m, d * BEAT, .42 if bar < 23 else .5, be), bt(bar, b), 1, pan=.15)
# hợp âm kết (sau logo)
for j, m in enumerate([50, 57, 62, 66, 69, 74]): gtr.add(nylon(m, 6.0, .55), bt(31) + j * .03, 1, pan=-.2 + j * .08)
strg.add(pad([62, 66, 69, 74], 5.5, .26, att=.4, rel=1.6), bt(31), 1)
bass.add(bassnote(38, 4.0, .6), bt(31), 1)

# ---------- foley ----------
def noise(d): return rng.uniform(-1, 1, int(d * SR))
def crinkle(d=.12, dens=300, g=1.0):
    n = int(d * SR); y = np.zeros(n); k = int(dens * d)
    for i in rng.integers(0, n, max(k, 1)):
        L = int(rng.integers(20, 120)); seg_ = rng.uniform(-1, 1, L) * np.exp(-np.arange(L) / 25); y[i:i + L] += seg_[:n - i] * rng.uniform(.3, 1)
    return band(y, 1500, 9000) * g
def swish(d=.8, lo=700, hi=5000):
    n = int(d * SR); t = np.arange(n) / n; e = np.sin(np.pi * t) ** 1.5
    return band(noise(d), lo, hi) * e * .8 + crinkle(d, 120, .5)
def thump(f=90, d=.35, g=1.0):
    n = int(d * SR); t = np.arange(n) / SR; y = np.sin(2 * np.pi * f * t * (1 - .3 * t)) * np.exp(-t / .07)
    return (y + band(noise(d), 80, 900) * np.exp(-t / .03) * .5) * g
def pop():
    d = .09; n = int(d * SR); t = np.arange(n) / SR; f = 900 * np.exp(-t * 18) + 280
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .03); out = np.zeros(int(.16 * SR)); out[:n] += y * .7
    c = crinkle(.1, 260, .6); out[:len(c)] += c; return out
def click(f=2500, d=.03): n = int(d * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * f * t) * .6 + band(noise(d), 1500, 9000) * .5) * np.exp(-t / .006)
def bell(fs, d=1.2, g=.5):
    n = int(d * SR); t = np.arange(n) / SR; y = np.zeros(n)
    for i, f in enumerate(fs): y += np.sin(2 * np.pi * f * t) * np.exp(-t / (d * (.5 - i * .08))) / (i + 1)
    return y * np.minimum(t / .002, 1) * g
def blip(f): d = .03; n = int(d * SR); t = np.arange(n) / SR; return np.sign(np.sin(2 * np.pi * f * t)) * np.exp(-t / .012) * .25
def creak(d=.9):
    n = int(d * SR); t = np.arange(n) / SR; f = 160 + 60 * np.sin(t * 7) + 40 * rng.standard_normal(n).cumsum() / np.sqrt(np.arange(1, n + 1)) * .2
    ph = np.cumsum(f) / SR; y = (ph % 1) * 2 - 1; y = band(y, 300, 3000) * np.sin(np.pi * t / d) * (.6 + .4 * (rng.uniform(size=n) > .3)); return y * .5
def sub(d=1.6): n = int(d * SR); t = np.arange(n) / SR; f = 70 * np.exp(-t * 1.2) + 38; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .6) * np.minimum(t / .004, 1)

LANT = [74, 76, 78, 81, 83]
sizz_on = street = evening = None; beds = []
for e in EV:
    t, ty = e['t'], e['type']; g = e.get('g', 1.0); pan = e.get('pan', 0.0)
    if ty == 'sizzle_on': sizz_on = t
    elif ty == 'sizzle_off': beds.append(('sizzle', sizz_on, t))
    elif ty == 'street_on': street = t
    elif ty == 'street_off': beds.append(('street', street, t))
    elif ty == 'evening_on': evening = t
    elif ty == 'evening_off': beds.append(('evening', evening, t))
    elif ty == 'flame': sfx.add(crinkle(.05, 400, .5), t, .35 * g, pan=.1)
    elif ty == 'whoosh_up': sfx.add(swish(1.4, 300, 3000), t, .6)
    elif ty == 'ladle': sfx.add(bell([2100, 3320, 5100], .5, .5), t, .35, pan=-.1)
    elif ty == 'fold_set':
        for k in range(4): sfx.add(swish(.18, 1200, 6000), t + k * .11, .35, pan=-.4 + k * .25)
    elif ty == 'page_turn': sfx.add(swish(1.5, 500, 6000), t, .9); sfx.add(crinkle(.4, 160, .6), t + .2, .5)
    elif ty == 'page_land': sfx.add(thump(110, .3, .6), t, .5)
    elif ty == 'pop': sfx.add(pop(), t, .55 * g, pan=pan)
    elif ty == 'step': sfx.add(click(1800, .02) * .4 + 0, t, .25 * g, pan=pan)
    elif ty == 'bubble': sfx.add(pop(), t, .5)
    elif ty == 'blip': sfx.add(blip(1250 + 150 * ((int(t * 37)) % 3)), t, .5)
    elif ty == 'tick': sfx.add(click(3200, .02), t, .4)
    elif ty == 'clock': sfx.add(click(2200 if int(t) % 2 else 1700, .025), t, .55)
    elif ty == 'tab_slide': sfx.add(swish(.38, 900, 4000), t, .55, pan=0)
    elif ty == 'tab_click': sfx.add(click(1400, .04), t, .6)
    elif ty == 'string_drop': sfx.add(bell([2600, 4100], .35, .4), t, .4); sfx.add(swish(.3, 1500, 7000), t - .1, .3)
    elif ty == 'thump': sfx.add(thump(95, .35), t, .5 * g)
    elif ty == 'phone_tap': sfx.add(click(3000, .02), t, .5, pan=pan)
    elif ty == 'phone_glow': sfx.add(bell([1318, 1760, 2637], 1.0, .4), t, .4, pan=pan)
    elif ty == 'pin_drop':
        n = int(.5 * SR); tt = np.arange(n) / SR; wh = np.sin(2 * np.pi * np.cumsum(1800 * np.exp(-tt * 3) + 400) / SR) * np.sin(np.pi * tt / .5) * .2
        sfx.add(wh, t - .5, .6); sfx.add(thump(130, .3), t, .7); sfx.add(click(900, .03), t + .12, .3)
    elif ty == 'wash':
        for k in range(10): sfx.add(bell([mtof(74 + [0, 2, 4, 7, 9][k % 5] + 12 * (k // 5)) * 2], .9, .25), t + k * .2, .4, pan=-.5 + k * .1)
    elif ty == 'lantern': i = e.get('i', 0); sfx.add(bell([mtof(LANT[i] + 12), mtof(LANT[i] + 24)], 1.4, .35), t, .45, pan=pan); sfx.add(click(2600, .02), t, .3)
    elif ty == 'door_bell': sfx.add(bell([2400, 3100], .9, .3), t, .35 * g, pan=.3)
    elif ty == 'creak': sfx.add(creak(1.0), t, .5)
    elif ty == 'book_close': sfx.add(thump(70, .6, 1.2), t, .9); sfx.add(band(noise(.5), 200, 2000) * np.exp(-np.arange(int(.5 * SR)) / SR / .12), t, .5)
    elif ty == 'logo_hit': sfx.add(sub(1.8), t, .9); sfx.add(bell([mtof(86), mtof(93), mtof(98)], 2.0, .3), t, .35)
    elif ty == 'cta_pop': sfx.add(pop(), t, .8); sfx.add(bell([1760, 2637], .6, .3), t + .05, .3)

# nền: phòng (cả phim), xèo xèo, phố, tối
room = band(rng.standard_normal(N), 60, 700) * .02
amb.L += room; amb.R += np.roll(room, 977)
def bed(kind, a, b):
    d = b - a + 1.0; n = int(d * SR); e = np.minimum(np.arange(n) / SR / .6, 1) * np.clip((d - np.arange(n) / SR) / 1.0, 0, 1)
    if kind == 'sizzle':
        y = band(rng.standard_normal(n), 2500, 11000) * .05 * (1 + .6 * np.sin(np.arange(n) / SR * 2.3)) + crinkle(d, 900, .2)
    elif kind == 'street':
        y = band(rng.standard_normal(n), 200, 1600) * .06 * (1 + .3 * np.sin(np.arange(n) / SR * .7))
    else:
        y = band(rng.standard_normal(n), 250, 1400) * .045
        for k in range(int(d * 1.5)): ti = rng.uniform(0, d - .5); i = int(ti * SR); c = bell([rng.uniform(2500, 3800)], .2, .05); y[i:i + len(c)] += c[:n - i]
    amb.add(y * e, a, 1, pan=0)
    amb.add(np.roll(y, 3313) * e, a, .6, pan=.6)
for k, a, b in beds:
    if a is not None: bed(k, a, b)

# ---------- trộn ----------
def reverb(L, R, wet=.18, d=2.2):
    n = int(d * SR); t = np.arange(n) / SR; ir = rng.standard_normal(n) * np.exp(-t / (d / 6)); ir = band(ir, 200, 6000); ir /= np.sqrt((ir ** 2).sum())
    M = 1 << int(np.ceil(np.log2(len(L) + n))); I = np.fft.rfft(ir, M)
    wl = np.fft.irfft(np.fft.rfft(L, M) * I, M)[:len(L)]; wr = np.fft.irfft(np.fft.rfft(R, M) * np.roll(I, 0), M)[:len(R)]
    return L + wet * wl, R + wet * np.roll(wr, 211)
mus_L = gtr.L * 1.0 + strg.L * .9 + bau.L * .9 + bass.L * .8 + perc.L * .6
mus_R = gtr.R * 1.0 + strg.R * .9 + bau.R * .9 + bass.R * .8 + perc.R * .6
mus_L, mus_R = reverb(mus_L, mus_R, .22)
fx_L, fx_R = reverb(sfx.L, sfx.R, .1, 1.2)
# vịt nhạc rất nhẹ dưới foley lớn? không cần: foley giấy nhỏ. Lặng: 30.67 → 34.67 nhạc đã ngừng theo bản nhạc.
L = mus_L * .8 + fx_L * 1.0 + amb.L * 1.0
R = mus_R * .8 + fx_R * 1.0 + amb.R * 1.0
L = band(L, 30); R = band(R, 30)
pk = max(np.abs(L).max(), np.abs(R).max()); L /= pk / .89; R /= pk / .89
# fade cuối
fo = int(.6 * SR); L[-fo:] *= np.linspace(1, 0, fo); R[-fo:] *= np.linspace(1, 0, fo)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
out = np.stack([L, R], 1)[:int(DUR * SR)]
with wave.open(os.path.join(HERE, 'out', 'mix.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out, -1, 1) * 32767).astype('<i2').tobytes())
# kiểm năng lượng dải thấp
def rms(x): return 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9)
print('mix.wav', round(DUR, 2), 's · low(20-120)', round(rms(band(L, 20, 120)) - rms(L), 1), 'dB rel')
