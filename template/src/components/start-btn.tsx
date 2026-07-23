"use client";
import Link from "next/link";
import { useState } from "react";

// The start button: prefetches the interview page and shows a real pressed/loading
// state the instant it is tapped, so navigation never feels glitchy.
export default function StartButton({ href, children }: { href: string; children: React.ReactNode }) {
  const [going, setGoing] = useState(false);
  return (
    <Link className="btn" href={href} prefetch
      onClick={() => setGoing(true)}
      style={{ fontSize: 16, padding: "16px 34px", opacity: going ? 0.85 : 1 }}>
      {going && <span className="kit-spin" aria-hidden />}
      {going ? "Opening your audit…" : children}
    </Link>
  );
}
