// ─────────────────────────────────────────────────────────────────────────────
// YOUR AUDIT, YOUR BRAND. This is the ONLY file you need to edit.
// Claude Code fills this in for you during setup (see SETUP.md).
// ─────────────────────────────────────────────────────────────────────────────

export const CONFIG = {
  // You (shown on the page and used by the agent when it talks about you).
  ownerName: "Your Name",
  businessName: "Your Business",

  // Who you serve. Free text, be specific. The agent reads this and adapts its
  // questions and vocabulary to that market automatically.
  // Examples: "kitchen and bathroom remodelers in Sweden",
  //           "online fitness coaches", "local restaurants and cafes"
  targetNiche: "business owners",

  // The interviewer's name. Give it personality.
  agentName: "Otto",

  // Where "book a call" goes (your Calendly / GHL calendar link).
  bookingUrl: "https://calendly.com/your-link",

  // Free-build offer copy. The scarcity number should be REAL.
  buildCallsPerWeek: 3,

  // Language the agent interviews in ("auto" detects from the visitor's browser).
  language: "auto" as "auto" | "en" | "sv" | "de" | "es",

  // Max interview questions after the 4 quick taps (hard cap 10).
  maxQuestions: 12,

  // Claude model for the interview + map generation.
  model: "claude-sonnet-4-6",

  // Small footer credit for the kit's author. Set to false to hide.
  poweredBy: true,
  poweredByLabel: "Built with Maher's Automation Audit kit",
  poweredByUrl: "https://github.com/maher-teu/automation-audit-kit",

  // Accent color (the gold). Change if you want your own brand color.
  accent: "#e6c25a",
};

export type Config = typeof CONFIG;
