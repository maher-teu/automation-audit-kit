import { NextRequest, NextResponse } from "next/server";
import { sb } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 30;

// Contact is captured FIRST, before the interview. This creates the audit row
// right away, so a visitor who quits halfway through is still a captured lead
// on your /leads page, with a visible drop-off stage.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      session?: string; name?: string; email?: string; phone?: string; website?: string;
    };
    const email = (body.email || "").trim();
    const name = (body.name || "").trim();
    if (!email || !email.includes("@")) return NextResponse.json({ error: "email required" }, { status: 400 });

    const { data, error } = await sb()
      .from("audits")
      .insert({
        session_id: body.session || null,
        stage: "contact",
        name,
        email,
        phone: (body.phone || "").trim(),
        website: (body.website || "").trim(),
        built: [],
      })
      .select("id")
      .single();
    if (error) throw error;

    return NextResponse.json({ id: data.id });
  } catch (e) {
    console.error("begin error:", e);
    // Fail soft: the quiz continues without a row; generate will insert one at the end.
    return NextResponse.json({ id: null });
  }
}
