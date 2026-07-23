-- Automation Audit: one table holds everything.
-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run.

create extension if not exists pgcrypto;

create table if not exists audits (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  taps jsonb,        -- the 4 quick-tap answers
  history jsonb,     -- the interview transcript [{q,a}]
  map jsonb,         -- the generated automation map
  built jsonb default '[]'::jsonb,  -- item names they checked off
  created_at timestamptz not null default now()
);

create index if not exists audits_created_idx on audits (created_at desc);
create index if not exists audits_email_idx on audits (email);

-- Row Level Security ON with no public policies: only the service-role key
-- (server-side) can read or write. Visitor pages go through the app's API.
alter table audits enable row level security;
