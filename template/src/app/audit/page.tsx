"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { CONFIG } from "@/config";
import { InterviewTurn, QA, TapAnswers } from "@/lib/types";
import VoiceInput from "@/components/voice";

// The audit: name -> 4 taps -> AI interview (speak or tap) -> contact -> map.
// Session autosaves to localStorage so a closed tab resumes where they left off.

type Stage = "name" | "taps" | "interview" | "contact" | "generating";

const TAP_STEPS: { key: keyof TapAnswers; title: string; options: { v: string; l: string }[]; multi?: boolean }[] = [
  { key: "category", title: "What kind of business do you run?", options: [
    { v: "online", l: "Online services (agency, coaching, consulting)" },
    { v: "local", l: "Local or brick-and-mortar business" },
    { v: "ecom", l: "E-commerce or physical products" },
    { v: "saas", l: "SaaS or software" },
  ]},
  { key: "revenue", title: "Roughly where is revenue right now?", options: [
    { v: "Under $10k/mo", l: "Under $10k/mo" }, { v: "$10-30k/mo", l: "$10-30k/mo" },
    { v: "$30-100k/mo", l: "$30-100k/mo" }, { v: "$100k+/mo", l: "$100k+/mo" },
  ]},
  { key: "teamSize", title: "Who does the work day to day?", options: [
    { v: "Just me", l: "Just me" }, { v: "Me + 1-3 people", l: "Me + 1-3 people" },
    { v: "A team of 4-10", l: "A team of 4-10" }, { v: "10+ people", l: "10+ people" },
  ]},
  { key: "leadSource", title: "Where do new customers come from? Pick all that apply.", multi: true, options: [
    { v: "Social media / content", l: "Social media / content" }, { v: "Paid ads", l: "Paid ads" },
    { v: "Referrals / word of mouth", l: "Referrals / word of mouth" },
    { v: "Outbound (calls, emails, DMs)", l: "Outbound (calls, emails, DMs)" },
    { v: "Local search / walk-ins", l: "Local search / walk-ins" },
  ]},
];

const SAVE_KEY = "audit-session-v1";

// Country dial codes for the phone field (label + code). Default guessed from browser locale.
const DIALS: { c: string; d: string }[] = [
  { c: "SE", d: "+46" }, { c: "NO", d: "+47" }, { c: "DK", d: "+45" }, { c: "FI", d: "+358" },
  { c: "DE", d: "+49" }, { c: "UK", d: "+44" }, { c: "US", d: "+1" }, { c: "CA", d: "+1" },
  { c: "FR", d: "+33" }, { c: "ES", d: "+34" }, { c: "IT", d: "+39" }, { c: "NL", d: "+31" },
  { c: "BE", d: "+32" }, { c: "CH", d: "+41" }, { c: "AT", d: "+43" }, { c: "PT", d: "+351" },
  { c: "IE", d: "+353" }, { c: "PL", d: "+48" }, { c: "AE", d: "+971" }, { c: "SA", d: "+966" },
  { c: "AU", d: "+61" }, { c: "NZ", d: "+64" }, { c: "BR", d: "+55" }, { c: "MX", d: "+52" },
  { c: "IN", d: "+91" },
];
function guessDial(): string {
  try {
    const region = (navigator.language.split("-")[1] || "").toUpperCase();
    const hit = DIALS.find((x) => x.c === region || (region === "GB" && x.c === "UK"));
    return hit?.d || "+46";
  } catch { return "+46"; }
}

