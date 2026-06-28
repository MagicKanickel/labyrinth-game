let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, type, t0, dur, vol = 0.25) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.start(t0);
  osc.stop(t0 + dur + 0.01);
}

export function playPush() {
  const c = getCtx();
  const t = c.currentTime;
  tone(120, 'sawtooth', t,       0.12, 0.3);
  tone(80,  'square',   t + 0.06, 0.1,  0.15);
}

export function playMove() {
  const c = getCtx();
  const t = c.currentTime;
  tone(520, 'sine', t,       0.06, 0.18);
  tone(660, 'sine', t + 0.05, 0.07, 0.12);
}

export function playCardFound() {
  const c = getCtx();
  const t = c.currentTime;
  [523, 659, 784, 1047].forEach((freq, i) => tone(freq, 'sine', t + i * 0.09, 0.2, 0.3));
}

export function playWin() {
  const c = getCtx();
  const t = c.currentTime;
  [261, 329, 392, 523, 659, 784, 1047, 1319].forEach((freq, i) =>
    tone(freq, 'triangle', t + i * 0.09, 0.35, 0.4)
  );
}

export function playBotMove() {
  const c = getCtx();
  tone(300, 'sine', c.currentTime, 0.06, 0.08);
}
