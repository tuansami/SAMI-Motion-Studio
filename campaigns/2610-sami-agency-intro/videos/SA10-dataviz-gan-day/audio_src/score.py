"""SA10 score: sonification + warm bed + paper/graphite foley, all synthesized (numpy/scipy).
Reads events.json (node $LIB/core/render/events.mjs <film>) and writes out/mix.wav (48 kHz stereo).
  $LIB/.venv/bin/python audio_src/score.py <film_dir>
Pitch = value (FM kalimba plonk, wood -> metal as the value rises); 90 BPM, 1/16 = 5 frames; bass pulse in 8ths;
true silences before the record month (8/2025), before the map, and the breath before the end card."""
import json, sys, os
import numpy as np
import soundfile as sf
sys.path.insert(0, os.path.join(os.environ.get('LIB', '/home/user/lemo-opuscar'), 'core', 'audio'))
import sfx
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, add

HERE = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EVJ = json.load(open(os.path.join(HERE, 'events.json')))
DUR = EVJ['dur']; EV = EVJ['ev']
N = int(DUR * SR) + SR
BEAT = 2 / 3
rng = np.random.default_rng(10)
mus = np.zeros((N, 2)); fol = np.zeros((N, 2))

def mhz(m): return 440.0 * 2 ** ((m - 69) / 12)
def put(buf, x, at, gain=1.0, pan=0.0):
    i = int(round(at * SR))
    if i >= len(buf) or i + len(x) <= 0: return
    if i < 0: x = x[-i:]; i = 0
    x = x[:len(buf) - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(x), 0] += x * gain * l * 1.414; buf[i:i + len(x), 1] += x * gain * r * 1.414

# ---------- instruments ----------
def plonk(m, v01, d=1.1, vel=1.0):
    """low-pass-gate plonk: sine + FM; the FM index rises with the value (wood -> metal)"""
    tt = t_(d); f = mhz(m); idx = .4 + 3.2 * v01
    mod = np.sin(2 * np.pi * f * 3.5 * tt) * idx * np.exp(-tt / (.08 + .12 * v01))
    x = np.sin(2 * np.pi * f * tt + mod) * np.exp(-tt / (.18 + .25 * v01))
    x += .25 * np.sin(2 * np.pi * f * 2 * tt) * np.exp(-tt / .1)
    x = lp(x, 1800 + 5000 * v01)
    a = np.minimum(1, tt / .003)
    return x * a * vel

def celesta(m, d=2.6, vel=1.0):
    tt = t_(d); f = mhz(m)
    x = sum(a * np.sin(2 * np.pi * f * r * tt) * np.exp(-tt / tau) for r, a, tau in [(1, 1, 1.1), (2, .35, .5), (3.01, .18, .25), (4.2, .1, .12)])
    return x * np.minimum(1, tt / .002) * vel

def piano(m, d=3.0, vel=1.0):
    tt = t_(d); f = mhz(m)
    x = sum(a * np.sin(2 * np.pi * f * k * tt * (1 + .0004 * k * k)) * np.exp(-tt / (1.6 / k ** .7)) for k, a in [(1, 1), (2, .5), (3, .28), (4, .15), (5, .08)])
    x += .3 * hp(noise(d), 2000) * np.exp(-tt / .006)
    return lp(x, 4200) * np.minimum(1, tt / .002) * vel

def pad(ms, d, vel=1.0):
    tt = t_(d)
    x = np.zeros(len(tt))
    for m in ms:
        for det in (-.11, .0, .12):
            f = mhz(m + det); x += (2 * ((tt * f + rng.random()) % 1) - 1)
    x = lp(lp(x, 900), 1400) / (len(ms) * 3)
    att = np.minimum(1, tt / 1.2); rel = np.minimum(1, (d - tt) / 1.0)
    return x * att * np.clip(rel, 0, 1) * vel

def sub(m, d, vel=1.0):
    tt = t_(d); f = mhz(m)
    x = np.sin(2 * np.pi * f * tt) + .25 * np.sin(2 * np.pi * 2 * f * tt) + .12 * np.sin(2 * np.pi * 3 * f * tt)
    return x * np.minimum(1, tt / .05) * np.clip((d - tt) / .3, 0, 1) * vel

