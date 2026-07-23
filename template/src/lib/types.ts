// Shared shapes for the audit flow.

export interface TapAnswers {
  category: "online" | "local" | "ecom" | "saas";
  businessDesc: string; // their own words: "I run a tattoo studio in Malmo"
  revenue: string;   // e.g. "$10-30k/mo"
  teamSize: string;  // e.g. "Just me"
  leadSource: string;
}

export interface QA { q: string; a: string; }

export interface InterviewTurn {
  done: boolean;
  question?: string;
  suggestions?: string[]; // tap-able answers, always offered so typing is optional
  multiSelect?: boolean;  // true = several suggestions can be true at once (toggle + send)
  insight?: string;       // mid-interview "found so far" drop, shown persistently
  foundSoFar?: number;    // running count of automations spotted
}

export interface MapItem {
  name: string;
  why: string;        // one sentence: the ROI, computed with THEIR numbers where possible
  mech: "makes_money" | "saves_time" | "both";
  time: "60min" | "half_day" | "week";
  tools: string;
  plan: string[];     // 3-5 concrete steps
  prompt: string;     // copy-paste Claude Code starter prompt, pre-filled with their context
  surprise?: boolean;
}

export interface AuditMap {
  headline: string;      // max 8 words, punchy: "Marcus, you are doing 3 people's jobs"
  diagnosis: string;     // 2-3 sentences computed from their numbers (shown in a card)
  score: number;         // 0-100 automation score (higher = more automated already)
  scoreLine: string;     // "You're leaving roughly $4,200/month on the table"
  hoursBack?: string;    // short stat: "12 hrs/week"
  moneyBack?: string;    // short stat: "$3-5k/mo"
  topPick: MapItem;
  quickWins: MapItem[];  // 6-9 items, ROI-filtered, includes 1-2 surprise picks
  bigBuilds: { name: string; what: string }[]; // exactly 3, honestly scoped
  dashboard: MapItem;    // the universal Money Dashboard, always present
}

export interface AuditRow {
  id: string;
  session_id: string | null;
  stage: string | null;   // furthest stage reached (contact, tap_*, q3, map_ready...)
  name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  taps: TapAnswers | null;
  history: QA[] | null;
  map: AuditMap | null;
  built: string[] | null; // names of items they checked off
  created_at: string;
}
