# SETUP.md, the guided installer

**To Claude Code:** you are setting up the Automation Audit lead magnet for a business owner
(the "student"). They may be non-technical. Your job: interview them briefly, configure the
template, and get it deployed on THEIR accounts. Be warm, give one instruction at a time,
never dump jargon. Everything lives in the `template/` folder next to this file.

## Step 1, interview the student (ask, then fill `template/src/config.ts`)

Ask these, one at a time, plain language:
1. Your first name and business name?
2. Who do you serve? Be specific ("kitchen remodelers in Sweden" beats "businesses").
3. What should your AI interviewer be called? (suggest a short friendly name if they shrug)
4. Your booking link (Calendly or GHL calendar). If none, offer to help create a Calendly now.
5. How many free build calls per week can you really handle? (default 3)
6. Language: auto, en, sv, de, es? (default auto)

Fill their answers into `template/src/config.ts`. Leave `poweredBy` as it is unless they ask.

## Step 2, accounts and keys (walk them through each, one at a time)

They need four things. For each: open the URL for them, tell them exactly what to click,
and where to paste the result. Create `template/.env.local` from `.env.example` as you go.

1. **Anthropic API key** (powers the agent): console.anthropic.com -> API keys -> Create key.
   Paste into `ANTHROPIC_API_KEY`. If they have no account, they create one first (2 min).
2. **Supabase** (stores audits + leads, free): supabase.com -> New project (any name, any
   region near them, generate a password). Then: Project Settings -> API, copy the URL into
   `SUPABASE_URL` and the `service_role` key into `SUPABASE_SERVICE_ROLE_KEY`.
   Then: SQL Editor -> New query -> paste the contents of `template/db/schema.sql` -> Run.
3. **LEADS_KEY**: generate a long random string yourself and set it. Tell them: your private
   leads page will be `your-site.com/leads?k=THIS_KEY`, save it somewhere.
4. **Optional, offer but do not push:**
   - Resend (free) for email delivery: resend.com -> API key -> `RESEND_API_KEY`, their email
     into `NOTIFY_EMAIL`.
   - GHL: Automations -> Workflows -> new workflow with an **Inbound Webhook** trigger, copy
     the webhook URL into `GHL_WEBHOOK_URL`. New leads then land straight in their GHL.

## Step 3, verify locally

```bash
cd template && npm install && npm run dev
```
Open http://localhost:3000, run one full audit yourself end to end (use their real business,
it doubles as their first demo). Fix anything broken before deploying.

## Step 4, deploy to Vercel (their account)

1. If they have no GitHub: create the repo path anyway via Vercel CLI: `npx vercel` from
   `template/`, log them in (it opens the browser), accept defaults.
2. Add every variable from `.env.local` to Vercel: `npx vercel env add` for each, or via the
   dashboard (Project -> Settings -> Environment Variables).
3. Also set `NEXT_PUBLIC_BASE_URL` to their final URL (e.g. https://their-project.vercel.app)
   so emailed map links are correct.
4. `npx vercel --prod`. Open the live URL, run one more full audit on production.

## Step 5, hand over (tell them exactly this)

- Your audit lives at: [their URL]. Put it in your bio, your emails, send it to past leads.
- Your private leads page: [their URL]/leads?k=[their key].
- Every lead also emails you / lands in GHL (if configured).
- To change your niche, name, or booking link: edit `src/config.ts`, then `npx vercel --prod`.
- Post it somewhere today. The first share is the hardest one.

Rules for you, Claude Code: never expose keys in chat output, never skip the end-to-end test,
and if anything errors, fix it yourself before showing the student a broken page.
