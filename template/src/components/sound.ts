"use client";

// Subtle UI sounds, synthesized with WebAudio so there are zero asset files.
// Key moments only: a soft tick on taps, a two-note chime when the map is ready.
// Everything fails silently (blocked autoplay, silent mode, old browsers).

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch { return null; }
}

function note(freq: number, at: number, dur: number, vol: number) {
  const c = ac();
  if (!c) return;
  try {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, c.currentTime + at);
    g.gain.exponentialRampToValueAtTime(vol, c.currentTime + at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + dur);
    o.connect(g).connect(c.destination);
    o.start(c.currentTime + at);
    o.stop(c.currentTime + at + dur + 0.05);
  } catch { /* silent */ }
}

// Soft tick for option taps and sends.
export function tick() { note(1350, 0, 0.06, 0.045); }

// Gentle two-note rise when something good lands (map ready).
export function chime() { note(660, 0, 0.16, 0.05); note(990, 0.11, 0.22, 0.05); }
