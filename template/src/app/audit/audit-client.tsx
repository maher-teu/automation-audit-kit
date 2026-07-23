"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { CONFIG } from "@/config";
import { InterviewTurn, QA, TapAnswers } from "@/lib/types";
import VoiceInput from "@/components/voice";
import { tick, chime } from "@/components/sound";

// The audit, contact-first: name -> email/phone -> 5 taps -> AI interview
// (speak or tap, pinned composer, back button) -> generating -> map.
// Contact is captured BEFORE the interview so a half-finished audit is still a
// lead, and every stage logs a drop-off event for the private funnel page.

type Stage = "name" | "contact" | "taps" | "interview" | "generating";

type TapStep =
  | { key: keyof TapAnswers; kind: "options"; title: string; track: string; options: { v: string; l: string }[]; multi?: boolean }
  | { key: keyof TapAnswers; kind: "text"; title: string; track: string; placeholder: string; hint: string };

const TAP_STEPS: TapStep[] = [
  { key: "category", kind: "options", track: "tap_category", title: "What kind of business do you run?", options: [
    { v: "online", l: "Online services (agency, coaching, consulting)" },
    { v: "local", l: "Local or brick-and-mortar business" },
    { v: "ecom", l: "E-commerce or physical products" },
    { v: "saas", l: "SaaS or software" },
  ]},
  { key: "businessDesc", kind: "text", track: "tap_business", title: "In one line, what exactly is your business?",
    placeholder: "Example: I run a tattoo studio in Malmo",
    hint: "Say it like you would to a friend. This makes everything after this personal to YOUR business." },
  { key: "revenue", kind: "options", track: "tap_revenue", title: "Roughly where is revenue right now?", options: [
    { v: "Under $10k/mo", l: "Under $10k/mo" }, { v: "$10-30k/mo", l: "$10-30k/mo" },
    { v: "$30-100k/mo", l: "$30-100k/mo" }, { v: "$100k+/mo", l: "$100k+/mo" },
  ]},
  { key: "teamSize", kind: "options", track: "tap_team", title: "Who does the work day to day?", options: [
    { v: "Just me", l: "Just me" }, { v: "Me + 1-3 people", l: "Me + 1-3 people" },
    { v: "A team of 4-10", l: "A team of 4-10" }, { v: "10+ people", l: "10+ people" },
  ]},
  { key: "leadSource", kind: "options", track: "tap_leads", title: "Where do new customers come from?", multi: true, options: [
    { v: "Social media / content", l: "Social media / content" }, { v: "Paid ads", l: "Paid ads" },
    { v: "Referrals / word of mouth", l: "Referrals / word of mouth" },
    { v: "Outbound (calls, emails, DMs)", l: "Outbound (calls, emails, DMs)" },
    { v: "Local search / walk-ins", l: "Local search / walk-ins" },
  ]},
];

const SAVE_KEY = "audit-session-v2";
const SID_KEY = "audit-sid";

// Country dial codes for the phone field. Defaults from the visitor's real
// location (server geo header), falling back to browser locale.
const DIALS: { c: string; iso: string; d: string }[] = [
  { c: "SE", iso: "SE", d: "+46" }, { c: "NO", iso: "NO", d: "+47" }, { c: "DK", iso: "DK", d: "+45" },
  { c: "FI", iso: "FI", d: "+358" }, { c: "DE", iso: "DE", d: "+49" }, { c: "UK", iso: "GB", d: "+44" },
  { c: "US", iso: "US", d: "+1" }, { c: "CA", iso: "CA", d: "+1" }, { c: "FR", iso: "FR", d: "+33" },
  { c: "ES", iso: "ES", d: "+34" }, { c: "IT", iso: "IT", d: "+39" }, { c: "NL", iso: "NL", d: "+31" },
  { c: "BE", iso: "BE", d: "+32" }, { c: "CH", iso: "CH", d: "+41" }, { c: "AT", iso: "AT", d: "+43" },
  { c: "PT", iso: "PT", d: "+351" }, { c: "IE", iso: "IE", d: "+353" }, { c: "PL", iso: "PL", d: "+48" },
  { c: "AE", iso: "AE", d: "+971" }, { c: "SA", iso: "SA", d: "+966" }, { c: "AU", iso: "AU", d: "+61" },
  { c: "NZ", iso: "NZ", d: "+64" }, { c: "BR", iso: "BR", d: "+55" }, { c: "MX", iso: "MX", d: "+52" },
  { c: "IN", iso: "IN", d: "+91" },
];
function dialFor(country: string): string {
  const hit = DIALS.find((x) => x.iso === country);
  if (hit) return hit.d;
  try {
    const region = (navigator.language.split("-")[1] || "").toUpperCase();
    return DIALS.find((x) => x.iso === region)?.d || "+46";
  } catch { return "+46"; }
}

