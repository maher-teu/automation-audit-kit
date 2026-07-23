# The 5-Minute Automation Audit, lead magnet kit

A copy-paste lead magnet for business owners who help other businesses with AI.
Visitors get interviewed by an AI consultant (they can speak their answers), and receive
a personal automation map: what to automate, what each item saves or makes them (computed
from THEIR numbers), a plan per item, and a copy-paste Claude Code starter prompt per item.
You get their name, email, phone, the full transcript, and a booking CTA for a free build call.

## What's inside

- `template/` — the complete Next.js app (deploy target: Vercel free tier)
  - AI interviewer (cap 12, one simple question at a time), tap-able answers with clear
    multi-select, a back button, live voice dictation (waveform, cancel, confirm, words
    stream as you speak, zero keys needed), pinned chat-style answer bar, subtle sounds
  - Contact captured BEFORE the interview: a visitor who quits at question 3 is still a lead
  - Living map page with persistent link, checkboxes, ROI lines, plans, and interview-first
    Claude Code starter prompts (each prompt makes Claude Code interview the owner about
    their real tools before building), plus the standard playbook per business type
  - Automation Score + share page (friends land on the start page, never someone's results)
  - Map delivery is unkillable: the phone polls the database while the map builds, a lost
    response can never strand a visitor, and retries return the existing map instantly
  - Leads: private `/leads` page with a drop-off funnel and REAL API costs (exact tokens
    logged per Claude call: today / 30 days / all time / per lead), plus optional GHL
    (contact + notes + auto email/SMS to the lead), Telegram ping, Resend, GHL webhook
  - Curated library: 53 vetted automations across 4 business categories + the universal
    Money Dashboard (cash as the hero, sources scored by money, not lead count)
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