def kick(vel=1.0):
    d = .35; tt = t_(d); f = 52 + 80 * np.exp(-tt / .03)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .09) + .2 * bp(noise(d), 1500, 5000) * np.exp(-tt / .004)
    return x * vel * .6

def shaker(vel=1.0):
    d = .07; return hp(noise(d), 5000) * np.exp(-t_(d) / .018) * vel

def hat(vel=1.0):
    d = .05; return lp(hp(noise(d), 6000), 9000) * np.exp(-t_(d) / .012) * vel

# ---------- foley (graphite, paper, wood) ----------
def tap(vel=1.0):
    d = .05; tt = t_(d)
    return (bp(noise(d), 1800, 6000) * np.exp(-tt / .004) + .4 * np.sin(2 * np.pi * 900 * tt) * np.exp(-tt / .006)) * vel

def scratch(d, vel=1.0, seed=0):
    tt = t_(d); r = np.random.default_rng(seed)
    am = np.abs(np.sin(2 * np.pi * (7 + 3 * r.random()) * tt + r.random() * 6)) ** 2 * (.6 + .4 * np.sin(2 * np.pi * 2.3 * tt))
    x = bp(noise(d), 2500, 7500) * am
    return x * np.clip(np.minimum(tt / .02, (d - tt) / .05), 0, 1) * vel

def ruler(d, vel=1.0):
    tt = t_(d); x = noise(d); out = np.zeros_like(x)
    for i in range(0, len(x), 960):
        j = min(len(x), i + 960); f = 1500 + 3500 * i / len(x); out[i:j] = bp(x[max(0, i - 3000):j], f * .8, f * 1.25)[-(j - i):]
    return out * np.sin(np.pi * tt / d) ** .6 * vel

def wood_click(vel=1.0):
    d = .08; tt = t_(d)
    return (np.sin(2 * np.pi * 1100 * tt) * np.exp(-tt / .012) + .6 * np.sin(2 * np.pi * 2300 * tt) * np.exp(-tt / .006) + .3 * bp(noise(d), 800, 4000) * np.exp(-tt / .004)) * vel

def puncture(vel=1.0):
    d = .5; tt = t_(d)
    return (bp(noise(d), 300, 3500) * np.exp(-tt / .05) + .6 * np.sin(2 * np.pi * 70 * tt) * np.exp(-tt / .12)) * vel

def paper_sweep(d, vel=1.0):
    tt = t_(d); return lp(bp(noise(d), 400, 4000), 3000) * np.sin(np.pi * tt / d) ** 1.5 * vel

def type_clicks(d, vel=1.0):
    out = np.zeros(int(d * SR) + 4000); k = 0; t = 0.0
    while t < d: put1 = sfx.click(1.4 + .2 * rng.random(), .25); i = int(t * SR); out[i:i + len(put1)] += put1; t += .045 + .03 * rng.random()
    return out * vel

def ink_swell(d, vel=1.0):
    tt = t_(d); return lp(noise(d), 260) * (tt / d) ** 2 * vel

def pop(vel=1.0):
    d = .12; tt = t_(d); f = 500 + 900 * np.exp(-tt / .02)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .04) * vel

def subhit(vel=1.0):
    d = 2.5; tt = t_(d); f = 41 + 30 * np.exp(-tt / .06)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .7) + .15 * lp(noise(d), 200) * np.exp(-tt / .2)) * vel


def blip(m, vel=1.0):
    """sample-and-hold blip: a short square-ish tone through a low-pass"""
    d = .09; tt = t_(d); f = mhz(m)
    x = np.sign(np.sin(2 * np.pi * f * tt)) * .5 + np.sin(2 * np.pi * f * 2 * tt) * .3
    return lp(x, 2600) * np.exp(-tt / .03) * vel

