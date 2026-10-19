"""SA04 score: sonification + warm bed + paper/graphite foley, all synthesized (numpy/scipy).
Reads events.json (node $LIB/core/render/events.mjs <film>) and writes out/mix.wav (48 kHz stereo).
  $LIB/.venv/bin/python audio_src/score.py <film_dir>
Pitch = value (wood plonk -> metal as the value rises); 75 BPM, 1/16 = 0.2 s; true silences before April 2020,
before the headline is revised, and the breath before the end card."""
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
BEAT = 0.8
rng = np.random.default_rng(4)
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
    mod = np.sin(2 * np.pi * f * 3.0 * tt) * idx * np.exp(-tt / (.08 + .12 * v01))
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

# ---------- sonification pitch map ----------
PENTA_F = [65, 67, 69, 72, 74, 77, 79, 81, 84]          # F major pentatonic (F4..A5..C6)
def pitch_of(v, series):
    m = 52 + (v / 120) * 34                              # 0 -> E3, 120 -> D6
    if v >= 80:                                          # near the reference: snap to the pentatonic
        return min(PENTA_F, key=lambda p: abs(p - m))
    if v >= 45: return round(m)                          # middle: semitones
    return m - .35                                       # extreme: unquantized, a little flat

# ---------- the score ----------
silences = [(e['t'], e['t'] + e['d']) for e in EV if e['type'] == 'silence']

# harmony bed (sections in seconds)
chords = [
    (0.0, 8.0, [53, 57, 60], 41, .5),          # F
    (8.0, 17.6, [53, 57, 60, 64], 41, .6),     # Fmaj7
    (17.6, 19.6, [50, 53, 57], 38, .6),        # Dm
    (20.8, 25.6, [50, 53, 57], 38, .55),       # Dm
    (25.6, 29.6, [46, 50, 53], 34, .55),       # Bb
    (29.6, 35.2, [46, 50, 53, 57], 34, .6),    # Bbmaj7
    (35.2, 42.4, [43, 46, 50], 31, .6),        # Gm
    (42.4, 48.0, [46, 50, 53, 57], 34, .65),   # Bbmaj7
    (48.0, 53.6, [48, 52, 55], 36, .65),       # C
    (54.4, 59.2, [50, 53, 57], 38, .45),       # Dm
    (59.2, 63.2, [46, 50, 53], 34, .5),        # Bb
    (63.2, 67.2, [48, 52, 55, 58], 36, .6),    # C7
    (67.2, 72.0, [53, 57, 60], 41, .65),       # F
    (72.0, 76.0, [46, 50, 53, 57], 34, .6),    # Bbmaj7 (open, before the breath)
    (77.2, 89.6, [53, 57, 60, 64], 41, .75),   # Fmaj7 end
]
for t0, t1, ms, b, v in chords:
    ms = [m + 12 if m < 48 else m for m in ms]
    put(mus, pad(ms, t1 - t0 + .9, v * .55), t0, pan=-.1)
    put(mus, pad([m + 12 for m in ms[1:]], t1 - t0 + .9, v * .2), t0, pan=.25)
    put(mus, sub(b, t1 - t0 + .4, .14), t0)

# opening: celesta floating two notes
for t, m in [(0.4, 77), (2.0, 72), (3.6, 81), (5.2, 79), (6.8, 76)]: put(mus, celesta(m, 2.6, .28), t, pan=.3)
# rhythm: soft kick + hats in B; shaker 16ths in D; kick again in G/H
def beats(t0, t1, step): return np.arange(t0, t1 - 1e-6, step)
for t in beats(8.0, 17.6, BEAT): put(mus, kick(.35), t)
for t in beats(8.4, 17.6, BEAT): put(mus, hat(.12), t, pan=.4)
for t in beats(21.6, 29.6, BEAT * 2): put(mus, kick(.25), t)
for t in beats(29.6, 42.4, BEAT): put(mus, kick(.4), t)
for i, t in enumerate(beats(29.6, 42.4, .2)): put(mus, shaker(.12 if i % 2 else .2), t, pan=-.35)
for t in beats(42.4, 53.6, BEAT): put(mus, kick(.33), t)
for t in beats(42.8, 53.6, BEAT): put(mus, hat(.14), t, pan=.4)
for t in beats(64.0, 76.0, BEAT): put(mus, kick(.38), t)
for i, t in enumerate(beats(64.0, 76.0, .4)): put(mus, shaker(.14 if i % 2 else .1), t, pan=-.3)
# after the hush: the revision is accompanied by celesta + piano
for t, m, v in [(54.4, 74, .4), (55.2, 77, .3), (56.0, 81, .32), (57.6, 79, .3), (59.2, 77, .3), (60.8, 74, .28)]:
    put(mus, celesta(m, 3.0, v), t, pan=.2); put(mus, piano(m - 24, 3.2, v * .6), t, pan=-.2)
