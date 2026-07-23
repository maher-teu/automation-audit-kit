// Shared shapes for the audit flow.

export interface TapAnswers {
  category: "online" | "local" | "ecom" | "saas";
  revenue: string;   // e.g. "$10-30k/mo"
  teamSize: string;  // e.g. "Just me"
  leadSource: string;
}

export interface QA { q: string; a: string; }

export interface InterviewTurn {
  done: boolean;
  question?: string;
  suggestions?: string[]; // tap-able answers, always offered so typing is optional
  insight?: string;       // mid-interview "found so far" drop, shown as a toast card
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
  headline: string;      // "Marcus, your agency is..."
  diagnosis: string;     // the money line computed from their numbers
  score: number;         // 0-100 automation score (higher = more automated already)
  scoreLine: string;     // "You're leaving roughly $4,200/month on the table"
  topPick: MapItem;
  quickWins: MapItem[];  // 6-9 items, ROI-filtered, includes 1-2 surprise picks
  bigBuilds: { name: string; what: string }[]; // exactly 3, honestly scoped
  dashboard: MapItem;    // the universal Money Dashboard, always present
}

export interface AuditRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  taps: TapAnswers | null;
  history: QA[] | null;
  map: AuditMap | null;
  built: string[] | null; // names of items they checked off
  created_at: string;
}