def pulse(m, vel=1.0):
    """bass pulse: plucked sine with 2nd/3rd harmonics so it speaks on phone speakers"""
    d = .3; tt = t_(d); f = mhz(m)
    x = np.sin(2 * np.pi * f * tt) + .35 * np.sin(2 * np.pi * 2 * f * tt) + .15 * np.sin(2 * np.pi * 3 * f * tt)
    return x * np.minimum(1, tt / .004) * np.exp(-tt / .11) * vel

# ---------- sonification pitch map (D minor pentatonic low, semitones mid, unquantized near the record) ----------
PENTA_D = [50, 53, 55, 57, 60, 62, 65, 67, 69, 72, 74, 77, 79, 81]
def pitch_of(v):
    m = 50 + v / 100 * 36                                # 0 -> D3, 100 -> D6
    if v < 40: return min(PENTA_D, key=lambda p: abs(p - m))
    if v < 90: return round(m)
    return m + .3                                        # extreme: unquantized, a little sharp

silences = [(e['t'], e['t'] + e['d']) for e in EV if e['type'] == 'silence']
B = BEAT
def bt(n): return n * B
chords = [   # (beat0, beat1, pad notes, bass, vel)
    (0, 10, [62, 69], 38, .45),            # D drone
    (10, 16, [62, 65, 69, 76], 38, .5),    # Dm(add9)
    (16, 20, [58, 62, 65, 69], 34, .5),    # Bbmaj7
    (20, 24, [60, 64, 67], 36, .5),        # C
    (24, 30, [62, 65, 69], 38, .55),       # Dm
    (30, 34, [60, 65, 69], 41, .55),       # F
    (34, 38, [60, 64, 67], 36, .6),        # C
    (38, 41, [62, 67, 71], 43, .6),        # G
    (42, 50, [62, 65, 69, 72], 38, .65),   # Dm7 (after the record)
    (50, 54, [58, 62, 65], 34, .6),        # Bb
    (54, 58, [60, 65, 69], 33, .6),        # F/A
    (58, 62, [58, 62, 67], 43, .55),       # Gm
    (62, 66, [61, 64, 69], 45, .6),        # A (held, open)
    (66, 70, [62, 65, 69], 38, .55),       # Dm
    (70, 75, [58, 62, 65, 69], 34, .55),   # Bbmaj7
    (75, 80, [60, 64, 67], 36, .55),       # C
    (81, 90, [58, 62, 67], 43, .4),        # Gm (thin: the pain)
    (90, 104, [62, 65, 69], 38, .4),       # Dm
    (104, 108, [58, 62, 65], 34, .55),     # Bb
    (108, 112, [60, 64, 67], 36, .6),      # C
    (112, 117.5, [62, 66, 69], 38, .65),   # D (lift)
    (119.5, 134.5, [62, 66, 69, 73, 76], 38, .75),  # Dmaj9 end
]
for b0, b1, ms, bs, v in chords:
    t0, t1 = bt(b0), bt(b1)
    put(mus, pad(ms, t1 - t0 + .9, v * .5), t0, pan=-.12)
    put(mus, pad([m + 12 for m in ms[1:3]], t1 - t0 + .9, v * .16), t0, pan=.3)
    put(mus, sub(bs, t1 - t0 + .4, .12), t0)
    # bass pulse in 8ths from the smartphone years on (not in the thin, painful map section)
    if 24 <= b0 < 81 or b0 >= 104 and b0 < 119:
        for i, tp in enumerate(np.arange(t0, t1 - 1e-6, B / 2)): put(mus, pulse(bs + 12, .3 if i % 2 == 0 else .18), tp)
