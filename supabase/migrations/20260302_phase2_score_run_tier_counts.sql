-- Phase 2 / P2.5: capture tier counts per scoring run for trend analytics

alter table public.score_runs
  add column if not exists tier_counts jsonb not null default '{"hot":0,"warm":0,"cold":0}'::jsonb;