export default function AuditPage() {
  const [stage, setStage] = useState<Stage>("name");
  const [name, setName] = useState("");
  const [taps, setTaps] = useState<Partial<TapAnswers>>({});
  const [tapStep, setTapStep] = useState(0);
  const [multiSel, setMultiSel] = useState<string[]>([]);
  const [history, setHistory] = useState<QA[]>([]);
  const [turn, setTurn] = useState<InterviewTurn | null>(null);
  const [draft, setDraft] = useState("");
  const [suggSel, setSuggSel] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [found, setFound] = useState(0);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dial, setDial] = useState("+46");
  const [website, setWebsite] = useState("");
  const [genLine, setGenLine] = useState("Reading your answers…");
  const [err, setErr] = useState("");
  const restored = useRef(false);

  useEffect(() => { setDial(guessDial()); }, []);

  // ── session autosave / resume ──
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.stage && s.stage !== "generating") {
          setStage(s.stage); setName(s.name || ""); setTaps(s.taps || {});
          setTapStep(s.tapStep || 0); setHistory(s.history || []); setFound(s.found || 0);
          if (s.turn) setTurn(s.turn);
        }
      }
    } catch { /* fresh start */ }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ stage, name, taps, tapStep, history, found, turn }));
    } catch { /* ignore */ }
  }, [stage, name, taps, tapStep, history, found, turn]);

  // ── interview turn fetch ──
  const nextTurn = useCallback(async (hist: QA[], t: TapAnswers) => {
    setThinking(true); setErr("");
    try {
      const r = await fetch("/api/interview", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taps: t, name, history: hist }),
      });
      const data = (await r.json()) as InterviewTurn;
      if (data.foundSoFar && data.foundSoFar > found) setFound(data.foundSoFar);
      if (data.insight) setInsights((cur) => [...cur, data.insight!]); // stays visible, no vanishing
      if (data.done) setStage("contact");
      else setTurn(data);
    } catch {
      setStage("contact"); // fail soft, never strand them
    } finally { setThinking(false); }
  }, [name, found]);

  const answer = (text: string) => {
    if (!turn?.question || !text.trim()) return;
    const hist = [...history, { q: turn.question, a: text.trim() }];
    setHistory(hist); setDraft(""); setSuggSel([]); setTurn(null);
    nextTurn(hist, taps as TapAnswers);
  };

  // Multi-select interview questions: combine toggled chips (plus anything typed) into one answer.
  const sendMulti = () => {
    const parts = [...suggSel];
    if (draft.trim()) parts.push(draft.trim());
    if (parts.length) answer(parts.join(" + "));
  };

  const generate = async () => {
    if (!email.trim()) { setErr("Your email is where the map goes, I need that one."); return; }
    setStage("generating"); setErr("");
    const lines = [
      "Reading your answers…",
      "Checking what is buildable with the tools you already have…",
      "Running your numbers…",
      "Ranking by what pays you back fastest…",
      "Writing your build plans…",
    ];
    lines.forEach((l, i) => setTimeout(() => setGenLine(l), i * 2600));
    try {
      const r = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taps, name, email: email.trim(), phone: phone.trim() ? `${dial} ${phone.trim()}` : "", website: website.trim(), history }),
      });
      const data = await r.json();
      if (!r.ok || !data.id) throw new Error(data.error || "failed");
      localStorage.removeItem(SAVE_KEY);
      window.location.href = `/map/${data.id}`;
    } catch {
      setErr("Something hiccuped building your map. Give it one more go.");
      setStage("contact");
    }
  };

  const progress =
    stage === "name" ? 4 :
    stage === "taps" ? 8 + tapStep * 7 :
    stage === "interview" ? Math.min(40 + history.length * 6, 82) :
    stage === "contact" ? 90 : 97;

  return (
    <main className="wrap" style={{ maxWidth: 560 }}>
      {/* progress + found counter, sticky so it never scrolls away */}
      <div className="kit-topbar">
        <div style={{ flex: 1, height: 5, background: "var(--fill)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "var(--accent)", borderRadius: 99, transition: "width .5s cubic-bezier(.2,.7,.2,1)" }} />
        </div>
        {found > 0 && <span className="chip" style={{ color: "var(--accent)", flex: "0 0 auto" }}>{found} automation{found > 1 ? "s" : ""} spotted</span>}
      </div>

      {/* insights stay on screen, they are the receipts */}
      {insights.map((t, i) => (
        <div key={i} className="card fade" style={{ marginTop: 10, borderLeft: "3px solid var(--accent)", fontSize: 13.5, color: "var(--sec)", padding: "12px 15px" }}>
          {t}
        </div>
      ))}

      {stage === "name" && (
        <div className="fade" style={{ marginTop: 40 }}>
          <div className="kick">{CONFIG.agentName} · your AI automation consultant</div>
          <h1 style={{ marginTop: 8 }}>First things first, what should I call you?</h1>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <input autoFocus placeholder="First name" value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && name.trim() && setStage("taps")} />
            <button className="btn" disabled={!name.trim()} onClick={() => setStage("taps")}>Next</button>
          </div>
        </div>
      )}

      {stage === "taps" && (
        <div className="fade" key={tapStep} style={{ marginTop: 40 }}>
          <div className="kick">Quick taps, {4 - tapStep} left</div>
          <h1 style={{ marginTop: 8, fontSize: 25 }}>{TAP_STEPS[tapStep].title}</h1>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 18 }}>
            {TAP_STEPS[tapStep].options.map((o) => {
              const isMulti = !!TAP_STEPS[tapStep].multi;
              const selected = isMulti && multiSel.includes(o.v);
              return (
                <button key={o.v} className="card" style={{
                  textAlign: "left", cursor: "pointer", fontSize: 15, color: "var(--ink)",
                  border: selected ? "1px solid var(--accent)" : "1px solid var(--hair)",
                  display: "flex", alignItems: "center", gap: 10,
                }}
                  onClick={() => {
                    if (isMulti) {
                      setMultiSel((cur) => cur.includes(o.v) ? cur.filter((x) => x !== o.v) : [...cur, o.v]);
                      return;
                    }
                    const t = { ...taps, [TAP_STEPS[tapStep].key]: o.v };
                    setTaps(t);
                    if (tapStep < TAP_STEPS.length - 1) setTapStep(tapStep + 1);
                    else { setStage("interview"); nextTurn([], t as TapAnswers); }
                  }}>
                  {isMulti && (
                    <span style={{
                      width: 20, height: 20, borderRadius: 7, flex: "0 0 auto",
                      border: selected ? "none" : "1.5px solid var(--hair)",
                      background: selected ? "var(--accent)" : "transparent",
                      color: "var(--accent-ink)", fontSize: 12, fontWeight: 800,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}>{selected ? "✓" : ""}</span>
                  )}
                  {o.l}
                </button>
              );
            })}
          </div>
          {TAP_STEPS[tapStep].multi && (
            <button className="btn" disabled={multiSel.length === 0} style={{ marginTop: 16, width: "100%", padding: "15px 0" }}
              onClick={() => {
                const t = { ...taps, [TAP_STEPS[tapStep].key]: multiSel.join(" + ") };
                setTaps(t); setMultiSel([]);
                if (tapStep < TAP_STEPS.length - 1) setTapStep(tapStep + 1);
                else { setStage("interview"); nextTurn([], t as TapAnswers); }
              }}>
              Continue{multiSel.length > 0 ? ` with ${multiSel.length} selected` : ""}
            </button>
          )}
        </div>
      )}

      {stage === "interview" && (
        <div style={{ marginTop: 32 }}>
          {history.map((h, i) => (
            <div key={i} style={{ marginBottom: 14, opacity: 0.55 }}>
              <div style={{ fontSize: 13, color: "var(--sec)" }}>{h.q}</div>
              <div style={{ fontSize: 14, marginTop: 3 }}>{h.a}</div>
            </div>
          ))}

          {thinking && (
            <div className="fade kit-typing" aria-label={`${CONFIG.agentName} is typing`}>
              <span className="kit-avatar">{CONFIG.agentName[0]}</span>
              <span className="kit-dots"><i /><i /><i /></span>
            </div>
          )}

          {turn?.question && !thinking && (
            <div className="fade">
              <h1 style={{ fontSize: 22, lineHeight: 1.3 }}>{turn.question}</h1>
              {turn.suggestions && turn.suggestions.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                  {turn.suggestions.map((s) => {
                    const sel = turn.multiSelect && suggSel.includes(s);
                    return (
                      <button key={s} className="btn2" style={sel ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
                        onClick={() => {
                          if (turn.multiSelect) setSuggSel((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]);
                          else answer(s);
                        }}>
                        {sel ? "✓ " : ""}{s}
                      </button>
                    );
                  })}
                </div>
              )}
              {turn.multiSelect && (
                <div className="sub" style={{ fontSize: 12.5, marginTop: 8 }}>Pick all that apply, then send.</div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center" }}>
                <input placeholder="Or say it in your own words…" value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (turn.multiSelect ? sendMulti() : answer(draft))} />
                <VoiceInput onLive={setDraft} onText={(t) => answer(turn.multiSelect ? [...suggSel, t.trim()].filter(Boolean).join(" + ") : t)} />
                <button className="btn" disabled={turn.multiSelect ? suggSel.length === 0 && !draft.trim() : !draft.trim()}
                  onClick={() => (turn.multiSelect ? sendMulti() : answer(draft))}>Send</button>
              </div>
            </div>
          )}
        </div>
      )}

      {stage === "contact" && (
        <div className="fade" style={{ marginTop: 40 }}>
          <div className="kick">Last step</div>
          <h1 style={{ marginTop: 8, fontSize: 25 }}>Where should I send your map, {name || "friend"}?</h1>
          <p className="sub">Your map gets a private link that stays live. I will email it to you, and text it so you have it on the go.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div style={{ display: "flex", gap: 8 }}>
              <select value={dial} onChange={(e) => setDial(e.target.value)} aria-label="Country code"
                style={{ flex: "0 0 auto", width: 118 }}>
                {DIALS.map((x) => <option key={x.c + x.d} value={x.d}>{x.c} {x.d}</option>)}
              </select>
              <input type="tel" placeholder="Phone (for the map link by text)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <input placeholder="Your website (optional, sharpens the results)" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
          {err && <p style={{ color: "var(--red)", fontSize: 13, marginTop: 10 }}>{err}</p>}
          <button className="btn" style={{ marginTop: 16, width: "100%", padding: "16px 0" }} onClick={generate}>
            Build my automation map
          </button>
        </div>
      )}

      {stage === "generating" && (
        <div className="fade" style={{ marginTop: 80, textAlign: "center" }}>
          <div style={{ width: 46, height: 46, margin: "0 auto", border: "3px solid var(--fill)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <h1 style={{ fontSize: 21, marginTop: 24 }}>{genLine}</h1>
          <p className="sub">About 20 seconds. Worth it.</p>
        </div>
      )}
    </main>
  );
}