# kick + hats
def beats(b0, b1, step=1.0): return [bt(x) for x in np.arange(b0, b1 - 1e-6, step)]
for t in beats(16, 41): put(mus, kick(.32), t)
for t in beats(24.5, 41): put(mus, hat(.1), t, pan=.4)
for t in beats(50, 80): put(mus, kick(.3), t)
for t in beats(50.5, 80, 1): put(mus, hat(.09), t, pan=.4)
for t in beats(104, 117.5): put(mus, kick(.38), t)
for i, t in enumerate(beats(104, 117.5, .25)): put(mus, shaker(.12 if i % 2 else .07), t, pan=-.3)
# sample-and-hold blips (seeded), sparse in the hook and in the map section
r2 = np.random.default_rng(3)
for t in beats(1, 10, 1.5): put(mus, blip(PENTA_D[r2.integers(6, 13)], .1), t, pan=r2.uniform(-.6, .6))
for t in beats(84, 104, 2): put(mus, blip(PENTA_D[r2.integers(5, 11)], .08), t, pan=r2.uniform(-.6, .6))
# end: tonic celesta + piano
for k, (dt, m, v) in enumerate([(0, 74, .45), (.67, 78, .38), (1.33, 81, .36), (2.67, 86, .3), (4.0, 81, .28), (5.33, 78, .26), (6.67, 74, .25)]):
    put(mus, celesta(m, 3.5, v), bt(120.5) + dt, pan=.25)
for m in [38, 50, 57, 62, 66]: put(mus, piano(m, 6.0, .28), bt(120.5), pan=-.1)

# sonification: every month is a pitch; early years sound once per year (their values are near zero)
for e in EV:
    if e['type'] == 'dot':
        v, r, mo = e['v'], e['r'], e['m']; v01 = np.clip(v / 100, 0, 1)
        if r <= 14 and mo != 0: continue
        if r <= 14: vv = np.mean([x['v'] for x in EV if x['type'] == 'dot' and x['r'] == r]); m = pitch_of(vv); vel = .28 + vv / 60; dd = .6
        else: m = pitch_of(v); vel = .3 if r >= 18 else .38; dd = .45 if r >= 18 else .6
        if abs(e['t'] - 28.0) < .02: vel = .85; dd = 1.4                 # the record: first sound after the silence
        put(mus, plonk(m, v01, dd, vel), e['t'], pan=np.interp(mo, [0, 11], [-.55, .55]))
        put(fol, tap(.16 if r >= 18 else .22), e['t'] - .004, pan=.3)
    elif e['type'] == 'land':
        put(mus, plonk(pitch_of(e['v']) + 12, np.clip(e['v'] / 100, 0, 1), .35, .12), e['t'], pan=np.interp(e['i'], [0, 272], [-.6, .6]))
    elif e['type'] == 'unit':
        m = [62, 65, 67, 69, 72, 74][e['k'] % 6] + (12 if e['w'] == 0 and e['k'] > 60 else 0)
        put(fol, tap(.12), e['t'], pan=-.2 if e['w'] == 0 else .25)
        if e['k'] % 3 == 0: put(mus, plonk(m - (12 if e['w'] else 0), .5 if e['w'] == 0 else .2, .3, .16), e['t'])

def drop(vel=1.0):
    d = .5; tt = t_(d); f = 1400 * np.exp(-tt / .12) + 300
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .1) * vel
for e in EV:
    t, ty, d = e['t'], e['type'], e.get('d', .5)
    if ty == 'ruler': put(fol, ruler(d, .22), t, pan=-.2)
    elif ty in ('write', 'draw'): put(fol, scratch(d, .2 if ty == 'write' else .17, seed=int(t * 10)), t, pan=.15)
    elif ty == 'scratch': put(fol, scratch(d, .26, seed=int(t * 7)), t, pan=.1)
    elif ty == 'strike': put(fol, scratch(d, .45, seed=3), t, pan=-.1)
    elif ty == 'flip': put(fol, wood_click(.35), t, pan=.35)
    elif ty == 'punch': put(fol, puncture(.5), t); put(mus, sub(38, 1.0, .45), t)
    elif ty == 'sweep': put(fol, paper_sweep(d, .3), t, pan=-.2)
    elif ty == 'whoosh': put(fol, sfx.whoosh(d, .14), t)
    elif ty == 'tapdot': put(fol, tap(.45), t); put(mus, plonk(74, .3, .6, .3), t)
    elif ty == 'drop': put(fol, drop(.25), t - .45); put(fol, tap(.35), t)
    elif ty == 'tick':
        for k in range(6): put(fol, tap(.18), t + k * d / 6, pan=-.4 + k * .16)
    elif ty == 'type': put(fol, type_clicks(d, .3), t, pan=-.1)
    elif ty == 'pin': put(fol, pop(.5 if e.get('big') else .3), t, pan=.15); 
    elif ty == 'stars':
        for k in range(5): put(mus, celesta(81 + [0, 2, 4, 7, 9][k], 1.2, .18), t + k * d / 8, pan=.3)
    elif ty == 'tap': put(fol, tap(.3), t)
    elif ty == 'ink': put(fol, ink_swell(d, .4), t); put(fol, sfx.whoosh(d, .15), t)
    elif ty == 'logo': put(fol, subhit(.75), t)
    elif ty == 'pop': put(fol, pop(.45 if e.get('v', 1) >= 1 else .3), t, pan=.1)
