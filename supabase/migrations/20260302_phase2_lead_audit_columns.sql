-- Phase 2 / P2.3: persist lead scoring audit fields

alter table public.leads
  add column if not exists score_breakdown jsonb not null default '[]'::jsonb;

alter table public.leads
  add column if not exists top_reasons text[] not null default '{}';
