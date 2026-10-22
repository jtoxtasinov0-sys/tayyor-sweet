#!/usr/bin/env python3
"""Ovoz: effektlar (SFX) va yengil fon musiqasi — hammasi kodda sintez qilinadi (tashqi fayl/litsenziya yo'q).
Ovozli matn (voice) berilgan bo'lsa — u asosiy, musiqa va effektlar uning ostida pasaytiriladi.
Ishlatish: python3 audio.py cues.json chiqish.wav
cues.json — render.mjs --cues bergan fayl: {dur, cues:[{t, s, g}], voice: fayl|null, ...}"""
import json
import os
import subprocess
import sys
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def T(dur):
    return np.arange(int(dur * SR)) / SR


def glide(f0, f1, dur, curve=1.0):
    """f0→f1 ga siljuvchi chastota uchun faza"""
    t = T(dur)
    k = (t / dur) ** curve
    f = f0 * (f1 / f0) ** k
    return 2 * np.pi * np.cumsum(f) / SR


def fade_in(x, d=0.003):
    n = min(len(x), int(d * SR))
    x[:n] *= np.linspace(0, 1, n)
    return x


def svf(x, fc, q=0.7, mode='band'):
    """Chamberlin filtri; fc — son yoki massiv (vaqt bo'yicha o'zgaruvchi)"""
    fc = np.broadcast_to(np.asarray(fc, dtype=float), x.shape)
    f = 2 * np.sin(np.pi * np.minimum(fc, SR / 7) / SR)
    low = band = 0.0
    out = np.empty_like(x)
    damp = 1 / q
    for i in range(len(x)):
        low += f[i] * band
        high = x[i] - low - damp * band
        band += f[i] * high
        out[i] = band if mode == 'band' else low if mode == 'low' else high
    return out


def bell(freq, dur=1.2, tau=0.5, parts=((1, 1), (2.0, 0.35), (3.0, 0.18), (4.2, 0.1)), detune=0.0):
    t = T(dur)
    y = np.zeros_like(t)
    for m, a in parts:
        y += a * np.sin(2 * np.pi * freq * m * (1 + detune) * t) * np.exp(-t / (tau / m ** 0.6))
    return fade_in(y, 0.002)


def marimba(freq, dur=0.5, tau=0.18):
    t = T(dur)
    y = np.sin(2 * np.pi * freq * t) * np.exp(-t / tau) + 0.3 * np.sin(2 * np.pi * freq * 3.93 * t) * np.exp(-t / (tau * 0.25))
    return fade_in(y, 0.001)


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def env_ar(n, a, r):
    """a — ko'tarilish ulushi (0..1), qolgani so'nish; egri silliq"""
    x = np.linspace(0, 1, n)
    e = np.where(x < a, np.sin(np.pi / 2 * x / max(a, 1e-6)) ** 2, np.cos(np.pi / 2 * (x - a) / max(1 - a, 1e-6)) ** 2)
    return e ** r


def whoosh(dur=0.55, f0=400, f1=3200, q=1.2, peak=0.45):
    n = int(dur * SR)
    fc = f0 * (f1 / f0) ** np.linspace(0, 1, n) ** 0.8
    y = svf(noise(dur), fc, q) * env_ar(n, peak, 1.2)
    body = np.sin(glide(110, 70, dur)) * env_ar(n, peak, 1.5) * 0.25
    return y * 0.9 + body


# ---------- Effektlar (mono, keyin panorama) ----------
def sfx_tap():
    t = T(0.06)
    y = np.sin(glide(2100, 1300, 0.06)) * np.exp(-t / 0.012) * 0.7
    y[:96] += svf(noise(0.002), 6000, 0.8) * 0.5
    return fade_in(y, 0.0005)


def sfx_hold():
    # telefon tebranishi: past "brrr", sekin kuchayadi
    d = 0.7
    t = T(d)
    ph = glide(150, 185, d)
    y = (np.sin(ph) + 0.35 * np.sin(3 * ph)) * (0.55 + 0.45 * np.sin(2 * np.pi * 32 * t)) * np.linspace(0.15, 1, len(t)) ** 1.5
    y *= np.minimum(1, (d - t) / 0.03)
    return y * 0.35


def sfx_thud():
    t = T(0.12)
    y = np.sin(glide(120, 55, 0.12)) * np.exp(-t / 0.035)
    y[:120] += svf(noise(0.0025), 2500) * 0.4
    return fade_in(y, 0.0008) * 0.8