# beds: a paper room everywhere; a far street (filtered noise) from the smartphone years, J-cut into the map
room = lp(noise(N / SR), 500) * .012
fol[:, 0] += room; fol[:, 1] += np.roll(room, 2400)
tt = np.arange(N) / SR
street = bp(noise(N / SR), 180, 900) * .02 * np.clip((tt - bt(24)) / 6, 0, 1) * (1 - np.clip((tt - bt(110)) / 4, 0, 1))
street *= (1 - .6 * np.clip((tt - bt(42)) / 1, 0, 1) * (1 - np.clip((tt - bt(80)) / 1, 0, 1))) + .6 * np.clip((tt - bt(76)) / 4, 0, 1) * (tt < bt(80))
fol[:, 0] += street; fol[:, 1] += np.roll(street, 1800)

mix = mus * .9 + fol * 1.0
# true digital silence (all layers), with 6 ms edges; tails do not leak over it
gate = np.ones(N)
for a, b in silences:
    i, j = int(a * SR), int(b * SR); gate[i:j] = 0
    r = int(.006 * SR); gate[i - r:i] = np.minimum(gate[i - r:i], np.linspace(1, 0, r)); gate[j:j + r] = np.minimum(gate[j:j + r], np.linspace(0, 1, r))
mix *= gate[:, None]
# fade out at the end
end = int(DUR * SR); mix[end - int(1.2 * SR):end] *= np.linspace(1, 0, int(1.2 * SR))[:, None]; mix[end:] = 0
mix = mix[:end]
mix = np.stack([sfx.compress(mix[:, 0], .3, 2.5), sfx.compress(mix[:, 1], .3, 2.5)], 1)
# tame hot transients (linked stereo look-ahead limiter) so the loudnorm stage keeps true peak under -1.2 dB
from scipy.ndimage import maximum_filter1d, uniform_filter1d
pk = np.abs(mix).max(1); ceil = np.percentile(pk[pk > 0], 99.7) if (pk > 0).any() else 1
n = int(.006 * SR); gm = np.minimum(1, ceil / np.maximum(maximum_filter1d(pk, 2 * n + 1), 1e-9)); gm = uniform_filter1d(gm, n)
mix = mix * gm[:, None]
mix = mix / (np.abs(mix).max() + 1e-9) * .89
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
outp = os.path.join(HERE, 'out', sys.argv[2] if len(sys.argv) > 2 else 'mix.wav')
sf.write(outp, mix.astype(np.float32), SR, subtype='PCM_24')
# band check
spec = np.abs(np.fft.rfft(mix[:, 0][::4][:2 ** 20] if len(mix) > 2 ** 22 else mix[:, 0][::4]))
fr = np.fft.rfftfreq(len(mix[:, 0][::4][:2 ** 20]) if len(mix) > 2 ** 22 else len(mix[:, 0][::4]), 4 / SR)
lo = (spec[(fr > 20) & (fr < 120)] ** 2).sum(); rest = (spec[(fr >= 120) & (fr < 8000)] ** 2).sum()
print(outp, f'{len(mix) / SR:.2f}s', 'low/rest dB %.1f' % (10 * np.log10(lo / rest)))
