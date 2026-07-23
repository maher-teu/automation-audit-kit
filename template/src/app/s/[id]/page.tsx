import { sb } from "@/lib/db";
import { AuditRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The share page: score and headline ONLY, zero private detail. The friend's
// only path is the start page, they never see someone else's results.
export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let score: number | null = null;
  try {
    const { data } = await sb().from("audits").select("map").eq("id", id).single();
    score = ((data as AuditRow | null)?.map?.score) ?? null;
  } catch { /* show generic card */ }

  return (
    <main className="wrap" style={{ textAlign: "center", paddingTop: 70, maxWidth: 480 }}>
      <div className="kick">The 5-Minute Automation Audit</div>
      {score !== null ? (
        <>
          <div style={{ fontSize: 76, fontWeight: 750, color: "var(--accent)", letterSpacing: "-0.03em", marginTop: 18, lineHeight: 1 }}>
            {score}<span style={{ fontSize: 26, color: "var(--ter)" }}>/100</span>
          </div>
          <h1 style={{ fontSize: 22, marginTop: 14 }}>A business owner just got their Automation Score.</h1>
          <p className="sub" style={{ marginTop: 8 }}>
            Most owners score under 45, and find out they are leaving thousands per month in manual work.
            Five minutes, speak your answers, get your own map.
          </p>
        </>
      ) : (
        <h1 style={{ marginTop: 18 }}>What's your Automation Score?</h1>
      )}
      <a className="btn" href="/audit" style={{ marginTop: 24, fontSize: 16, padding: "15px 32px" }}>
        Get my score free
      </a>
    </main>
  );
}