def sfx_send():
    n = int(0.2 * SR)
    y = svf(noise(0.2), 700 * (5.0 ** np.linspace(0, 1, n)), 1.8) * env_ar(n, 0.6, 1.3) * 0.5
    y[: int(0.06 * SR)] += np.sin(glide(700, 1400, 0.06)) * np.exp(-T(0.06) / 0.03) * 0.35
    return y


def sfx_recv():
    a = marimba(880, 0.6, 0.16)
    b = marimba(1318.5, 0.7, 0.2)
    y = np.zeros(int(0.8 * SR))
    y[: len(a)] += a * 0.5
    o = int(0.09 * SR)
    y[o : o + len(b)] += b * 0.55
    return y


def sfx_sheet():
    n = int(0.32 * SR)
    return svf(noise(0.32), 300 * (6 ** np.linspace(0, 1, n)), 0.9, 'band') * env_ar(n, 0.35, 1.5) * 0.35


def sfx_copy():
    y = np.zeros(int(0.35 * SR))
    for i, f in enumerate([2637, 3520]):
        b = bell(f, 0.25, 0.06, ((1, 1), (2.01, 0.2)))
        o = int(i * 0.06 * SR)
        y[o : o + len(b)] += b * 0.32
    return y


def sfx_swipe():
    return whoosh(0.4, 500, 4000, 1.0, 0.55) * 0.55


def sfx_open():
    t = T(0.16)
    y = np.sin(glide(320, 760, 0.16, 0.7)) * env_ar(len(t), 0.2, 1.2) * 0.45
    return y + whoosh(0.16, 900, 3000, 0.9, 0.3) * 0.25


def sfx_key():
    t = T(0.14)
    y = np.sin(glide(240, 120, 0.14)) * np.exp(-t / 0.05) * 0.5
    return fade_in(y + svf(noise(0.14), 1800, 0.7) * np.exp(-t / 0.03) * 0.12, 0.002)


def sfx_pop():
    t = T(0.09)
    y = np.sin(glide(480, 1150, 0.09, 0.6)) * np.exp(-t / 0.03)
    return fade_in(y, 0.001) * 0.6


def sfx_load():
    d = 0.8
    n = int(d * SR)
    y = svf(noise(d), 500 * (6 ** np.linspace(0, 1, n)), 2.0) * env_ar(n, 0.8, 1.0) * 0.18
    y += np.sin(glide(420, 880, d)) * env_ar(n, 0.85, 1.0) * 0.08
    return y


def sfx_ding():
    return bell(1318.5, 1.3, 0.45) * 0.38 + bell(1975.5, 1.3, 0.3) * 0.12


def sfx_sparkle():
    y = np.zeros(int(0.9 * SR))
    r = np.random.default_rng(3)
    for i in range(14):
        f = r.uniform(3000, 7000)
        b = bell(f, 0.25, 0.05, ((1, 1),))
        o = int(r.uniform(0, 0.6) * SR)
        y[o : o + len(b)] += b * r.uniform(0.05, 0.12)
    return y


def chord_arp(notes, step, tau, gain, dur=1.8):
    y = np.zeros(int(dur * SR))
    for i, f in enumerate(notes):
        b = bell(f, dur - i * step, tau)
        o = int(i * step * SR)
        y[o : o + len(b)] += b * gain
    return y


def sfx_success():
    return chord_arp([1046.5, 1318.5, 1568, 2093], 0.07, 0.55, 0.22)


def sfx_success2():
    y = chord_arp([523.25, 659.25, 784, 1046.5, 1318.5, 1568, 2093], 0.055, 0.8, 0.16, 2.4)
    t = T(0.5)
    y[: len(t)] += np.sin(glide(110, 45, 0.5)) * np.exp(-t / 0.18) * 0.45
    return y


def sfx_confetti():
    n = int(0.6 * SR)
    pop = svf(noise(0.6), 1800, 0.6) * np.exp(-T(0.6) / 0.03) * 0.5
    r = np.random.default_rng(9)
    crackle = np.zeros(n)
    for _ in range(40):
        o = int(r.uniform(0.03, 0.55) * SR)
        crackle[o : o + 60] += r.standard_normal(60) * r.uniform(0.05, 0.15)
    return pop + svf(crackle, 4500, 0.8, 'high') * 0.6


