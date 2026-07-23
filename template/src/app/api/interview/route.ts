import { NextRequest, NextResponse } from "next/server";
import { claude, extractJson, interviewerSystem, historyToMessages } from "@/lib/ai";
import { CONFIG } from "@/config";
import { logUsage } from "@/lib/usage";
import { InterviewTurn, QA, TapAnswers } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// One interview turn: given everything so far, the agent asks the next question
// (with tap-able suggestions and occasional insights) or declares it has enough.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { taps: TapAnswers; name: string; history: QA[] };
    const { taps, name, history } = body;
    if (!taps?.category) return NextResponse.json({ error: "missing taps" }, { status: 400 });

    const cap = Math.min(CONFIG.maxQuestions, 12);
    if ((history?.length || 0) >= cap) {
      return NextResponse.json({ done: true } satisfies InterviewTurn);
    }

    const msgs = historyToMessages(history || []);
    msgs.push({
      role: "user",
      content: history?.length
        ? "(Ask your next question, or stop if you have enough. JSON only.)"
        : "(Start the interview with your first question. JSON only.)",
    });

    const resp = await claude().messages.create({
      model: CONFIG.model,
      max_tokens: 500,
      system: interviewerSystem(taps, name || ""),
      messages: msgs,
    });
    await logUsage("interview", CONFIG.model, resp.usage);
    const text = resp.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n");
    const turn = extractJson<InterviewTurn>(text);
    return NextResponse.json(turn);
  } catch (e) {
    console.error("interview error:", e);
    // Fail soft: end the interview rather than stranding the visitor.
    return NextResponse.json({ done: true } satisfies InterviewTurn);
  }
}
