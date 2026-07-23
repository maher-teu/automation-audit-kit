# The 5-Minute Automation Audit, lead magnet kit

A copy-paste lead magnet for business owners who help other businesses with AI.
Visitors get interviewed by an AI consultant (they can speak their answers), and receive
a personal automation map: what to automate, what each item saves or makes them (computed
from THEIR numbers), a plan per item, and a copy-paste Claude Code starter prompt per item.
You get their name, email, phone, the full transcript, and a booking CTA for a free build call.

## What's inside

- `template/` — the complete Next.js app (deploy target: Vercel free tier)
  - AI interviewer with a hard question cap, tap-able answers, and live voice dictation
    (waveform, cancel, confirm, words stream as you speak, zero keys needed)
  - Living map page with persistent link, checkboxes, ROI lines, plans, starter prompts
  - Automation Score + share page (friends land on the start page, never someone's results)
  - Leads: private `/leads` page always, plus optional email (Resend) + GHL inbound webhook
  - Curated library: 53 vetted automations across 4 business categories + the universal
    Money Dashboard, the AI tailors and computes, the library keeps it honest
- `SETUP.md` — the guided installer Claude Code follows on the student's machine
- `STUDENT_PROMPT.txt` — the one block a student pastes into a fresh Claude Code session

## Give it to a student (30-60 min for them, guided)

1. Send them the kit (zip this folder, or give them the repo URL once it is public).
2. Send them `STUDENT_PROMPT.txt`.
3. They paste it into Claude Code and follow along. Done: their own branded audit, on their
   own accounts, their own leads. Costs them ~a few cents per completed audit (their API key).

## Their customization = one file

`template/src/config.ts`: their name, niche, agent name, booking link, call cap, language,
accent color, powered-by credit. Nothing else needs touching.

## Costs (per student, monthly)

Vercel free tier + Supabase free tier + Anthropic API usage (roughly $0.03-0.08 per
completed audit with the default model). No other services required.

## Roadmap (kit v2, drop-in updates)

Phone-call mode (the agent calls them), SMS follow-up companion, benchmark data
("bottom 30% of agencies for follow-up automation"), team mode.
