import { NextRequest, NextResponse } from "next/server";
import { sb } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 15;

// Is this audit's map ready? The phone polls this while the map generates, so
// even if the generate response gets lost (timeout, network blip, backgrounded
// tab), the visitor still lands on their finished map.
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id") || "";
    if (!id) return NextResponse.json({ ready: false });
    const { data } = await sb().from("audits").select("map").eq("id", id).single();
    return NextResponse.json({ ready: !!data?.map });
  } catch {
    return NextResponse.json({ ready: false });
  }
}
