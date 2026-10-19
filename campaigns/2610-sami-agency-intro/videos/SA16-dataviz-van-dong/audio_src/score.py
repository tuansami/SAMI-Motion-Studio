"""SA16 score: sonification + heartbeat bed + graphite/paper/wood foley, all synthesized (numpy/scipy).
Reads events.json (node $LIB/core/render/events.mjs <film>) and writes out/<name>.wav (48 kHz stereo).
  $LIB/.venv/bin/python audio_src/score.py <film_dir> [mix.wav]
100 BPM (1 beat = 0.6 s, an 8th = 9 frames). Part 1 (the data) in E minor: a "lub-dub" heartbeat, a low drone,
an FM plonk per quarter (pitch = index value, wood -> metal), ratchet clicks on every step of the frame.
Part 2 (the turn) in G major: FM Rhodes chords, brushed snare, then a soft kick + clap build; Gmaj9 end.
True silences: before the record quarter, before the question, and the breath before the end card."""
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
BEAT = .6
rng = np.random.default_rng(16)
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

def rhodes(m, d=2.4, vel=1.0):
    """FM electric piano: 1:1 FM with a fast-decaying index (tine bark) + a soft bell partial"""
    tt = t_(d); f = mhz(m)
    mod = np.sin(2 * np.pi * f * tt) * (1.6 * np.exp(-tt / .25) + .3)
    x = np.sin(2 * np.pi * f * tt + mod) * np.exp(-tt / 1.3) + .18 * np.sin(2 * np.pi * f * 14 * tt) * np.exp(-tt / .03)
    x *= (1 + .05 * np.sin(2 * np.pi * 4.5 * tt))
    return lp(x, 3800) * np.minimum(1, tt / .003) * np.clip((d - tt) / .3, 0, 1) * vel

def heart(vel=1.0):
    """lub-dub: two soft low thumps"""
    out = np.zeros(int(.6 * SR))
    for dt, v, f0 in [(0, 1, 58), (.16, .62, 66)]:
        d = .3; tt = t_(d); f = f0 + 40 * np.exp(-tt / .025)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .07) + .25 * np.sin(2 * np.pi * np.cumsum(2 * f) / SR) * np.exp(-tt / .04)
        i = int(dt * SR); out[i:i + len(x)] += x * v
    return out * vel

def brush(vel=1.0, d=.22):
    tt = t_(d); return bp(noise(d), 1500, 9000) * np.exp(-tt / .07) * np.minimum(1, tt / .01) * vel

def clap(vel=1.0):
    out = np.zeros(int(.25 * SR))
    for k, dt in enumerate([0, .009, .018, .03]):
        d = .2 if k == 3 else .02; x = bp(noise(d), 900, 4500) * np.exp(-t_(d) / (.06 if k == 3 else .006))
        i = int(dt * SR); out[i:i + len(x)] += x
    return out * vel

def ratchet_click(vel=1.0, big=0):
    """a wooden ratchet tooth: click + short metal ring"""
    d = .12; tt = t_(d)
    x = wood_click(1.0)[:len(tt)] if len(wood_click()) >= len(tt) else np.pad(wood_click(1.0), (0, len(tt) - len(wood_click())))
    x = x + (.35 + .3 * big) * np.sin(2 * np.pi * 3100 * tt) * np.exp(-tt / .02) + .5 * bp(noise(d), 2000, 6000) * np.exp(-tt / .003)
    return x * vel

# ---------- sonification pitch map: E minor pentatonic low, semitones mid, unquantized at the top ----------
PENTA_E = [40, 43, 45, 47, 50, 52, 55, 57, 59, 62, 64, 67, 69, 71, 74, 76, 79]
def pitch_of(v):
    m = 45 + (v - 70) / 150 * 34                        # 80 -> ~47, 216 -> ~78
    if v < 120: return min(PENTA_E, key=lambda p: abs(p - m))
    if v < 190: return round(m)
    return m + .3                                       # extreme: unquantized, a little sharp

