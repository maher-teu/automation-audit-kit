// Real cost tracking for the audit tool. Every Claude API call logs its exact
// token counts (from the API's own usage object) and the computed dollar cost
// into Supabase. No estimates: tokens x published per-token price.

import { sb } from "@/lib/db";

// USD per 1M tokens. Cache writes bill at 1.25x input (5-minute TTL),
// cache reads at 0.1x input.
const PRICES: Record<string, { in: number; out: number }> = {
  "claude-sonnet-4-6": { in: 3.0, out: 15.0 },
  "claude-sonnet-5": { in: 3.0, out: 15.0 },
  "claude-haiku-4-5": { in: 1.0, out: 5.0 },
  "claude-opus-4-8": { in: 5.0, out: 25.0 },
};

export interface ApiUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

export function costUsd(model: string, u: ApiUsage): number {
  const p = PRICES[model] || PRICES["claude-sonnet-4-6"];
  const cacheWrite = u.cache_creation_input_tokens || 0;
  const cacheRead = u.cache_read_input_tokens || 0;
  return (
    (u.input_tokens * p.in +
      cacheWrite * p.in * 1.25 +
      cacheRead * p.in * 0.1 +
      u.output_tokens * p.out) /
    1_000_000
  );
}

// Fire-and-forget: cost logging must never break or slow the visitor.
export async function logUsage(kind: "interview" | "generate", model: string, u: ApiUsage | undefined | null): Promise<void> {
  if (!u) return;
  try {
    await sb().from("audit_usage").insert({
      kind,
      model,
      input_tokens: u.input_tokens || 0,
      output_tokens: u.output_tokens || 0,
      cache_write_tokens: u.cache_creation_input_tokens || 0,
      cache_read_tokens: u.cache_read_input_tokens || 0,
      cost_usd: costUsd(model, u),
    });
  } catch (e) {
    console.error("[audit] usage log failed:", e);
  }
}