def sfx_whoosh():
    return whoosh(0.65, 250, 2600, 0.9, 0.5) * 0.75


def sfx_swish():
    return whoosh(0.35, 1500, 6000, 1.0, 0.45) * 0.35


def sfx_tick():
    return marimba(1760, 0.25, 0.06) * 0.3


def sfx_step():
    y = np.zeros(int(0.6 * SR))
    a, b = marimba(784, 0.5, 0.14), marimba(1046.5, 0.5, 0.16)
    y[: len(a)] += a * 0.28
    o = int(0.075 * SR)
    y[o : o + len(b)] += b * 0.3
    return y


def sfx_outro():
    y = np.zeros(int(3.0 * SR))
    for f, g in [(523.25, 0.2), (659.25, 0.16), (784, 0.16), (1046.5, 0.14), (1568, 0.06)]:
        b = bell(f, 3.0, 1.2)
        y[: len(b)] += b * g
    return y


SFX = {k[4:]: v for k, v in globals().items() if k.startswith('sfx_')}
# Har bir effektning eng baland nuqtasi (balans: UI tovushlari past, muvaffaqiyat qo'ng'irog'i balandroq)
LEVEL = {'tap': 0.32, 'hold': 0.3, 'thud': 0.3, 'send': 0.33, 'recv': 0.4, 'sheet': 0.24, 'copy': 0.32, 'swipe': 0.3,
         'open': 0.3, 'key': 0.26, 'pop': 0.3, 'load': 0.22, 'ding': 0.38, 'sparkle': 0.2, 'success': 0.46,
         'success2': 0.56, 'confetti': 0.3, 'whoosh': 0.36, 'swish': 0.22, 'tick': 0.22, 'step': 0.3, 'outro': 0.5}
PAN = {'tap': 0.1, 'send': 0.25, 'recv': -0.2, 'copy': 0.15, 'pop': 0.1, 'swish': -0.15, 'tick': 0.2}


# ---------- Fon musiqasi: 100 BPM, C – G – Am – F ----------
def music(dur, drums_from, end_at):
    bpm = 100
    beat = 60 / bpm
    bar = beat * 4
    n = int((dur + 1) * SR)
    L = np.zeros(n)
    R = np.zeros(n)
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    chords = [(48, [60, 64, 67]), (43, [59, 62, 67]), (45, [60, 64, 69]), (41, [60, 65, 69])]

    def add(sig, t0, gl=1.0, gr=1.0):
        o = int(t0 * SR)
        if o >= n:
            return
        m = min(len(sig), n - o)
        L[o : o + m] += sig[:m] * gl
        R[o : o + m] += sig[:m] * gr

    nbars = int(np.ceil(dur / bar)) + 1
    for b in range(nbars):
        t0 = b * bar
        if t0 > end_at:
            break
        root, notes = chords[b % 4]
        # pad (sekin kirib, keyingi akkordga ulanadi)
        pd = bar + 0.8
        t = T(pd)
        env = np.minimum(1, t / 0.5) * np.minimum(1, (pd - t) / 0.8)
        for k, m in enumerate(notes):
            f = hz(m)
            v = sum(a * np.sin(2 * np.pi * f * h * t * (1 + dt)) for h, a in ((1, 1), (2, 0.25), (3, 0.08)) for dt in (-0.0015, 0.0015))
            add(v * env * 0.022, t0, 1.0 - 0.15 * (k - 1), 1.0 + 0.15 * (k - 1))
        # arpedjio (8-likda)
        arp = [0, 1, 2, 1, 2, 1, 0, 2] if b % 2 == 0 else [0, 2, 1, 2, 0, 1, 2, 1]
        for i, idx in enumerate(arp):
            ts = t0 + i * beat / 2
            if ts > end_at:
                break
            f = hz(notes[idx] + 12)
            add(marimba(f, 0.6, 0.22) * (0.05 if i % 2 == 0 else 0.035), ts, 0.8 + 0.4 * (i % 2), 1.2 - 0.4 * (i % 2))
        # bas va zarb (telefon chiqqandan keyin)
        for i in range(4):
            tb = t0 + i * beat
            if tb < drums_from or tb > end_at:
                continue
            if i in (0, 2):
                tt = T(0.5)
                bass = (np.sin(2 * np.pi * hz(root - 12) * tt) + 0.3 * np.sin(4 * np.pi * hz(root - 12) * tt)) * np.exp(-tt / 0.35)
                add(fade_in(bass, 0.01) * 0.11, tb)
                tk = T(0.22)
                kick = np.sin(glide(140, 48, 0.22, 0.4)) * np.exp(-tk / 0.09)
                add(fade_in(kick, 0.001) * 0.16, tb)
            hh = svf(noise(0.04), 7000, 0.7, 'high') * np.exp(-T(0.04) / 0.012)
            add(hh * 0.035, tb + beat / 2, 0.8, 1.2)
            if i in (1, 3):
                add(hh * 0.02, tb, 1.2, 0.8)
    # oxirgi akkord (C) — yumshoq tugash
    tt = T(3.5)
    fin = sum(np.sin(2 * np.pi * hz(m) * tt) * np.exp(-tt / 1.4) for m in (48, 60, 64, 67)) * 0.03
    add(fade_in(fin, 0.05), end_at)
    # umumiy kirish/chiqish
    g = np.ones(n)
    g[: int(0.8 * SR)] = np.linspace(0, 1, int(0.8 * SR))
    tail = int(1.5 * SR)
    e = int(dur * SR)
    g[e - tail : e] *= np.linspace(1, 0, tail)
    g[e:] = 0
    return np.stack([L * g, R * g])


