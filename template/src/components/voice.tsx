"use client";
import { useEffect, useRef, useState } from "react";

// Voice dictation, Claude-style: words stream in AS you speak (interim results),
// a live waveform reacts to your actual voice on the left, ✕ cancels, ✓ confirms.
// Uses the browser's built-in speech recognition (Chrome/Safari/Edge), zero keys,
// zero lag. Falls back gracefully: if unsupported, the mic button hides itself.

type SR = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; [j: number]: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null; onerror: (() => void) | null;
  start: () => void; stop: () => void; abort: () => void;
};

export function speechSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export default function VoiceInput({ onText, onLive, lang }: {
  onText: (final: string) => void;   // fired on ✓ with the confirmed transcript
  onLive: (partial: string) => void; // fired continuously as words stream in
  lang?: string;
}) {
  const [active, setActive] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef<SR | null>(null);
  const finalRef = useRef("");
  const interimRef = useRef("");
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const barsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setSupported(speechSupported()); }, []);

  const cleanup = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    try { recRef.current?.abort(); } catch { /* noop */ }
    recRef.current = null;
    setActive(false);
  };
  useEffect(() => cleanup, []); // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    finalRef.current = "";
    interimRef.current = "";

    // Real waveform: mic stream -> analyser -> bar heights every frame.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext });
      const ctx = new (AC.AudioContext || AC.webkitAudioContext!)();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const animate = () => {
        analyser.getByteFrequencyData(data);
        const bars = barsRef.current?.children;
        if (bars) {
          for (let i = 0; i < bars.length; i++) {
            const v = data[Math.floor((i / bars.length) * data.length)] / 255;
            (bars[i] as HTMLElement).style.height = `${4 + v * 18}px`;
          }
        }
        rafRef.current = requestAnimationFrame(animate);
      };
      animate();
    } catch { /* no mic permission for the waveform; dictation may still work */ }

    const rec = new Ctor();
    rec.lang = lang || navigator.language || "en-US";
    rec.continuous = true;
    rec.interimResults = true; // <- this is the zero-lag streaming
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current += t + " ";
        else interim += t;
      }
      interimRef.current = interim;
      onLive((finalRef.current + interim).trim());
    };
    rec.onend = () => { /* keep UI open; user confirms with the check */ };
    rec.onerror = () => { /* stay calm; user can cancel */ };
    recRef.current = rec;
    rec.start();
    setActive(true);
  };

  const confirm = () => {
    const text = (finalRef.current + " " + interimRef.current).replace(/\s+/g, " ").trim();
    cleanup();
    if (text) onText(text);
  };
  const cancel = () => { cleanup(); onLive(""); };

  if (!supported) return null;

  if (!active) {
    return (
      <button type="button" onClick={start} aria-label="Speak your answer" title="Speak instead of typing"
        style={btnStyle}>
        <MicIcon />
      </button>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div ref={barsRef} aria-hidden
        style={{ display: "flex", alignItems: "center", gap: 3, height: 24, minWidth: 64 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} style={{ width: 3, height: 4, borderRadius: 2, background: "var(--accent)", transition: "height .06s linear" }} />
        ))}
      </div>
      <button type="button" onClick={cancel} aria-label="Cancel dictation" style={btnStyle}>✕</button>
      <button type="button" onClick={confirm} aria-label="Use this answer"
        style={{ ...btnStyle, background: "var(--accent)", color: "var(--accent-ink)", borderColor: "transparent" }}>✓</button>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--hair)",
  background: "var(--fill)", color: "var(--ink)", fontSize: 16, cursor: "pointer",
  display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto",
};

function MicIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="9" y="2.5" width="6" height="11.5" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3.5" />
    </svg>
  );
}
