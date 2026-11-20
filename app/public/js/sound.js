// Tiny synthesised sound effects. No assets, no network, muted with one toggle.

let ctx = null;
let enabled = true;

function context() {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function setEnabled(next) {
  enabled = Boolean(next);
  if (enabled) context();
}

export function isEnabled() {
  return enabled;
}

function blip({ freq = 440, dur = 0.08, type = 'triangle', gain = 0.04, slide = 0, delay = 0 }) {
  if (!enabled) return;
  const ac = context();
  if (!ac) return;
  try {
    const start = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(70, freq + slide), start + dur);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(amp).connect(ac.destination);
    osc.start(start);
    osc.stop(start + dur + 0.03);
  } catch {
    /* audio is decoration; never break the game for it */
  }
}

export const sfx = {
  click: () => blip({ freq: 320, dur: 0.05, gain: 0.03 }),
  roll: () => {
    blip({ freq: 220, dur: 0.06, type: 'square', gain: 0.028 });
    blip({ freq: 300, dur: 0.06, type: 'square', gain: 0.028, delay: 0.07 });
    blip({ freq: 390, dur: 0.08, type: 'square', gain: 0.026, delay: 0.14 });
  },
  coin: () => {
    blip({ freq: 660, dur: 0.07, gain: 0.04 });
    blip({ freq: 990, dur: 0.09, gain: 0.028, delay: 0.06 });
  },
  win: () => {
    [523, 659, 784, 1046].forEach((freq, i) => blip({ freq, dur: 0.16, gain: 0.045, delay: i * 0.09 }));
  },
  error: () => blip({ freq: 180, dur: 0.14, type: 'sawtooth', gain: 0.026, slide: -60 }),
};