def load_voice(path):
    """Ovozli matn: 48 kHz mono, eng baland nuqta 1.0"""
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
    v = np.frombuffer(pcm, np.int16).astype(np.float64) / 32768
    return v / max(1e-9, np.abs(v).max())


def duck_gain(v, n, depth=0.7, attack=0.06, release=0.45):
    """Ovoz bor joyda musiqani pasaytiruvchi silliq egri (sidechain): 1 → 1-depth"""
    hop = int(0.01 * SR)
    frames = int(np.ceil(n / hop))
    rms = np.zeros(frames)
    for i in range(min(frames, int(np.ceil(len(v) / hop)))):
        seg = v[i * hop : (i + 1) * hop]
        rms[i] = np.sqrt(np.mean(seg * seg)) if len(seg) else 0
    act = (rms > 0.02).astype(float)
    env = np.zeros(frames)
    a, r = 1 - np.exp(-0.01 / attack), 1 - np.exp(-0.01 / release)
    for i in range(frames):
        k = a if act[i] > env[i - 1 if i else 0] else r
        env[i] = (env[i - 1] if i else 0) + k * (act[i] - (env[i - 1] if i else 0))
    g = 1 - depth * env
    return np.interp(np.arange(n), np.arange(frames) * hop, g)


def main():
    info = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    dur = info['dur']
    cues = info['cues']
    out_t = next((c['t'] for c in cues if c['s'] == 'outro'), dur - 2.5)
    whooshes = [c['t'] for c in cues if c['s'] == 'whoosh']
    drums_from = whooshes[0] if whooshes else 2.0
    mix = music(dur, drums_from, out_t - 0.1)
    voice = info.get('voice')
    if voice:
        v = load_voice(os.path.join(os.path.dirname(os.path.abspath(__file__)), voice))
        mix *= duck_gain(v, mix.shape[1])
    sfx_gain = 0.6 if voice else 1.0
    cache = {}
    for c in cues:
        s = c['s']
        if s not in SFX or c.get('g', 1) <= 0:
            continue
        if s not in cache:
            y = SFX[s]()
            cache[s] = y / np.abs(y).max() * LEVEL.get(s, 0.3)
        y = cache[s] * c.get('g', 1) * sfx_gain
        p = PAN.get(s, 0.0)
        o = int(c['t'] * SR)
        m = min(len(y), mix.shape[1] - o)
        if m <= 0:
            continue
        mix[0, o : o + m] += y[:m] * (1 - p) * 0.8
        mix[1, o : o + m] += y[:m] * (1 + p) * 0.8
    if voice:
        # ovoz musiqa va effektlardan ~2.5 baravar baland
        m = min(len(v), mix.shape[1])
        mix /= max(1e-9, np.abs(mix).max()) / 0.32
        mix[:, :m] += v[:m] * 0.85
    mix = mix[:, : int(dur * SR)]
    mix /= max(1e-9, np.abs(mix).max()) / 0.89
    pcm = (mix.T * 32767).astype('<i2')
    with wave.open(out, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f'{out}: {dur:.1f} s, {len(cues)} effekt')


if __name__ == '__main__':
    main()
