import { sb } from "@/lib/db";
import { AuditRow } from "@/lib/types";
import MapClient from "./map-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The living map: a private, permanent page. Checkboxes persist, so it becomes
// a tool they come back to, not a PDF they lose.
export default async function MapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let row: AuditRow | null = null;
  try {
    const { data } = await sb().from("audits").select("*").eq("id", id).single();
    row = data as AuditRow | null;
  } catch { /* fall through to not-found */ }

  if (!row?.map) {
    return (
      <main className="wrap" style={{ textAlign: "center", paddingTop: 80 }}>
        <h1>Map not found</h1>
        <p className="sub">This link looks wrong, or the map was never finished.</p>
        <a className="btn" href="/audit" style={{ marginTop: 20 }}>Take the audit</a>
      </main>
    );
  }
  return <MapClient row={row} />;
}
