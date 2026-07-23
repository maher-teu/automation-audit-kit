import { NextRequest, NextResponse } from "next/server";
import { claude, extractJson, generatorSystem } from "@/lib/ai";
import { sb } from "@/lib/db";
import { CONFIG } from "@/config";
import { logUsage } from "@/lib/usage";
import { deliverLead } from "@/lib/deliver";
import { AuditMap, QA, TapAnswers } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

// Generate the personalized automation map, store the audit, return its id.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      taps: TapAnswers; name: string; email: string; phone: string; history: QA[]; website?: string;
      auditId?: string; session?: string;
    };
    const { taps, name, email, phone, history } = body;
    if (!taps?.category || !email) return NextResponse.json({ error: "missing fields" }, { status: 400 });

    // Retry-safe: if this audit already has a map (a previous attempt finished
    // server-side but the response never reached the phone), return it instantly.
    if (body.auditId) {
      const { data: existing } = await sb()
        .from("audits").select("map").eq("id", body.auditId).single();
      if (existing?.map) return NextResponse.json({ id: body.auditId });
    }

    const transcript = (history || [])
      .map((h, i) => `Q${i + 1}: ${h.q}\nA${i + 1}: ${h.a}`)
      .join("\n\n");

    const resp = await claude().messages.create({
      model: CONFIG.model,
      max_tokens: 8000,
      system: generatorSystem(taps, name || ""),
      messages: [{
        role: "user",
        content: `Here is the completed interview.\n\nFirst name: ${name || "friend"}\n\n${transcript}\n\n${body.website ? `Their website: ${body.website}\n\n` : ""}Generate the automation map JSON now.`,
      }],
    });
    await logUsage("generate", CONFIG.model, resp.usage);
    const text = resp.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n");
    const map = extractJson<AuditMap>(text);

    // Contact-first flow: the row already exists from /begin, so update it.
    // Fallback insert keeps a failed /begin (or an old session) working.
    let id: string | null = null;
    if (body.auditId) {
      const { error } = await sb()
        .from("audits")
        .update({ name, email, phone, website: body.website || "", taps, history, map, stage: "map_ready" })
        .eq("id", body.auditId);
      if (!error) id = body.auditId;
    }
    if (!id) {
      const { data, error } = await sb()
        .from("audits")
        .insert({
          name, email, phone, website: body.website || "", taps, history, map,
          built: [], session_id: body.session || null, stage: "map_ready",
        })
        .select("id")
        .single();
      if (error) throw error;
      id = data.id as string;
    }

    // Lead delivery. Awaited (serverless would kill fire-and-forget), and every
    // channel is best-effort: a delivery failure never blocks the visitor.
    const base = process.env.NEXT_PUBLIC_BASE_URL || "";
    await deliverLead({
      id, name, email, phone, taps,
      history: history || [], map, mapUrl: `${base}/map/${id}`,
    }).catch((e) => console.error("lead delivery failed:", e));

    // Legacy optional channels (Resend email + generic webhook), harmless if unset.
    await notifyLead({ id, name, email, phone, taps, map }).catch((e) =>
      console.error("lead notify failed:", e)
    );

    return NextResponse.json({ id });
  } catch (e) {
    console.error("generate error:", e);
    return NextResponse.json({ error: "generation failed" }, { status: 500 });
  }
}

async function notifyLead(x: {
  id: string; name: string; email: string; phone: string; taps: TapAnswers; map: AuditMap;
}) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  const mapUrl = `${base}/map/${x.id}`;

  // GHL inbound webhook: the lead lands in your pipeline with the map link.
  if (process.env.GHL_WEBHOOK_URL) {
    await fetch(process.env.GHL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: x.name, email: x.email, phone: x.phone,
        source: "automation-audit",
        automation_score: x.map.score,
        top_pick: x.map.topPick?.name,
        map_url: mapUrl,
      }),
    }).catch((e) => console.error("ghl webhook failed:", e));
  }

  // Resend: notify you + send the visitor their map link.
  if (process.env.RESEND_API_KEY) {
    const send = (to: string, subject: string, html: string) =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: process.env.FROM_EMAIL || "onboarding@resend.dev", to, subject, html }),
      }).catch((e) => console.error("resend failed:", e));

    if (process.env.NOTIFY_EMAIL) {
      await send(
        process.env.NOTIFY_EMAIL,
        `New audit lead: ${x.name || x.email} (score ${x.map.score})`,
        `<p><b>${x.name || "?"}</b> · ${x.email} · ${x.phone || "no phone"}</p>
         <p>Type: ${x.taps.category} · ${x.taps.revenue} · ${x.taps.teamSize}</p>
         <p>Top pick: ${x.map.topPick?.name}</p>
         <p><a href="${mapUrl}">Their map</a></p>`
      );
    }
    await send(
      x.email,
      `${x.name ? x.name + ", your" : "Your"} automation map is ready`,
      `<p>Here is your personal automation map, it stays live at this link:</p>
       <p><a href="${mapUrl}">${mapUrl}</a></p>
       <p>Your #1: <b>${x.map.topPick?.name}</b>. Want it built for you, free? Book here: <a href="${CONFIG.bookingUrl}">${CONFIG.bookingUrl}</a></p>
       <p>${CONFIG.ownerName}</p>`
    );
  }
}
