-- Phase 1 / Task 2: Supabase data model + indexes + RLS
-- Tables: accounts, users, leads, lead_events, score_runs

create extension if not exists pgcrypto;

-- Shared updated_at trigger helper.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  owner_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text not null,
  company text not null,
  email text not null,
  source text not null,
  score int not null check (score between 0 and 100),
  tier text not null check (tier in ('hot', 'warm', 'cold')),
  reasons text[] not null default '{}',
  last_activity text,
  ai_explanation text,
  scored_at timestamptz,
  score_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_email_format check (position('@' in email) > 1),
  constraint leads_account_email_unique unique (account_id, email)
);

create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  event_type text not null check (
    event_type in (
      'imported',
      'rescored',
      'status_changed',
      'email_sent',
      'call_logged',
      'linkedin_clicked',
      'note_added'
    )
  ),
  event_payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.score_runs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  trigger_type text not null check (trigger_type in ('import', 'manual_rescore', 'settings_save', 'scheduled')),
  config_version text not null,
  lead_count int not null default 0 check (lead_count >= 0),
  average_score numeric(5,2) not null default 0 check (average_score >= 0 and average_score <= 100),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Optional owner link after users table exists.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'accounts_owner_user_fk'
  ) then
    alter table public.accounts
      add constraint accounts_owner_user_fk
      foreign key (owner_user_id)
      references public.users(id)
      on delete set null;
  end if;
end
$$;

-- Resolve caller account from auth.users -> public.users mapping.
create or replace function public.current_account_id()
returns uuid
language sql
stable
as $$
  select u.account_id
  from public.users u
  where u.id = auth.uid()
  limit 1;
$$;

-- Indexes required by plan.
create index if not exists idx_users_account_id on public.users(account_id);
create index if not exists idx_users_email on public.users(email);

create index if not exists idx_leads_account_id on public.leads(account_id);
create index if not exists idx_leads_created_at on public.leads(created_at desc);
create index if not exists idx_leads_email on public.leads(email);
create index if not exists idx_leads_score on public.leads(score desc);
create index if not exists idx_leads_tier on public.leads(tier);

create index if not exists idx_lead_events_account_id on public.lead_events(account_id);
create index if not exists idx_lead_events_created_at on public.lead_events(created_at desc);
create index if not exists idx_score_runs_account_id on public.score_runs(account_id);
create index if not exists idx_score_runs_created_at on public.score_runs(started_at desc);

-- updated_at triggers
drop trigger if exists trg_accounts_set_updated_at on public.accounts;
create trigger trg_accounts_set_updated_at
before update on public.accounts
for each row
execute function public.set_updated_at();

drop trigger if exists trg_users_set_updated_at on public.users;
create trigger trg_users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists trg_leads_set_updated_at on public.leads;
create trigger trg_leads_set_updated_at
before update on public.leads
for each row
execute function public.set_updated_at();

-- RLS
alter table public.accounts enable row level security;
alter table public.users enable row level security;
alter table public.leads enable row level security;
alter table public.lead_events enable row level security;
alter table public.score_runs enable row level security;

-- accounts policies
drop policy if exists accounts_select_own_account on public.accounts;
create policy accounts_select_own_account
on public.accounts
for select
using (id = public.current_account_id());

drop policy if exists accounts_update_own_account on public.accounts;
create policy accounts_update_own_account
on public.accounts
for update
using (id = public.current_account_id())
with check (id = public.current_account_id());

-- users policies
drop policy if exists users_select_same_account on public.users;
create policy users_select_same_account
on public.users
for select
using (account_id = public.current_account_id());

drop policy if exists users_insert_same_account on public.users;
create policy users_insert_same_account
on public.users
for insert
with check (account_id = public.current_account_id());

drop policy if exists users_update_same_account on public.users;
create policy users_update_same_account
on public.users
for update
using (account_id = public.current_account_id())
with check (account_id = public.current_account_id());

drop policy if exists users_delete_same_account on public.users;
create policy users_delete_same_account
on public.users
for delete
using (account_id = public.current_account_id());

-- leads policies
drop policy if exists leads_select_same_account on public.leads;
create policy leads_select_same_account
on public.leads
for select
using (account_id = public.current_account_id());

drop policy if exists leads_insert_same_account on public.leads;
create policy leads_insert_same_account
on public.leads
for insert
with check (account_id = public.current_account_id());

drop policy if exists leads_update_same_account on public.leads;
create policy leads_update_same_account
on public.leads
for update
using (account_id = public.current_account_id())
with check (account_id = public.current_account_id());

drop policy if exists leads_delete_same_account on public.leads;
create policy leads_delete_same_account
on public.leads
for delete
using (account_id = public.current_account_id());

-- lead_events policies
drop policy if exists lead_events_select_same_account on public.lead_events;
create policy lead_events_select_same_account
on public.lead_events
for select
using (account_id = public.current_account_id());

drop policy if exists lead_events_insert_same_account on public.lead_events;
create policy lead_events_insert_same_account
on public.lead_events
for insert
with check (account_id = public.current_account_id());

drop policy if exists lead_events_update_same_account on public.lead_events;
create policy lead_events_update_same_account
on public.lead_events
for update
using (account_id = public.current_account_id())
with check (account_id = public.current_account_id());

drop policy if exists lead_events_delete_same_account on public.lead_events;
create policy lead_events_delete_same_account
on public.lead_events
for delete
using (account_id = public.current_account_id());

-- score_runs policies
drop policy if exists score_runs_select_same_account on public.score_runs;
create policy score_runs_select_same_account
on public.score_runs
for select
using (account_id = public.current_account_id());

drop policy if exists score_runs_insert_same_account on public.score_runs;
create policy score_runs_insert_same_account
on public.score_runs
for insert
with check (account_id = public.current_account_id());

drop policy if exists score_runs_update_same_account on public.score_runs;
create policy score_runs_update_same_account
on public.score_runs
for update
using (account_id = public.current_account_id())
with check (account_id = public.current_account_id());

drop policy if exists score_runs_delete_same_account on public.score_runs;
create policy score_runs_delete_same_account
on public.score_runs
for delete
using (account_id = public.current_account_id());
