import { headers } from "next/headers";
import AuditClient from "./audit-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Server wrapper: reads the visitor's country from the edge (Vercel geo header)
// so the phone country code defaults to where they actually are, not their
// browser language (a Swede with an English phone was getting UK +44).
export default async function AuditStartPage() {
  const h = await headers();
  const country = (h.get("x-vercel-ip-country") || "").toUpperCase();
  return <AuditClient country={country} />;
}