silences = [(e['t'], e['t'] + e['d']) for e in EV if e['type'] == 'silence']
B = BEAT
def bt(n): return n * B
chords = [   # (beat0, beat1, pad notes, bass, vel)   E minor part, then G major part
    (0, 8, [52, 59], 28, .4),              # E drone (hook)
    (8, 16, [52, 55, 59, 66], 28, .45),    # Em(add9)
    (16, 20, [55, 59, 64], 28, .45),       # Em
    (20, 24, [52, 55, 59, 64], 36, .45),   # Cmaj7/E-ish
    (24, 28, [57, 60, 64], 33, .45),       # Am
    (28, 32.5, [54, 57, 59, 64], 35, .5),  # B7sus
    (32.5, 36.5, [55, 59, 64], 28, .5),    # Em
    (36.5, 40.5, [55, 60, 64], 36, .55),   # C
    (40.5, 44.5, [57, 62, 66], 38, .6),    # D
    (44.5, 47, [54, 59, 63], 35, .65),     # B (tension, into the silence)
    (48.5, 55, [52, 55, 59, 62], 28, .7),  # Em7 (after the record)
    (55, 64, [55, 60, 64, 67], 36, .5),    # C(add9)/E held
    (64, 68, [57, 60, 64], 33, .5),        # Am (morph)
    (68, 72, [55, 59, 64], 28, .5),        # Em
    (72, 78, [55, 60, 64], 36, .5),        # C
    (78, 84, [54, 59, 63], 35, .45),       # B
]
for b0, b1, ms, bs, v in chords:
    t0, t1 = bt(b0), bt(b1)
    put(mus, pad(ms, t1 - t0 + .9, v * .5), t0, pan=-.12)
    put(mus, pad([m + 12 for m in ms[1:3]], t1 - t0 + .9, v * .14), t0, pan=.3)
    put(mus, sub(bs + 12, t1 - t0 + .4, .13), t0)
    if 32.5 <= b0 < 47:                                  # bass in 8ths once the climb begins
        for i, tp in enumerate(np.arange(t0, t1 - 1e-6, B / 2)): put(mus, pulse(bs + 12, .3 if i % 2 == 0 else .16), tp)
def beats(b0, b1, step=1.0): return [bt(x) for x in np.arange(b0, b1 - 1e-6, step)]
# heartbeat: sparse in the hook, every beat through the data, faster (8ths feel) in the climb
for t in beats(2, 16, 2): put(mus, heart(.5), t)
for t in beats(16, 32.5, 1): put(mus, heart(.42), t)
for t in beats(32.5, 47, 1): put(mus, heart(.5), t); 
for t in beats(32.5, 47, 1): put(mus, hat(.08), t + B / 2, pan=.4)
for t in beats(55, 84, 2): put(mus, heart(.36), t)
# part 2 in G major: Rhodes comping, brushes, then the build
rh = [  # (beat, notes)
    (86, [55, 59, 62, 66]), (90, [54, 57, 62, 66]), (94, [52, 55, 59, 62]), (98, [48, 55, 59, 64]),
    (102, [55, 59, 62, 69]), (106, [54, 57, 62, 66]), (110, [55, 59, 62, 66]), (114, [50, 57, 62, 66]), (118, [48, 55, 60, 64]), (122, [50, 57, 62, 66]),
]
for k, (bb, ms) in enumerate(rh):
    for j, m in enumerate(ms): put(mus, rhodes(m, 2.6, .2 - j * .02), bt(bb) + j * .012, pan=-.25 + j * .15)
    put(mus, rhodes(ms[-1] + 12, 1.0, .08), bt(bb + 1.5), pan=.35)
    put(mus, sub([43, 42, 40, 36, 43, 42, 43, 38, 36, 38][k] + 12, bt(4) + .2, .14), bt(bb))
for t in beats(86, 126, 1): put(mus, brush(.12 if (round(t / B) % 2) else .07), t, pan=.25)
for t in beats(110, 126, 1): put(mus, kick(.34), t)
for t in beats(111, 126, 2): put(mus, clap(.22), t, pan=-.1)
for i, t in enumerate(beats(118, 126, .5)): put(mus, shaker(.1 if i % 2 else .06), t, pan=-.3)
# end: Gmaj9 Rhodes + celesta arpeggio
for m in [43, 55, 59, 62, 66, 69]: put(mus, rhodes(m, 7.0, .2), bt(130), pan=-.1)
for k, (dt, m, v) in enumerate([(0, 79, .4), (.6, 83, .34), (1.2, 86, .32), (2.4, 90, .26), (3.6, 86, .24), (4.8, 83, .22), (6.0, 79, .2)]):
    put(mus, celesta(m, 3.5, v), bt(130) + dt, pan=.25)
put(mus, pad([55, 59, 62, 66, 69], bt(15), .35), bt(130))

# sonification: every quarter is a pitch
for e in EV:
    if e['type'] == 'dot':
        v = e['v']; v01 = np.clip((v - 70) / 150, 0, 1)
        put(mus, plonk(pitch_of(v), v01, .7, .34), e['t'], pan=np.interp(e['i'], [0, 29], [-.6, .6]))
        put(fol, tap(.2), e['t'] - .004, pan=.3)
    elif e['type'] == 'record':
        put(mus, plonk(pitch_of(e['v']), 1.0, 1.6, .9), e['t'], pan=.5); put(fol, puncture(.45), e['t']); put(mus, sub(28, 1.4, .5), e['t'])
    elif e['type'] == 'bar':
        m = pitch_of(150 + e['v'] * 1.3)
        put(mus, plonk(m, np.clip(e['v'] / 50, 0, 1), .5, .26), e['t'], pan=-.3 + e['k'] * .08)
    elif e['type'] == 'ratchet':
        put(fol, ratchet_click(.42 + .05 * e['k'] if e['big'] else .38, e['big']), e['t'], pan=-.35 + .1 * e['k'])

