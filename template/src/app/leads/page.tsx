import { sb } from "@/lib/db";
import { AuditRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Your private leads page: /leads?k=YOUR_LEADS_KEY
// Every completed audit is here even if email/GHL delivery is not configured.
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
  try {
    const { data } = await sb()
      .from("audits").select("id,name,email,phone,taps,map,created_at")
      .order("created_at", { ascending: false }).limit(200);
    rows = (data as AuditRow[]) || [];
  } catch { /* empty list below */ }

  return (
    <main className="wrap" style={{ maxWidth: 720 }}>
      <div className="kick">Private</div>
      <h1 style={{ marginTop: 6 }}>Leads</h1>
      <p className="sub">{rows.length} audits, newest first.</p>
      <div className="card" style={{ marginTop: 16, padding: 0 }}>
        {rows.length === 0 && <div style={{ padding: 18 }} className="sub">Nothing yet. Share your audit link.</div>}
        {rows.map((r, i) => (
          <div key={r.id} style={{ padding: "13px 16px", borderTop: i ? "1px solid var(--hair)" : "none", display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 650 }}>
                {r.name || "(no name)"}
                {r.map?.score != null && <span style={{ color: "var(--accent)", marginLeft: 8, fontSize: 12.5 }}>score {r.map.score}</span>}
              </div>
              <div className="sub" style={{ fontSize: 12.5, marginTop: 2 }}>
                {r.email} {r.phone ? `· ${r.phone}` : ""} · {r.taps?.category} · {r.taps?.revenue}
              </div>
              {r.map?.topPick?.name && <div className="sub" style={{ fontSize: 12, marginTop: 2, color: "var(--ter)" }}>#1: {r.map.topPick.name}</div>}
            </div>
            <div style={{ display: "flex", gap: 8, flex: "0 0 auto" }}>
              <a className="btn2" style={{ fontSize: 12, padding: "7px 13px" }} href={`/map/${r.id}`} target="_blank">Their map</a>
              <span className="sub" style={{ fontSize: 11.5 }}>{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
