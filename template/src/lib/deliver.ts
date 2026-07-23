// Full lead delivery, every channel optional by env var:
//
//   GHL_API_KEY + GHL_LOCATION_ID   -> the lead lands in your GoHighLevel as a
//     contact, the full interview + map link land in the contact's notes, and
//     the lead automatically gets their map by email (and SMS if they gave a
//     phone), written and sent from your GHL.
//   TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID -> you get a phone ping per lead with
//     a one-tap link to their map.
//
// Everything is best-effort: a delivery hiccup never breaks the visitor's
// experience, it only logs. Leave the env vars empty to skip a channel.

import { CONFIG } from "@/config";
import { AuditMap, QA, TapAnswers } from "@/lib/types";

const GHL_BASE = "https://services.leadconnectorhq.com";

export interface AuditLead {
  id: string; name: string; email: string; phone: string;
  taps: TapAnswers; history: QA[]; map: AuditMap; mapUrl: string;
}

// Upsert the contact in your GHL. Exported so the lead is captured the moment
// contact info is typed, not only at map completion: a visitor who quits at
// question 3 is still a lead. Returns the contact id or null.
export async function upsertAuditContact(
  x: { name: string; email: string; phone: string },
  tags: string[]
): Promise<string | null> {
  const key = process.env.GHL_API_KEY;
  const loc = process.env.GHL_LOCATION_ID;
  if (!key || !loc) return null;
  try {
    const r = await fetch(`${GHL_BASE}/contacts/upsert`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, Version: "2021-07-28", "Content-Type": "application/json" },
      body: JSON.stringify({
        locationId: loc,
        name: x.name || undefined,
        email: x.email || undefined,
        phone: x.phone || undefined,
        source: "automation-audit",
        tags,
      }),
    });
    if (!r.ok) {
      console.error("[audit] GHL upsert failed:", r.status, (await r.text()).slice(0, 200));
      return null;
    }
    const j = (await r.json()) as { contact?: { id?: string }; id?: string };
    return j.contact?.id || j.id || null;
  } catch (e) {
    console.error("[audit] GHL upsert error:", e);
    return null;
  }
}

async function addContactNote(key: string, contactId: string, body: string): Promise<void> {
  try {
    const r = await fetch(`${GHL_BASE}/contacts/${contactId}/notes`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, Version: "2021-07-28", "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.slice(0, 20000) }),
    });
    if (!r.ok) console.error("[audit] GHL note failed:", r.status, (await r.text()).slice(0, 200));
  } catch (e) {
    console.error("[audit] GHL note error:", e);
  }
}

// Email via GHL's conversations API. Requires the location to have an email
// sending domain configured; failures are logged only.
async function sendGhlEmail(key: string, contactId: string, subject: string, html: string): Promise<void> {
  try {
    const r = await fetch(`${GHL_BASE}/conversations/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, Version: "2021-04-15", "Content-Type": "application/json" },
      body: JSON.stringify({ type: "Email", contactId, subject, html }),
    });
    if (!r.ok) console.error("[audit] GHL email failed:", r.status, (await r.text()).slice(0, 200));
  } catch (e) {
    console.error("[audit] GHL email error:", e);
  }
}

// SMS via GHL. Requires the location to have a phone number configured.
async function sendGhlSms(key: string, contactId: string, message: string): Promise<void> {
  try {
    const r = await fetch(`${GHL_BASE}/conversations/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, Version: "2021-04-15", "Content-Type": "application/json" },
      body: JSON.stringify({ type: "SMS", contactId, message }),
    });
    if (!r.ok) console.error("[audit] GHL SMS failed:", r.status, (await r.text()).slice(0, 200));
  } catch (e) {
    console.error("[audit] GHL SMS error:", e);
  }
}

async function sendTelegramPing(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text }),
    });
    if (!r.ok) console.error("[audit] Telegram ping failed:", r.status, (await r.text()).slice(0, 200));
  } catch (e) {
    console.error("[audit] Telegram ping error:", e);
  }
}

function buildNote(x: AuditLead): string {
  const qa = x.history.map((h, i) => `Q${i + 1}: ${h.q}\nA: ${h.a}`).join("\n\n");
  return [
    `AUTOMATION AUDIT · score ${x.map.score}/100`,
    `${x.taps.category} · ${x.taps.businessDesc || ""} · ${x.taps.revenue} · ${x.taps.teamSize} · leads: ${x.taps.leadSource}`,
    ``,
    `#1 recommendation: ${x.map.topPick?.name}`,
    `Diagnosis: ${x.map.diagnosis}`,
    ``,
    `THE INTERVIEW`,
    qa,
    ``,
    `Their full map: ${x.mapUrl}`,
  ].join("\n");
}

export async function deliverLead(x: AuditLead): Promise<void> {
  const key = process.env.GHL_API_KEY;
  const contactId = await upsertAuditContact(x, ["automation-audit", "audit-complete"]);

  if (contactId && key) {
    await addContactNote(key, contactId, buildNote(x));

    // Their map, delivered automatically: an email always, a text if they gave
    // a phone. Written and sent from your GHL, zero manual work.
    const first = (x.name || "").split(" ")[0] || "there";
    const top = x.map.topPick?.name || "your #1 automation";
    await sendGhlEmail(
      key, contactId,
      `${first}, your automation map is ready`,
      [
        `<p>Hey ${first},</p>`,
        `<p>Your personal automation map is live. It stays at this link, nothing to download:</p>`,
        `<p><a href="${x.mapUrl}">${x.mapUrl}</a></p>`,
        `<p>Your #1: <b>${top}</b>. Every item on the map comes with the plan and a copy-paste build prompt.</p>`,
        `<p>Want your #1 built for you, free, on a call? Book here: <a href="${CONFIG.bookingUrl}">${CONFIG.bookingUrl}</a></p>`,
        `<p>${CONFIG.ownerName}</p>`,
      ].join("")
    );
    if (x.phone) {
      await sendGhlSms(
        key, contactId,
        `Hey ${first}, it's ${CONFIG.ownerName}. Your automation map is live: ${x.mapUrl} Your #1: ${top}. Want it built for you, free? ${CONFIG.bookingUrl}`
      );
    }
  }

  await sendTelegramPing([
    `New audit lead: ${x.name || x.email}`,
    `Score ${x.map.score}/100 · ${x.taps.category} · ${x.taps.revenue}`,
    `#1: ${x.map.topPick?.name}`,
    `Map: ${x.mapUrl}`,
  ].join("\n"));
}