def drop(vel=1.0):
    d = .5; tt = t_(d); f = 1400 * np.exp(-tt / .12) + 300
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / .1) * vel
for e in EV:
    t, ty, d = e['t'], e['type'], e.get('d', .5)
    if ty == 'ruler': put(fol, ruler(d, .22), t, pan=-.2)
    elif ty in ('write', 'draw'): put(fol, scratch(d, .2 if ty == 'write' else .24, seed=int(t * 10)), t, pan=.15)
    elif ty == 'scratch': put(fol, scratch(d, .26, seed=int(t * 7)), t, pan=.1)
    elif ty == 'flip': put(fol, wood_click(.32), t, pan=.35)
    elif ty == 'puncture': put(fol, puncture(.55), t); put(mus, sub(28, 1.6, .55), t); put(mus, plonk(pitch_of(215.8), 1.0, 1.4, .5), t, pan=.4)
    elif ty == 'sweep': put(fol, paper_sweep(d, .3), t, pan=-.2)
    elif ty == 'whoosh': put(fol, sfx.whoosh(d, .14), t)
    elif ty == 'type': put(fol, type_clicks(d, .3), t, pan=-.1)
    elif ty == 'stamp': put(fol, pop(.4), t, pan=-.2 + .12 * e['k']); put(fol, tap(.3), t); put(mus, celesta(79 + [0, 4, 7, 12][e['k']], 1.0, .14), t, pan=.3)
    elif ty == 'tick': put(fol, scratch(.25, .32, seed=40 + e['k']), t, pan=.1)
    elif ty == 'rise': put(fol, ink_swell(d, .4), t); put(fol, sfx.whoosh(d, .16), t)
    elif ty == 'logo': put(fol, subhit(.75), t)
    elif ty == 'pop': put(fol, pop(.45), t, pan=.1)
# beds: a paper room everywhere; a warm far restaurant murmur (filtered noise) J-cut in with the question
room = lp(noise(N / SR), 500) * .012
fol[:, 0] += room; fol[:, 1] += np.roll(room, 2400)
tt = np.arange(N) / SR
mur = bp(noise(N / SR), 250, 1100) * (1 + .3 * np.sin(2 * np.pi * .4 * tt)) * .018 * np.clip((tt - bt(86)) / 4, 0, 1) * (1 - np.clip((tt - bt(124)) / 2, 0, 1))
fol[:, 0] += mur; fol[:, 1] += np.roll(mur, 1800)

mix = mus * .9 + fol * 1.0
gate = np.ones(N)
for a, b in silences:
    i, j = int(a * SR), int(b * SR); gate[i:j] = 0
    r = int(.006 * SR); gate[i - r:i] = np.minimum(gate[i - r:i], np.linspace(1, 0, r)); gate[j:j + r] = np.minimum(gate[j:j + r], np.linspace(0, 1, r))
mix *= gate[:, None]
end = int(DUR * SR); mix[end - int(1.2 * SR):end] *= np.linspace(1, 0, int(1.2 * SR))[:, None]; mix[end:] = 0
mix = mix[:end]
# keep the lows in check (synth scores get bass-heavy): gentle low shelf cut below 110 Hz
lowband = np.stack([lp(mix[:, 0], 110), lp(mix[:, 1], 110)], 1); mix = mix - .45 * lowband
mix = np.stack([sfx.compress(mix[:, 0], .3, 2.5), sfx.compress(mix[:, 1], .3, 2.5)], 1)
from scipy.ndimage import maximum_filter1d, uniform_filter1d
pk = np.abs(mix).max(1); ceil = np.percentile(pk[pk > 0], 99.7) if (pk > 0).any() else 1
n = int(.006 * SR); gm = np.minimum(1, ceil / np.maximum(maximum_filter1d(pk, 2 * n + 1), 1e-9)); gm = uniform_filter1d(gm, n)
mix = mix * gm[:, None]
mix = mix / (np.abs(mix).max() + 1e-9) * .89
mix *= gate[:end, None]
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
outp = os.path.join(HERE, 'out', sys.argv[2] if len(sys.argv) > 2 else 'mix.wav')
sf.write(outp, mix.astype(np.float32), SR, subtype='PCM_24')
x = mix[:, 0][::4]; x = x[:2 ** 20]
spec = np.abs(np.fft.rfft(x)); fr = np.fft.rfftfreq(len(x), 4 / SR)
lo = (spec[(fr > 20) & (fr < 120)] ** 2).sum(); rest = (spec[(fr >= 120) & (fr < 8000)] ** 2).sum()
print(outp, f'{len(mix) / SR:.2f}s', 'low/rest dB %.1f' % (10 * np.log10(lo / rest)))
