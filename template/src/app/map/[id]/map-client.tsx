"use client";
import { useState } from "react";
import { CONFIG } from "@/config";
import { AuditRow, MapItem } from "@/lib/types";

const TIME_LABEL = { "60min": "60 min", half_day: "half day", week: "~1 week" } as const;
const TIME_COLOR = { "60min": "var(--green)", half_day: "var(--amber)", week: "var(--blue)" } as const;
const MECH_LABEL = { makes_money: "Makes money", saves_time: "Saves time", both: "Money + time" } as const;

export default function MapClient({ row }: { row: AuditRow }) {
  const map = row.map!;
  const [built, setBuilt] = useState<Set<string>>(new Set(row.built || []));
  const [copied, setCopied] = useState("");
  const [shared, setShared] = useState(false);

  const toggle = async (item: string) => {
    const on = !built.has(item);
    const next = new Set(built);
    if (on) next.add(item); else next.delete(item);
    setBuilt(next);
    fetch("/api/toggle", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, item, on }),
    }).catch(() => { /* optimistic; worst case the checkbox resets next visit */ });
  };

  const copy = async (key: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 1500); }
    catch { /* clipboard blocked */ }
  };

  const share = async () => {
    const url = `${window.location.origin}/s/${row.id}`;
    try {
      if (navigator.share) await navigator.share({ title: "The 5-Minute Automation Audit", url });
      else { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 1800); }
    } catch { /* user closed the sheet */ }
  };

  const allItems = [map.topPick, map.dashboard, ...map.quickWins];
  const doneCount = allItems.filter((i) => built.has(i.name)).length;

  return (
    <main className="wrap">
      <div className="kick">Your automation map · private link, stays live</div>
      <h1 style={{ marginTop: 8 }}>{map.headline}</h1>

      {/* score + diagnosis */}
      <div className="card" style={{ marginTop: 18, display: "flex", gap: 18, alignItems: "center" }}>
        <div style={{ textAlign: "center", flex: "0 0 auto" }}>
          <div style={{ fontSize: 40, fontWeight: 750, color: "var(--accent)", lineHeight: 1, letterSpacing: "-0.02em" }}>{map.score}</div>
          <div style={{ fontSize: 10.5, color: "var(--sec)", marginTop: 4, letterSpacing: "0.04em" }}>AUTOMATION SCORE</div>
        </div>
        <div>
          <div style={{ fontSize: 15.5, fontWeight: 650, lineHeight: 1.4 }}>{map.scoreLine}</div>
          <div className="sub" style={{ fontSize: 13, marginTop: 6 }}>{map.diagnosis}</div>
        </div>
      </div>

      {doneCount > 0 && (
        <div className="chip" style={{ marginTop: 12, color: "var(--green)" }}>
          {doneCount} of {allItems.length} built. Keep going.
        </div>
      )}

      <Section label="Build this first" />
      <Card item={map.topPick} hero built={built} toggle={toggle} copied={copied} copy={copy} />

      <Section label="The one every business needs" />
      <Card item={map.dashboard} built={built} toggle={toggle} copied={copied} copy={copy} />

      <Section label={`${map.quickWins.length} more that cleared the bar (we don't pad lists)`} />
      {map.quickWins.map((it) => (
        <Card key={it.name} item={it} built={built} toggle={toggle} copied={copied} copy={copy} />
      ))}

      <Section label="Big builds, worth it, not a weekend project" />
      <div className="card" style={{ padding: 0 }}>
        {map.bigBuilds.map((b, i) => (
          <div key={i} style={{ padding: "14px 16px", borderTop: i ? "1px solid var(--hair)" : "none" }}>
            <div style={{ fontSize: 14.5, fontWeight: 650 }}>{b.name}</div>
            <div className="sub" style={{ fontSize: 12.5, marginTop: 3 }}>{b.what}</div>
          </div>
        ))}
      </div>

      {/* CTA ladder */}
      <div className="card" style={{ marginTop: 30, textAlign: "center", padding: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em" }}>Want your #1 built for you, free?</h2>
        <p className="sub" style={{ marginTop: 8 }}>
          Book a call and {CONFIG.ownerName} will build "{map.topPick.name}" with you, on the call, on your accounts.
          You keep it either way. Capped at {CONFIG.buildCallsPerWeek} build calls a week.
        </p>
        <a className="btn" href={CONFIG.bookingUrl} target="_blank" rel="noreferrer" style={{ marginTop: 14 }}>
          Book the free build call
        </a>
        <div style={{ marginTop: 14 }}>
          <button className="btn2" onClick={share}>
            {shared ? "Link copied ✓" : "Know another owner drowning in admin? Share this"}
          </button>
        </div>
      </div>

      <p className="sub" style={{ marginTop: 26, fontSize: 12.5, textAlign: "center", color: "var(--ter)" }}>
        This whole experience, the interview, the analysis, this page, was built with Claude Code.
        It is the kind of thing {CONFIG.ownerName} builds for businesses like yours.
      </p>
    </main>
  );
}

function Section({ label }: { label: string }) {
  return <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sec)", margin: "26px 2px 10px" }}>{label}</div>;
}