function sid(): string {
  try {
    let s = localStorage.getItem(SID_KEY);
    if (!s) { s = crypto.randomUUID(); localStorage.setItem(SID_KEY, s); }
    return s;
  } catch { return "anon"; }
}

function track(stage: string) {
  try {
    fetch("/api/track", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session: sid(), stage }), keepalive: true,
    }).catch(() => {});
  } catch { /* never block the flow */ }
}

export default function StartClient({ country }: { country: string }) {
  const [stage, setStage] = useState<Stage>("name");
  const [name, setName] = useState("");
  const [taps, setTaps] = useState<Partial<TapAnswers>>({});
  const [tapStep, setTapStep] = useState(0);
  const [multiSel, setMultiSel] = useState<string[]>([]);
  const [history, setHistory] = useState<QA[]>([]);
  const [turnLog, setTurnLog] = useState<InterviewTurn[]>([]);
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
  const [auditId, setAuditId] = useState<string | null>(null);
  const [genStep, setGenStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const restored = useRef(false);
  const genRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneRef = useRef(false);

  useEffect(() => { setDial(dialFor(country)); }, [country]);
  useEffect(() => { track("quiz_open"); }, []);

  // A new question, typing indicator, or insight always pulls the screen to the
  // bottom, so nobody has to scroll to find what Otto just said.
  useEffect(() => {
    if (stage !== "interview") return;
    const t = setTimeout(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    }, 80);
    return () => clearTimeout(t);
  }, [stage, turn, thinking, insights.length]);

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
          setTurnLog(s.turnLog || []); setInsights(s.insights || []);
          setEmail(s.email || ""); setPhone(s.phone || ""); setWebsite(s.website || "");
          setAuditId(s.auditId || null);
          if (s.dial) setDial(s.dial);
          if (s.turn) setTurn(s.turn);
        }
      }
    } catch { /* fresh start */ }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        stage, name, taps, tapStep, history, turnLog, found, turn, insights,
        email, phone, dial, website, auditId,
      }));
    } catch { /* ignore */ }
  }, [stage, name, taps, tapStep, history, turnLog, found, turn, insights, email, phone, dial, website, auditId]);

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
      if (data.done) { track("interview_done"); generate(hist); }
      else setTurn(data);
    } catch {
      track("interview_done");
      generate(hist); // fail soft, never strand them
    } finally { setThinking(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, found, email, phone, dial, website, auditId, taps]);

  const answer = (text: string) => {
    if (!turn?.question || !text.trim()) return;
    tick();
    const hist = [...history, { q: turn.question, a: text.trim() }];
    setHistory(hist); setTurnLog((l) => [...l, turn]);
    setDraft(""); setSuggSel([]); setTurn(null);
    track(`q${Math.min(hist.length, 12)}`);
    nextTurn(hist, taps as TapAnswers);
  };

  // Multi-select interview questions: combine toggled options (plus anything typed).
  const sendMulti = () => {
    const parts = [...suggSel];
    if (draft.trim()) parts.push(draft.trim());
    if (parts.length) answer(parts.join(" + "));
  };

  // ── back: taps, interview answers, everything except mid-generation ──
  const goBack = () => {
    tick(); setErr("");
    if (stage === "contact") { setStage("name"); return; }
    if (stage === "taps") {
      if (tapStep > 0) { setMultiSel([]); setTapStep(tapStep - 1); }
      else setStage("contact");
      return;
    }
    if (stage === "interview") {
      if (thinking) return;
      if (history.length === 0) { setTurn(null); setStage("taps"); return; }
      const prev = turnLog[turnLog.length - 1];
      setTurn(prev || null);
      setHistory((h) => h.slice(0, -1));
      setTurnLog((l) => l.slice(0, -1));
      setDraft(""); setSuggSel([]);
    }
  };

  // ── contact capture, BEFORE the interview ──
  const saveContact = async () => {
    if (!email.trim() || !email.includes("@")) { setErr("Your email is where the map goes, I need that one."); return; }
    tick(); setSaving(true); setErr("");
    try {
      const r = await fetch("/api/begin", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session: sid(), name,
          email: email.trim(),
          phone: phone.trim() ? `${dial} ${phone.trim()}` : "",
          website: website.trim(),
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (data?.id) setAuditId(data.id);
    } catch { /* captured later by generate's fallback insert */ }
    setSaving(false);
    track("contact_done");
    setStage("taps");
  };

  // Landing on the finished map exactly once, whichever signal arrives first
  // (the generate response, or the status poll seeing the map in the database).
  const finish = useCallback((id: string) => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (genRef.current) clearInterval(genRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    track("map_ready");
    chime();
    try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
    window.location.href = `/map/${id}`;
  }, []);

  const generate = async (hist?: QA[]) => {
    setStage("generating"); setGenStep(0); setErr("");
    doneRef.current = false;
    if (genRef.current) clearInterval(genRef.current);
    genRef.current = setInterval(() => setGenStep((s) => Math.min(s + 1, GEN_LINES.length - 1)), 3800);

    // Belt and braces: poll the database directly. Even if the generate response
    // never reaches this phone (timeout, network blip, app backgrounded), the
    // map is spotted the moment it lands and we redirect anyway.
    const startedAt = Date.now();
    if (pollRef.current) clearInterval(pollRef.current);
    if (auditId) {
      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch(`/api/status?id=${auditId}`);
          const s = await r.json();
          if (s?.ready) finish(auditId);
          else if (Date.now() - startedAt > 240000) {
            if (pollRef.current) clearInterval(pollRef.current);
            setErr("Something hiccuped building your map. Give it one more go.");
          }
        } catch { /* keep polling */ }
      }, 2500);
    }

    try {
      const r = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taps, name, email: email.trim(),
          phone: phone.trim() ? `${dial} ${phone.trim()}` : "",
          website: website.trim(),
          history: hist || history,
          auditId, session: sid(),
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.id) throw new Error(data.error || "failed");
      finish(data.id);
    } catch {
      // The POST failed or its response got lost. If we can poll, the map may
      // still be on its way; only surface an error when polling is impossible.
      if (!auditId && !doneRef.current) {
        if (genRef.current) clearInterval(genRef.current);
        setErr("Something hiccuped building your map. Give it one more go.");
      }
    }
  };

  const GEN_LINES = [
    `Reading everything you told me, ${name || "friend"}...`,
    taps.businessDesc ? `Sizing up "${String(taps.businessDesc).slice(0, 60)}"...` : "Sizing up your business...",
    "Doing the money math with your numbers...",
    "Comparing against 50+ proven automations...",
    "Picking only what pays you back...",
    "Writing your copy-paste build prompts...",
    "Scoring how automated you are today...",
  ];

  const progress =
    stage === "name" ? 4 :
    stage === "contact" ? 10 :
    stage === "taps" ? 16 + tapStep * 6 :
    stage === "interview" ? Math.min(46 + history.length * 4, 90) : 96;

  const showBack = (stage === "contact" || stage === "taps" || (stage === "interview" && !thinking));
  const composerVisible = stage === "interview" && !!turn?.question && !thinking;

  return (
    <main className="wrap" style={{ maxWidth: 560, paddingBottom: composerVisible ? 150 : 60 }}>
      {/* back + progress + found counter, sticky so it never scrolls away */}
      <div className="kit-topbar">
        {showBack && (
          <button className="kit-back" aria-label="Back" onClick={goBack}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
          </button>
        )}
        <div style={{ flex: 1, height: 5, background: "var(--fill)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "var(--accent)", borderRadius: 99, transition: "width .5s cubic-bezier(.2,.7,.2,1)" }} />
        </div>
        {found > 0 && <span className="chip" style={{ color: "var(--accent)", flex: "0 0 auto" }}>{found} automation{found > 1 ? "s" : ""} spotted</span>}
      </div>

      {/* insights stay on screen, they are the receipts (cleared for the finale) */}
      {stage !== "generating" && insights.map((t, i) => (
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
              onKeyDown={(e) => e.key === "Enter" && name.trim() && (tick(), track("name_done"), setStage("contact"))} />
            <button className="btn" disabled={!name.trim()} onClick={() => { tick(); track("name_done"); setStage("contact"); }}>Next</button>
          </div>
        </div>
      )}

      {stage === "contact" && (
        <div className="fade" style={{ marginTop: 40 }}>
          <div className="kick">So your map is safe before we start</div>
          <h1 style={{ marginTop: 8, fontSize: 25 }}>Where should I send your map when we are done, {name || "friend"}?</h1>
          <p className="sub">You get a private link that stays live. I will email it to you, and text it so you have it on the go.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div style={{ display: "flex", gap: 8 }}>
              <select value={dial} onChange={(e) => setDial(e.target.value)} aria-label="Country code"
                style={{ flex: "0 0 auto", width: 112 }}>
                {DIALS.map((x) => <option key={x.c + x.d} value={x.d}>{x.c} {x.d}</option>)}
              </select>
              <input type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <input placeholder="Your website (optional, sharpens the results)" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
          {err && <p style={{ color: "var(--red)", fontSize: 13, marginTop: 10 }}>{err}</p>}
          <button className="btn" disabled={saving} style={{ marginTop: 16, width: "100%", padding: "16px 0" }} onClick={saveContact}>
            {saving ? <span className="kit-spin" /> : null}{saving ? "Saving..." : "Locked in, start my audit"}
          </button>
        </div>
      )}

      {stage === "taps" && (() => {
        const step = TAP_STEPS[tapStep];
        const advance = (t: Partial<TapAnswers>) => {
          setTaps(t); setMultiSel([]); setDraft("");
          track(step.track);
          if (tapStep < TAP_STEPS.length - 1) setTapStep(tapStep + 1);
          else { setStage("interview"); nextTurn([], t as TapAnswers); }
        };
        return (
          <div className="fade" key={tapStep} style={{ marginTop: 40 }}>
            <div className="kick">Quick ones, {TAP_STEPS.length - tapStep} left</div>
            <h1 style={{ marginTop: 8, fontSize: 25 }}>{step.title}</h1>

            {step.kind === "text" && (
              <>
                <p className="sub" style={{ fontSize: 13.5 }}>{step.hint}</p>
                <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center" }}>
                  <input autoFocus placeholder={step.placeholder} value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && draft.trim() && (tick(), advance({ ...taps, [step.key]: draft.trim() }))} />
                  <VoiceInput onLive={setDraft} onText={(t) => { tick(); advance({ ...taps, [step.key]: t.trim() }); }} />
                </div>
                <button className="btn" disabled={!draft.trim()} style={{ marginTop: 14, width: "100%", padding: "15px 0" }}
                  onClick={() => { tick(); advance({ ...taps, [step.key]: draft.trim() }); }}>Next</button>
              </>
            )}

            {step.kind === "options" && (
              <>
                {step.multi && <div className="kit-multi-hint">Pick all that apply</div>}
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: step.multi ? 10 : 18 }}>
                  {step.options.map((o) => {
                    const selected = !!step.multi && multiSel.includes(o.v);
                    return (
                      <button key={o.v} className="card kit-opt" style={{
                        textAlign: "left", cursor: "pointer", fontSize: 15, color: "var(--ink)",
                        border: selected ? "1px solid var(--accent)" : "1px solid var(--hair)",
                        display: "flex", alignItems: "center", gap: 10,
                      }}
                        onClick={() => {
                          tick();
                          if (step.multi) {
                            setMultiSel((cur) => cur.includes(o.v) ? cur.filter((x) => x !== o.v) : [...cur, o.v]);
                            return;
                          }
                          advance({ ...taps, [step.key]: o.v });
                        }}>
                        {step.multi && (
                          <span className="kit-check" style={{
                            border: selected ? "none" : "1.5px solid var(--hair)",
                            background: selected ? "var(--accent)" : "transparent",
                          }}>{selected ? "✓" : ""}</span>
                        )}
                        {o.l}
                      </button>
                    );
                  })}
                </div>
                {step.multi && (
                  <button className="btn" disabled={multiSel.length === 0} style={{ marginTop: 16, width: "100%", padding: "15px 0" }}
                    onClick={() => { tick(); advance({ ...taps, [step.key]: multiSel.join(" + ") }); }}>
                    Continue{multiSel.length > 0 ? ` with ${multiSel.length} selected` : ""}
                  </button>
                )}
              </>
            )}
          </div>
        );
      })()}

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
              {turn.multiSelect && <div className="kit-multi-hint">Pick all that apply</div>}
              {turn.suggestions && turn.suggestions.length > 0 && (
                turn.multiSelect ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                    {turn.suggestions.map((s) => {
                      const sel = suggSel.includes(s);
                      return (
                        <button key={s} className="card kit-opt" style={{
                          textAlign: "left", cursor: "pointer", fontSize: 14.5, color: "var(--ink)", padding: "13px 15px",
                          border: sel ? "1px solid var(--accent)" : "1px solid var(--hair)",
                          display: "flex", alignItems: "center", gap: 10,
                        }}
                          onClick={() => { tick(); setSuggSel((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]); }}>
                          <span className="kit-check" style={{
                            border: sel ? "none" : "1.5px solid var(--hair)",
                            background: sel ? "var(--accent)" : "transparent",
                          }}>{sel ? "✓" : ""}</span>
                          {s}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                    {turn.suggestions.map((s) => (
                      <button key={s} className="btn2" onClick={() => answer(s)}>{s}</button>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {stage === "generating" && (
        <div className="fade" style={{ marginTop: 60 }}>
          <h1 style={{ fontSize: 23, textAlign: "center" }}>Building your automation map</h1>
          <p className="sub" style={{ textAlign: "center" }}>About 20 seconds. Worth it.</p>
          <div className="card" style={{ marginTop: 22, padding: "8px 18px" }}>
            {GEN_LINES.map((l, i) => {
              const done = i < genStep;
              const active = i === genStep;
              if (!done && !active) return null;
              return (
                <div key={i} className="fade" style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", opacity: done ? 0.55 : 1 }}>
                  {done ? (
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--accent)", color: "var(--accent-ink)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flex: "0 0 auto" }}>✓</span>
                  ) : (
                    <span style={{ width: 18, height: 18, flex: "0 0 auto", border: "2px solid var(--fill)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "kitSpinKF 0.9s linear infinite", display: "inline-block" }} />
                  )}
                  <span style={{ fontSize: 14.5 }}>{l}</span>
                </div>
              );
            })}
          </div>
          <style>{`@keyframes kitSpinKF{to{transform:rotate(360deg)}}`}</style>
          {err && (
            <div style={{ textAlign: "center", marginTop: 18 }}>
              <p style={{ color: "var(--red)", fontSize: 13.5 }}>{err}</p>
              <button className="btn" style={{ marginTop: 12 }} onClick={() => generate()}>Try again</button>
            </div>
          )}
        </div>
      )}

      {/* the answer bar: pinned to the bottom like a real chat, never moves */}
      {composerVisible && turn && (
        <div className="kit-composer">
          <div className="kit-composer-in">
            <input placeholder="Or say it in your own words…" value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (turn.multiSelect ? sendMulti() : answer(draft))} />
            <VoiceInput onLive={setDraft} onText={(t) => answer(turn.multiSelect ? [...suggSel, t.trim()].filter(Boolean).join(" + ") : t)} />
            <button className="btn" disabled={turn.multiSelect ? suggSel.length === 0 && !draft.trim() : !draft.trim()}
              onClick={() => (turn.multiSelect ? sendMulti() : answer(draft))}>Send</button>
          </div>
        </div>
      )}
    </main>
  );
}
