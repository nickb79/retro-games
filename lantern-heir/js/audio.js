/* Lantern Heir — original chiptune via WebAudio. No samples. */
(function (root) {
  const LH = root.LH = root.LH || {};

  const NOTES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  function freq(name) {
    if (!name || name === 'R') return 0;
    const m = /^([A-G])(#|b)?(\d)$/.exec(name);
    if (!m) return 0;
    let n = NOTES[m[1]];
    if (m[2] === '#') n++;
    if (m[2] === 'b') n--;
    const midi = (parseInt(m[3], 10) + 1) * 12 + n;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function parse(seq) {
    return seq.trim().split(/\s+/).filter(Boolean).map(tok => {
      const parts = tok.split('/');
      const beats = 4 / (parseInt(parts[1] || '4', 10) || 4);
      return { n: parts[0], beats };
    });
  }

  /* Original tunes. Short loops, not from any published score. */
  const TUNES = {
    title: {
      bpm: 92, loop: true,
      tracks: [
        { wave: 'square', gain: 0.07, notes: parse('E5/8 G5/8 A5/4 E5/4 D5/8 C5/8 A4/2 R/4 C5/8 D5/8 E5/4 G5/4 A5/8 G5/8 E5/2') },
        { wave: 'triangle', gain: 0.08, notes: parse('A3/2 E3/2 F3/2 C3/2 G3/2 D3/2 A3/2 E3/2') }
      ]
    },
    field: {
      bpm: 104, loop: true,
      tracks: [
        { wave: 'square', gain: 0.06, notes: parse('A4/8 C5/8 E5/4 D5/8 C5/8 A4/4 G4/4 A4/8 B4/8 C5/4 E4/4 G4/8 A4/8 B4/4 C5/8 D5/8 E5/2') },
        { wave: 'triangle', gain: 0.07, notes: parse('A2/2 E2/2 F2/2 C2/2 C3/2 G2/2 D2/2 E2/2') },
        { wave: 'square', gain: 0.03, notes: parse('E5/8 R/8 C5/8 R/8 A4/4 R/4 G4/8 R/8 E4/8 R/8 D5/4 R/2') }
      ]
    },
    town: {
      bpm: 112, loop: true,
      tracks: [
        { wave: 'square', gain: 0.055, notes: parse('C5/8 E5/8 G5/4 E5/4 F5/8 E5/8 D5/4 C5/4 D5/8 F5/8 A5/4 G5/8 F5/8 E5/2') },
        { wave: 'triangle', gain: 0.07, notes: parse('C3/2 G2/2 A2/2 E2/2 F2/2 C3/2 G2/2 C3/2') }
      ]
    },
    dungeon: {
      bpm: 84, loop: true,
      tracks: [
        { wave: 'square', gain: 0.05, notes: parse('A3/2 R/4 E4/4 R/4 D4/2 R/4 A3/4 G3/2 R/2') },
        { wave: 'triangle', gain: 0.08, notes: parse('A2/1 E2/1 D2/1 A2/1') },
        { wave: 'sawtooth', gain: 0.02, notes: parse('E4/4 R/4 A4/8 R/4 E4/4 R/2 D4/4 R/4') }
      ]
    },
    battle: {
      bpm: 144, loop: true,
      tracks: [
        { wave: 'square', gain: 0.06, notes: parse('A4/8 A4/8 C5/8 A4/8 E5/4 D5/8 C5/8 A4/4 G4/8 A4/8 C5/4 E5/8 D5/8 C5/4') },
        { wave: 'triangle', gain: 0.07, notes: parse('A2/4 A2/4 F2/4 F2/4 G2/4 G2/4 E2/4 E2/4') },
        { wave: 'square', gain: 0.035, notes: parse('E5/16 R/16 E5/16 R/8 C5/16 R/16 A4/8 R/4 E5/16 R/16 D5/8 R/4') }
      ]
    },
    boss: {
      bpm: 156, loop: true,
      tracks: [
        { wave: 'square', gain: 0.065, notes: parse('E4/8 G4/8 Bb4/4 A4/8 G4/8 E4/4 D4/4 E4/8 G4/8 B4/4 A4/4 G4/2') },
        { wave: 'triangle', gain: 0.08, notes: parse('E2/4 E2/4 C2/4 C2/4 D2/4 B1/4 E2/2') },
        { wave: 'sawtooth', gain: 0.025, notes: parse('B4/8 R/8 G4/8 R/8 E4/4 R/4 A4/8 R/8 F4/4 R/4') }
      ]
    },
    ending: {
      bpm: 88, loop: true,
      tracks: [
        { wave: 'triangle', gain: 0.08, notes: parse('C5/2 E5/4 G5/4 A5/2 G5/4 E5/4 F5/2 E5/4 D5/4 C5/1') },
        { wave: 'square', gain: 0.04, notes: parse('E4/2 G4/2 A4/2 C5/2 F4/2 A4/2 G4/2 E4/2') }
      ]
    }
  };

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    name: null,
    tracks: [],
    timer: null,
    speed: 1
  };

  function ensure() {
    if (audio.ctx) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
    audio.ctx = ctx;
    audio.master = master;
  }

  LH.audio = {
    unlock() {
      ensure();
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
    },
    setMute(m) {
      audio.muted = !!m;
      if (audio.master) audio.master.gain.value = audio.muted ? 0 : 0.22;
    },
    setSpeed(s) { audio.speed = s || 1; },
    music(name) {
      if (!TUNES[name]) name = 'field';
      if (audio.name === name && audio.timer) return;
      this.unlock();
      audio.name = name;
      const tune = TUNES[name];
      const now = audio.ctx.currentTime + 0.05;
      audio.tracks = tune.tracks.map(() => ({ i: 0, t: now }));
      if (audio.timer) clearInterval(audio.timer);
      audio.timer = setInterval(tick, 60);
      tick();
    },
    stop() {
      audio.name = null;
      if (audio.timer) clearInterval(audio.timer);
      audio.timer = null;
    },
    sfx(kind) {
      if (!audio.ctx || audio.muted) return;
      const ctx = audio.ctx;
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(audio.master);
      const blip = (f1, f2, dur, type, vol) => {
        o.type = type || 'square';
        o.frequency.setValueAtTime(f1, t);
        if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(40, f2), t + dur);
        g.gain.setValueAtTime(vol || 0.08, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.start(t); o.stop(t + dur + 0.02);
      };
      if (kind === 'hit') blip(220, 90, 0.12, 'square', 0.08);
      else if (kind === 'hurt') blip(160, 50, 0.18, 'sawtooth', 0.08);
      else if (kind === 'spell') blip(520, 880, 0.18, 'square', 0.06);
      else if (kind === 'heal') blip(440, 660, 0.2, 'triangle', 0.08);
      else if (kind === 'menu') blip(660, 660, 0.04, 'square', 0.05);
      else if (kind === 'cancel') blip(200, 140, 0.08, 'square', 0.05);
      else if (kind === 'chest') blip(523, 784, 0.22, 'square', 0.07);
      else if (kind === 'level') {
        o.type = 'square';
        o.frequency.setValueAtTime(523, t);
        o.frequency.setValueAtTime(659, t + 0.08);
        o.frequency.setValueAtTime(784, t + 0.16);
        g.gain.setValueAtTime(0.07, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.36);
        o.start(t); o.stop(t + 0.4);
      } else if (kind === 'victory') {
        o.type = 'square';
        [523, 659, 784, 1046].forEach((f, i) => o.frequency.setValueAtTime(f, t + i * 0.1));
        g.gain.setValueAtTime(0.07, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        o.start(t); o.stop(t + 0.52);
      } else if (kind === 'inn') {
        o.type = 'triangle';
        [392, 494, 587, 784].forEach((f, i) => o.frequency.setValueAtTime(f, t + i * 0.12));
        g.gain.setValueAtTime(0.08, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        o.start(t); o.stop(t + 0.62);
      } else if (kind === 'die') blip(180, 40, 0.4, 'sawtooth', 0.08);
      else blip(440, 440, 0.05, 'square', 0.05);
    }
  };

  function schedule(f, when, dur, wave, gain) {
    if (!f || audio.muted) return;
    const ctx = audio.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(f, when);
    g.gain.setValueAtTime(gain, when);
    g.gain.setValueAtTime(gain, when + Math.max(0.02, dur * 0.7));
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    o.connect(g); g.connect(audio.master);
    o.start(when);
    o.stop(when + dur + 0.02);
  }

  function tick() {
    if (!audio.ctx || audio.ctx.state !== 'running' || !audio.name) return;
    const tune = TUNES[audio.name];
    if (!tune) return;
    const beat = (60 / tune.bpm) / (audio.speed || 1);
    const horizon = audio.ctx.currentTime + 0.28;
    for (let ti = 0; ti < tune.tracks.length; ti++) {
      const src = tune.tracks[ti];
      const tr = audio.tracks[ti];
      let guard = 0;
      while (tr.t < horizon && guard++ < 16) {
        const note = src.notes[tr.i % src.notes.length];
        const dur = Math.max(0.03, note.beats * beat * 0.92);
        schedule(freq(note.n), tr.t, dur, src.wave, src.gain);
        tr.t += note.beats * beat;
        tr.i++;
        if (!tune.loop && tr.i >= src.notes.length) {
          tr.t = Infinity;
        }
      }
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
