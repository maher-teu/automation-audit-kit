import { NextRequest, NextResponse } from "next/server";
import { sb } from "@/lib/db";

export const runtime = "nodejs";

// Check/uncheck a built item on someone's living map.
export async function POST(req: NextRequest) {
  try {
    const { id, item, on } = (await req.json()) as { id: string; item: string; on: boolean };
    if (!id || !item) return NextResponse.json({ error: "missing fields" }, { status: 400 });
    const { data, error } = await sb().from("audits").select("built").eq("id", id).single();
    if (error) throw error;
    const built = new Set<string>((data?.built as string[]) || []);
    if (on) built.add(item); else built.delete(item);
    const { error: e2 } = await sb().from("audits").update({ built: [...built] }).eq("id", id);
    if (e2) throw e2;
    return NextResponse.json({ ok: true, built: [...built] });
  } catch (e) {
    console.error("toggle error:", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
