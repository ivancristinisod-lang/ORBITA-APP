-- ORBITA V0.7.0 Private Alpha trigger hardening
-- Avoid reading OLD on INSERT events where no OLD record exists.

create or replace function private.orbita_tester_registry_timestamps()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();

  if tg_op = 'INSERT' then
    if new.status = 'invited' then
      new.invited_at = coalesce(new.invited_at, pg_catalog.now());
    elsif new.status = 'first_value' then
      new.first_value_at = coalesce(new.first_value_at, pg_catalog.now());
    elsif new.status = 'action_taken' then
      new.action_taken_at = coalesce(new.action_taken_at, pg_catalog.now());
    elsif new.status = 'retained' then
      new.retained_at = coalesce(new.retained_at, pg_catalog.now());
    end if;
    return new;
  end if;

  if new.status = 'invited' and old.status is distinct from 'invited' then
    new.invited_at = coalesce(new.invited_at, pg_catalog.now());
  end if;
  if new.status = 'first_value' and old.status is distinct from 'first_value' then
    new.first_value_at = coalesce(new.first_value_at, pg_catalog.now());
  end if;
  if new.status = 'action_taken' and old.status is distinct from 'action_taken' then
    new.action_taken_at = coalesce(new.action_taken_at, pg_catalog.now());
  end if;
  if new.status = 'retained' and old.status is distinct from 'retained' then
    new.retained_at = coalesce(new.retained_at, pg_catalog.now());
  end if;
  return new;
end;
$$;

revoke all on function private.orbita_tester_registry_timestamps() from public, anon, authenticated;

create or replace function private.orbita_log_tester_invite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'invited' then
      insert into public.orbita_funnel_events (tester_id, user_id, event_name, properties)
      values (new.id, new.auth_user_id, 'tester_invited', '{}'::jsonb);
    end if;
    return new;
  end if;

  if new.status = 'invited' and old.status is distinct from 'invited' then
    insert into public.orbita_funnel_events (tester_id, user_id, event_name, properties)
    values (new.id, new.auth_user_id, 'tester_invited', '{}'::jsonb);
  end if;
  return new;
end;
$$;

revoke all on function private.orbita_log_tester_invite() from public, anon, authenticated;
