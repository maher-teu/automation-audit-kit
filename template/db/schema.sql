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

-- Contact-first flow + drop-off tracking (safe to re-run).
alter table audits add column if not exists session_id text;
alter table audits add column if not exists stage text;
alter table audits add column if not exists website text;

create table if not exists audit_events (
  id bigint generated always as identity primary key,
  session_id text not null,
  stage text not null,
  created_at timestamptz not null default now()
);
create index if not exists audit_events_session_idx on audit_events(session_id);
create index if not exists audit_events_stage_idx on audit_events(stage);
alter table audit_events enable row level security;

-- Real API cost tracking (safe to re-run).
create table if not exists audit_usage (
  id bigint generated always as identity primary key,
  kind text not null,
  model text not null,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  cache_write_tokens bigint not null default 0,
  cache_read_tokens bigint not null default 0,
  cost_usd numeric(12,6) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists audit_usage_created_idx on audit_usage(created_at desc);
alter table audit_usage enable row level security;
