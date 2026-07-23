import { sb } from "@/lib/db";
import { AuditRow } from "@/lib/types";
import { LIBRARY } from "@/lib/library";
import MapClient, { Playbook } from "./map-client";

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

  // The standard playbook for their business type: the generic fast wins plus
  // the bigger swings every business like theirs can run, straight from the
  // curated library. The personalized map sits above it; this is the checklist.
  const lib = LIBRARY.find((c) => c.key === row!.taps?.category) || LIBRARY[0];
  const firstSentence = (s: string) => {
    const i = s.indexOf(". ");
    return i === -1 ? s : s.slice(0, i + 1);
  };
  const playbook: Playbook = {
    label: lib.label,
    quick: lib.items.filter((i) => i.time !== "week").slice(0, 9)
      .map((i) => ({ name: i.name, what: firstSentence(i.what), time: i.time })),
    big: lib.items.filter((i) => i.time === "week").slice(0, 3)
      .map((i) => ({ name: i.name, what: firstSentence(i.what) })),
  };

  return <MapClient row={row} playbook={playbook} />;
}
