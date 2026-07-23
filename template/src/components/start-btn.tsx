"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { tick } from "@/components/sound";

// The start button: prefetches the interview page, plays a soft tick, fades the
// landing out, and shows a loading state, so the hop to the audit feels like a
// sequence instead of a glitch. Also logs the landing view for the funnel.
export default function StartButton({ href, children }: { href: string; children: React.ReactNode }) {
  const [going, setGoing] = useState(false);

  useEffect(() => {
    try {
      let s = localStorage.getItem("audit-sid");
      if (!s) { s = crypto.randomUUID(); localStorage.setItem("audit-sid", s); }
      fetch("/api/track", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: s, stage: "landing" }), keepalive: true,
      }).catch(() => {});
    } catch { /* tracking never blocks */ }
  }, []);

  return (
    <Link className="btn" href={href} prefetch
      onClick={() => {
        tick();
        setGoing(true);
        document.querySelector("main.wrap")?.classList.add("kit-leaving");
      }}
      style={{ fontSize: 16, padding: "16px 34px", opacity: going ? 0.85 : 1 }}>
      {going && <span className="kit-spin" aria-hidden />}
      {going ? "Opening your audit…" : children}
    </Link>
  );
}