# end card: tonic celesta + piano chord
for t, m, v in [(78.0, 77, .5), (78.4, 81, .4), (78.8, 84, .38), (80.0, 72, .3), (81.6, 77, .3), (83.2, 81, .28), (84.8, 84, .26)]: put(mus, celesta(m, 3.5, v), t, pan=.25)
for m in [41, 53, 57, 60, 65]: put(mus, piano(m, 6.0, .3), 78.0, pan=-.1)

# sonification: every real mark is a pitch; the nominal line rings brighter
for e in EV:
    if e['type'] != 'dot': continue
    v = e['v']; m = pitch_of(v, e['series']); v01 = np.clip(v / 115, 0, 1)
    dense = e['t'] > 29.5 and e['series'] == 'real'
    if e['series'] == 'nom': v01 = min(1, v01 + .25)
    gap = .2 if dense else .4 if e['t'] > 21.5 else .8
    vel = (.32 if dense else .5) * (1.0 if e['series'] == 'real' else .55)
    if 20.7 < e['t'] < 20.9: vel = .8                           # April 2020: first sound after the silence
    put(mus, plonk(m, v01, min(1.5 * gap + .25, 1.3), vel), e['t'], pan=np.interp(e.get('i', 0), [0, 90], [-.5, .5]))
    if e['series'] == 'real': put(fol, tap(.18 if dense else .3), e['t'] - .005, pan=.3)

# foley from events
for e in EV:
    t, ty, d = e['t'], e['type'], e.get('d', .5)
    if ty == 'ruler': put(fol, ruler(d, .22), t, pan=-.2)
    elif ty == 'write': put(fol, scratch(d, .2, seed=int(t * 10)), t, pan=.15)
    elif ty == 'scratch': put(fol, scratch(d, .28, seed=int(t * 7)), t, pan=.1)
    elif ty == 'strike': put(fol, scratch(d, .5, seed=3), t, pan=-.1)
    elif ty == 'flip': put(fol, wood_click(.35), t, pan=.35)
    elif ty == 'punch': put(fol, puncture(.55), t); put(mus, sub(38, .9, .5), t)
    elif ty == 'sweep': put(fol, paper_sweep(d, .2), t, pan=-.2)
    elif ty == 'tick':
        for k in range(4): put(fol, tap(.25), t + k * .2, pan=.4)
    elif ty == 'unfold': put(fol, paper_sweep(d, .35), t); put(fol, sfx.whoosh(.6, .12), t + .3)
    elif ty == 'type': put(fol, type_clicks(d, .35), t, pan=-.1)
    elif ty == 'ink': put(fol, ink_swell(d, .35), t)
    elif ty == 'logo': put(fol, subhit(.75), t)
    elif ty == 'pop': put(fol, pop(.45), t, pan=.1)
# light room bed (paper room), never during the silences
tt = np.arange(N) / SR
room = lp(noise(N / SR), 500) * .012
fol[:, 0] += room; fol[:, 1] += np.roll(room, 2400)

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
mix = mix / (np.abs(mix).max() + 1e-9) * .89
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
outp = os.path.join(HERE, 'out', sys.argv[2] if len(sys.argv) > 2 else 'mix.wav')
sf.write(outp, mix.astype(np.float32), SR, subtype='PCM_24')
# band check
spec = np.abs(np.fft.rfft(mix[:, 0][::4][:2 ** 20] if len(mix) > 2 ** 22 else mix[:, 0][::4]))
fr = np.fft.rfftfreq(len(mix[:, 0][::4][:2 ** 20]) if len(mix) > 2 ** 22 else len(mix[:, 0][::4]), 4 / SR)
lo = (spec[(fr > 20) & (fr < 120)] ** 2).sum(); rest = (spec[(fr >= 120) & (fr < 8000)] ** 2).sum()
print(outp, f'{len(mix) / SR:.2f}s', 'low/rest dB %.1f' % (10 * np.log10(lo / rest)))
