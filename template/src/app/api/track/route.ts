import { NextRequest, NextResponse } from "next/server";
import { sb } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 15;

const STAGE_RE = /^[a-z0-9_]{1,32}$/;

// Drop-off tracking: every stage the visitor reaches logs one event, keyed by an
// anonymous session id. The private leads page turns these into a funnel.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { session?: string; stage?: string };
    const session = (body.session || "").trim();
    const stage = (body.stage || "").trim();
    if (!session || session.length > 64 || !STAGE_RE.test(stage)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await sb().from("audit_events").insert({ session_id: session, stage });
    // Keep the lead row's furthest-stage marker fresh (row exists once contact is in).
    await sb().from("audits").update({ stage }).eq("session_id", session);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("track error:", e);
    return NextResponse.json({ ok: false });
  }
}
