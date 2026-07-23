import { sb } from "@/lib/db";
import { AuditRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Your private leads page: /leads?k=YOUR_LEADS_KEY
// Every audit is here, including the ones who quit halfway (they are leads too),
// plus a funnel showing exactly where visitors drop off.

const FUNNEL_STEPS: { key: string; label: string }[] = [
  { key: "quiz_open", label: "Opened the audit" },
  { key: "name_done", label: "Gave their name" },
  { key: "contact_done", label: "Contact captured" },
  { key: "tap_leads", label: "Finished quick taps" },
  { key: "q1", label: "Answered question 1" },
  { key: "q3", label: "Answered question 3" },
  { key: "interview_done", label: "Finished interview" },
  { key: "map_ready", label: "Got their map" },
];

function stageLabel(stage: string | null): string {
  if (!stage) return "";
  if (stage === "map_ready") return "map built";
  if (stage === "interview_done") return "interview done, map failed";
  if (stage.startsWith("q")) return `dropped at question ${stage.slice(1)}`;
  if (stage.startsWith("tap_")) return `dropped at taps (${stage.slice(4)})`;
  if (stage === "contact") return "dropped right after contact";
  return `dropped at ${stage}`;
}

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  const { k } = await searchParams;
  if (!process.env.LEADS_KEY || k !== process.env.LEADS_KEY) {
    return (
      <main className="wrap" style={{ textAlign: "center", paddingTop: 90 }}>
        <h1>Private</h1>
        <p className="sub">Add ?k=YOUR_LEADS_KEY to the URL (it is in your .env).</p>
      </main>
    );
  }

  let rows: AuditRow[] = [];
  const funnel = new Map<string, Set<string>>();
  try {
    const { data } = await sb()
      .from("audits").select("id,name,email,phone,taps,map,stage,created_at")
      .order("created_at", { ascending: false }).limit(200);
    rows = (data as AuditRow[]) || [];
  } catch { /* empty list below */ }
  try {
    const { data: events } = await sb()
      .from("audit_events").select("session_id,stage")
      .order("created_at", { ascending: false }).limit(5000);
    for (const e of (events as { session_id: string; stage: string }[]) || []) {
      if (!funnel.has(e.stage)) funnel.set(e.stage, new Set());
      funnel.get(e.stage)!.add(e.session_id);
    }
  } catch { /* funnel hidden below */ }

  const opened = funnel.get("quiz_open")?.size || 0;
  const qMax = Array.from(funnel.keys())
    .filter((s) => /^q\d+$/.test(s))
    .map((s) => ({ n: Number(s.slice(1)), c: funnel.get(s)!.size }))
    .sort((a, b) => a.n - b.n);

  return (
    <main className="wrap" style={{ maxWidth: 720 }}>
      <div className="kick">Private</div>
      <h1 style={{ marginTop: 6 }}>Leads</h1>
      <p className="sub">{rows.length} captured, newest first. The funnel shows where visitors fall off.</p>

      {opened > 0 && (
        <div className="card" style={{ marginTop: 16, padding: "10px 16px 14px" }}>
          <div style={{ fontSize: 13, fontWeight: 650, color: "var(--sec)", margin: "6px 0 4px" }}>Drop-off funnel (unique visitors)</div>
          {FUNNEL_STEPS.map((s) => {
            const c = funnel.get(s.key)?.size || 0;
            const pct = Math.round((c / opened) * 100);
            return (
              <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0" }}>
                <span style={{ fontSize: 12.5, color: "var(--sec)", flex: "0 0 168px" }}>{s.label}</span>
                <div style={{ flex: 1, height: 16, background: "var(--fill)", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ width: `${Math.max(pct, c > 0 ? 3 : 0)}%`, height: "100%", background: "var(--accent)", borderRadius: 6, opacity: 0.85 }} />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 650, flex: "0 0 74px", textAlign: "right" }}>{c} · {pct}%</span>
              </div>
            );
          })}
          {qMax.length > 0 && (
            <div className="sub" style={{ fontSize: 11.5, marginTop: 8 }}>
              Question by question: {qMax.map((q) => `Q${q.n}: ${q.c}`).join(" · ")}
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ marginTop: 16, padding: 0 }}>
        {rows.length === 0 && <div style={{ padding: 18 }} className="sub">Nothing yet. Share your audit link.</div>}
        {rows.map((r, i) => (
          <div key={r.id} style={{ padding: "13px 16px", borderTop: i ? "1px solid var(--hair)" : "none", display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 650 }}>
                {r.name || "(no name)"}
                {r.map?.score != null
                  ? <span style={{ color: "var(--accent)", marginLeft: 8, fontSize: 12.5 }}>score {r.map.score}</span>
                  : <span style={{ color: "var(--amber)", marginLeft: 8, fontSize: 12 }}>{stageLabel(r.stage)}</span>}
              </div>
              <div className="sub" style={{ fontSize: 12.5, marginTop: 2 }}>
                {r.email} {r.phone ? `· ${r.phone}` : ""} {r.taps?.category ? `· ${r.taps.category}` : ""} {r.taps?.revenue ? `· ${r.taps.revenue}` : ""}
              </div>
              {r.map?.topPick?.name && <div className="sub" style={{ fontSize: 12, marginTop: 2, color: "var(--ter)" }}>#1: {r.map.topPick.name}</div>}
            </div>
            <div style={{ display: "flex", gap: 8, flex: "0 0 auto" }}>
              {r.map && <a className="btn2" style={{ fontSize: 12, padding: "7px 13px" }} href={`/map/${r.id}`} target="_blank">Their map</a>}
              <span className="sub" style={{ fontSize: 11.5 }}>{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
