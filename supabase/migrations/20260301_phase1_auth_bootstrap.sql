-- Phase 1 / Auth bootstrap: create account + user mapping for first login/register

create or replace function public.bootstrap_current_user(p_account_name text default null)
returns table(account_id uuid, user_id uuid, created boolean)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_email text;
  v_existing_account uuid;
  v_account_id uuid;
  v_name text;
  v_slug text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select u.account_id
  into v_existing_account
  from public.users u
  where u.id = v_user_id
  limit 1;

  if v_existing_account is not null then
    return query select v_existing_account, v_user_id, false;
    return;
  end if;

  select au.email
  into v_email
  from auth.users au
  where au.id = v_user_id;

  v_name := nullif(trim(coalesce(p_account_name, '')), '');
  if v_name is null then
    v_name := coalesce(split_part(v_email, '@', 1), 'LeadScorer Workspace');
  end if;

  v_name := left(v_name, 120);
  v_slug := lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then
    v_slug := 'workspace';
  end if;
  v_slug := left(v_slug, 40) || '-' || right(replace(v_user_id::text, '-', ''), 8);

  insert into public.accounts (name, slug)
  values (v_name, v_slug)
  returning id into v_account_id;

  insert into public.users (id, account_id, email, role)
  values (v_user_id, v_account_id, coalesce(v_email, ''), 'owner')
  on conflict (id) do nothing;

  update public.accounts
  set owner_user_id = v_user_id
  where id = v_account_id;

  return query select v_account_id, v_user_id, true;
end;
$$;

revoke all on function public.bootstrap_current_user(text) from public;
grant execute on function public.bootstrap_current_user(text) to authenticated;