function Card({ item, hero, built, toggle, copied, copy }: {
  item: MapItem; hero?: boolean; built: Set<string>;
  toggle: (n: string) => void; copied: string; copy: (k: string, t: string) => void;
}) {
  const [open, setOpen] = useState(!!hero);
  const done = built.has(item.name);
  return (
    <div className="card" style={{
      marginTop: 10, padding: 0, overflow: "hidden",
      border: hero ? "1px solid var(--accent)" : "1px solid transparent",
      opacity: done ? 0.72 : 1,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "15px 16px", cursor: "pointer" }}
        onClick={() => setOpen(!open)}>
        <button aria-label={done ? "Mark as not built" : "Mark as built"}
          onClick={(e) => { e.stopPropagation(); toggle(item.name); }}
          style={{
            width: 22, height: 22, borderRadius: 7, flex: "0 0 auto", marginTop: 1, cursor: "pointer",
            border: done ? "none" : "1.5px solid var(--hair)",
            background: done ? "var(--accent)" : "transparent",
            color: "var(--accent-ink)", fontSize: 13, fontWeight: 800,
          }}>{done ? "✓" : ""}</button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 15.5, fontWeight: 650, lineHeight: 1.3, textDecoration: done ? "line-through" : "none" }}>
            {item.name}
            {item.surprise && <span className="chip" style={{ marginLeft: 8, fontSize: 10, color: "var(--accent)" }}>bet you didn't know this was automatable</span>}
          </div>
          <div className="sub" style={{ fontSize: 13, marginTop: 4 }}>{item.why}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
            <span className="chip" style={{ color: TIME_COLOR[item.time] }}>{TIME_LABEL[item.time]}</span>
            <span className="chip">{MECH_LABEL[item.mech]}</span>
            <span className="chip">{item.tools}</span>
          </div>
        </div>
        <span style={{ color: "var(--ter)", fontSize: 17, transform: open ? "rotate(90deg)" : "none", transition: "transform .2s" }}>›</span>
      </div>

      {open && (
        <div style={{ borderTop: "1px solid var(--hair)", padding: "14px 16px 16px" }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--sec)" }}>The plan</div>
          {item.plan.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 9, marginTop: 8, fontSize: 13.5, lineHeight: 1.5 }}>
              <b style={{ color: "var(--accent)" }}>{i + 1}.</b><span>{s}</span>
            </div>
          ))}
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--sec)", marginTop: 16 }}>
            Your Claude Code starter prompt, copy it, paste it, it builds
          </div>
          <div style={{
            marginTop: 8, background: "rgba(0,0,0,0.35)", border: "1px solid var(--hair)", borderRadius: 12,
            padding: "12px 13px", fontSize: 12, lineHeight: 1.55, color: "var(--sec)",
            fontFamily: "ui-monospace, Menlo, monospace", whiteSpace: "pre-wrap", maxHeight: 180, overflow: "auto",
          }}>{item.prompt}</div>
          <button className="btn2" style={{ marginTop: 10 }} onClick={() => copy(item.name, item.prompt)}>
            {copied === item.name ? "Copied ✓" : "Copy the prompt"}
          </button>
        </div>
      )}
    </div>
  );
}
