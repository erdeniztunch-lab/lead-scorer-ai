-- Phase 1 / Task 6: scoring config persistence

create table if not exists public.scoring_configs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  version text not null,
  config_json jsonb not null,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scoring_configs_account_unique unique (account_id)
);

create index if not exists idx_scoring_configs_account_id on public.scoring_configs(account_id);
create index if not exists idx_scoring_configs_updated_at on public.scoring_configs(updated_at desc);

drop trigger if exists trg_scoring_configs_set_updated_at on public.scoring_configs;
create trigger trg_scoring_configs_set_updated_at
before update on public.scoring_configs
for each row
execute function public.set_updated_at();

alter table public.scoring_configs enable row level security;

drop policy if exists scoring_configs_select_same_account on public.scoring_configs;
create policy scoring_configs_select_same_account
on public.scoring_configs
for select
using (account_id = public.current_account_id());

drop policy if exists scoring_configs_insert_same_account on public.scoring_configs;
create policy scoring_configs_insert_same_account
on public.scoring_configs
for insert
with check (account_id = public.current_account_id());

drop policy if exists scoring_configs_update_same_account on public.scoring_configs;
create policy scoring_configs_update_same_account
on public.scoring_configs
for update
using (account_id = public.current_account_id())
with check (account_id = public.current_account_id());

drop policy if exists scoring_configs_delete_same_account on public.scoring_configs;
create policy scoring_configs_delete_same_account
on public.scoring_configs
for delete
using (account_id = public.current_account_id());
