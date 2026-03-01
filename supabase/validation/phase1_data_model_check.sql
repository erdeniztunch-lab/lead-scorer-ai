-- Phase 1 / Task 2 verification queries
-- Run in Supabase SQL editor after migration.

-- 1) Tables exist
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('accounts', 'users', 'leads', 'lead_events', 'score_runs')
order by table_name;

-- 2) Indexes exist
select schemaname, tablename, indexname
from pg_indexes
where schemaname = 'public'
  and (
    indexname like 'idx_users_%'
    or indexname like 'idx_leads_%'
    or indexname like 'idx_lead_events_%'
    or indexname like 'idx_score_runs_%'
  )
order by tablename, indexname;

-- 3) RLS is enabled
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('accounts', 'users', 'leads', 'lead_events', 'score_runs')
order by tablename;

-- 4) Policies exist
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('accounts', 'users', 'leads', 'lead_events', 'score_runs')
order by tablename, policyname;

-- 5) Helper function exists
select proname
from pg_proc
where proname in ('set_updated_at', 'current_account_id')
order by proname;
