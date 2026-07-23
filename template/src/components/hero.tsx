import { CONFIG } from "@/config";

// The opt-in hero graphic: a hand-built product preview in the TEU language
// (near-black cards, gold accent, green value chips). Pure markup, so it is
// crisp on every screen, themable, and weighs nothing.
export default function Hero() {
  return (
    <div className="fade" style={{
      display: "flex", gap: 16, justifyContent: "center", alignItems: "stretch",
      flexWrap: "wrap", margin: "34px auto 0", maxWidth: 640, textAlign: "left",
    }}>
      {/* the interview, phone-shaped */}
      <div style={{
        flex: "1 1 240px", maxWidth: 280, background: "var(--card)", borderRadius: 26,
        padding: "18px 16px", boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
        border: "1px solid var(--hair)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{
            width: 30, height: 30, borderRadius: "50%", background: "var(--accent)", color: "var(--accent-ink)",
            display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14,
          }}>{CONFIG.agentName[0]}</span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>{CONFIG.agentName}</div>
            <div style={{ fontSize: 10.5, color: "var(--sec)" }}>AI audit · 5 minutes</div>
          </div>
        </div>
        <div style={{
          marginTop: 14, background: "var(--fill)", border: "1px solid var(--hair)",
          borderRadius: "14px 14px 14px 4px", padding: "10px 12px", fontSize: 12.5, lineHeight: 1.45, color: "var(--ink)",
        }}>
          What eats most of your week, and what is one new customer worth to you?
        </div>
        <div style={{
          marginTop: 12, display: "flex", alignItems: "center", gap: 8,
          background: "var(--fill)", borderRadius: 99, padding: "8px 10px",
        }}>
          <span style={{
            width: 26, height: 26, borderRadius: "50%", background: "var(--accent)", color: "var(--accent-ink)",
            display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <rect x="9" y="2.5" width="6" height="11.5" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5" />
            </svg>
          </span>
          <span aria-hidden style={{ display: "inline-flex", alignItems: "center", gap: 2.5, flex: 1 }}>
            {[7, 12, 8, 15, 10, 16, 9, 13, 6, 11, 14, 8, 12, 7].map((h, i) => (
              <span key={i} style={{ width: 3, height: h, borderRadius: 2, background: "var(--accent)", opacity: 0.85 }} />
            ))}
          </span>
          <span style={{ fontSize: 10.5, color: "var(--sec)", whiteSpace: "nowrap" }}>speak or tap</span>
        </div>
      </div>

      {/* the payoff, results-shaped */}
      <div style={{
        flex: "1 1 260px", maxWidth: 320, background: "var(--card)", borderRadius: 22,
        padding: "16px 16px", boxShadow: "0 18px 50px rgba(0,0,0,0.45)", border: "1px solid var(--hair)",
      }}>
        <div style={{ fontSize: 12, color: "var(--sec)", fontWeight: 600 }}>Your automation map</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
          <span style={{ fontSize: 34, fontWeight: 750, color: "var(--accent)", letterSpacing: "-0.02em" }}>12 hrs</span>
          <span style={{ fontSize: 12, color: "var(--sec)" }}>a week back</span>
          <span style={{ marginLeft: "auto", fontSize: 15, fontWeight: 700, color: "var(--green)" }}>+$3,200/mo</span>
        </div>
        {[
          { n: "1", t: "Lead follow-up on autopilot", v: "+$1,200/mo" },
          { n: "2", t: "Missed-call text-back", v: "+$900/mo" },
          { n: "3", t: "Invoice reminders", v: "+$1,100/mo" },
        ].map((r) => (
          <div key={r.n} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 2px",
            borderTop: "1px solid var(--hair)", marginTop: r.n === "1" ? 12 : 0,
          }}>
            <span style={{
              width: 20, height: 20, borderRadius: 7, background: "var(--fill)", color: "var(--accent)",
              display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flex: "0 0 auto",
            }}>{r.n}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, flex: 1, minWidth: 0 }}>{r.t}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", whiteSpace: "nowrap" }}>{r.v}</span>
          </div>
        ))}
        <div style={{
          marginTop: 10, fontSize: 10.5, color: "var(--ter)",
        }}>Every item: the plan + a copy-paste build prompt</div>
      </div>
    </div>
  );
}
