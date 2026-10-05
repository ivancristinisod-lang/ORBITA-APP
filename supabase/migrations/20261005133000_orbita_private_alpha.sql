-- ORBITA V0.7.0 Private Alpha
-- Scope: invite-only tester registry, product funnel telemetry and support feedback.
-- No survey answers are copied into the product database. Only survey_response_id may be linked.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.orbita_tester_registry (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  display_name text not null default '',
  survey_response_id text unique,
  source_kind text not null check (source_kind in ('customer_discovery', 'self_test', 'direct')),
  status text not null default 'qualified' check (status in ('surveyed', 'qualified', 'invited', 'activated', 'first_value', 'action_taken', 'retained', 'inactive')),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  invited_at timestamptz,
  activated_at timestamptz,
  first_value_at timestamptz,
  action_taken_at timestamptz,
  retained_at timestamptz,
  aha_moment text,
  action_taken text,
  outcome text,
  qualitative_feedback text,
  blocking_bug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orbita_tester_email_nonempty check (length(trim(email)) > 3)
);

create unique index if not exists orbita_tester_registry_email_lower_uidx
  on public.orbita_tester_registry (lower(email));

alter table public.orbita_tester_registry enable row level security;
alter table public.orbita_tester_registry force row level security;
revoke all on public.orbita_tester_registry from public, anon, authenticated;

create table if not exists public.orbita_funnel_events (
  id bigint generated always as identity primary key,
  tester_id uuid references public.orbita_tester_registry(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  event_name text not null check (event_name in (
    'tester_invited',
    'account_created',
    'first_login',
    'goal_created',
    'first_person_created',
    'third_person_created',
    'first_opportunity_shown',
    'opportunity_opened',
    'opportunity_marked_relevant',
    'action_started',
    'return_session'
  )),
  session_id uuid,
  route text,
  product_version text not null default '0.7.0-alpha.1',
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint orbita_funnel_properties_object check (jsonb_typeof(properties) = 'object'),
  constraint orbita_funnel_actor_present check (tester_id is not null or user_id is not null)
);

create index if not exists orbita_funnel_events_user_created_idx
  on public.orbita_funnel_events (user_id, created_at desc);
create index if not exists orbita_funnel_events_tester_created_idx
  on public.orbita_funnel_events (tester_id, created_at desc);
create index if not exists orbita_funnel_events_name_created_idx
  on public.orbita_funnel_events (event_name, created_at desc);

create unique index if not exists orbita_funnel_once_per_user_uidx
  on public.orbita_funnel_events (user_id, event_name)
  where user_id is not null and event_name in (
    'account_created',
    'first_login',
    'goal_created',
    'first_person_created',
    'third_person_created',
    'first_opportunity_shown'
  );

alter table public.orbita_funnel_events enable row level security;
alter table public.orbita_funnel_events force row level security;
revoke all on public.orbita_funnel_events from public, anon, authenticated;
grant select, insert on public.orbita_funnel_events to authenticated;
grant usage, select on sequence public.orbita_funnel_events_id_seq to authenticated;

drop policy if exists "ORBITA testers can insert own funnel events" on public.orbita_funnel_events;
create policy "ORBITA testers can insert own funnel events"
on public.orbita_funnel_events
for insert
to authenticated
with check ((select auth.uid()) = user_id and user_id is not null);

drop policy if exists "ORBITA testers can read own funnel events" on public.orbita_funnel_events;
create policy "ORBITA testers can read own funnel events"
on public.orbita_funnel_events
for select
to authenticated
using ((select auth.uid()) = user_id and user_id is not null);

create table if not exists public.orbita_tester_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  screen text not null default '',
  issue_type text not null check (issue_type in ('feedback', 'bug', 'blocking_bug', 'other')),
  message text not null check (length(trim(message)) between 1 and 4000),
  product_version text not null default '0.7.0-alpha.1',
  technical_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint orbita_feedback_context_object check (jsonb_typeof(technical_context) = 'object')
);

create index if not exists orbita_tester_feedback_user_created_idx
  on public.orbita_tester_feedback (user_id, created_at desc);
create index if not exists orbita_tester_feedback_type_created_idx
  on public.orbita_tester_feedback (issue_type, created_at desc);

alter table public.orbita_tester_feedback enable row level security;
alter table public.orbita_tester_feedback force row level security;
revoke all on public.orbita_tester_feedback from public, anon, authenticated;
grant select, insert on public.orbita_tester_feedback to authenticated;

drop policy if exists "ORBITA testers can submit own feedback" on public.orbita_tester_feedback;
create policy "ORBITA testers can submit own feedback"
on public.orbita_tester_feedback
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "ORBITA testers can read own feedback" on public.orbita_tester_feedback;
create policy "ORBITA testers can read own feedback"
on public.orbita_tester_feedback
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Private Alpha signup gate. The product may expose the signup form, but Auth itself
-- rejects any email that was not pre-registered as an invited tester.
create or replace function private.orbita_require_private_alpha_invite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null or not exists (
    select 1
    from public.orbita_tester_registry t
    where lower(t.email) = lower(new.email)
      and t.auth_user_id is null
      and t.status in ('invited', 'activated')
  ) then
    raise exception 'ORBITA_PRIVATE_ALPHA_INVITE_REQUIRED';
  end if;
  return new;
end;
$$;

revoke all on function private.orbita_require_private_alpha_invite() from public, anon, authenticated;

drop trigger if exists orbita_require_private_alpha_invite on auth.users;
create trigger orbita_require_private_alpha_invite
before insert on auth.users
for each row execute function private.orbita_require_private_alpha_invite();

create or replace function private.orbita_link_private_alpha_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tester_id uuid;
begin
  update public.orbita_tester_registry
     set auth_user_id = new.id,
         status = 'activated',
         activated_at = coalesce(activated_at, pg_catalog.now()),
         updated_at = pg_catalog.now()
   where lower(email) = lower(new.email)
     and auth_user_id is null
  returning id into v_tester_id;

  if v_tester_id is null then
    raise exception 'ORBITA_PRIVATE_ALPHA_LINK_FAILED';
  end if;

  insert into public.orbita_funnel_events (tester_id, user_id, event_name, properties)
  values (v_tester_id, new.id, 'account_created', '{}'::jsonb)
  on conflict do nothing;

  return new;
end;
$$;

revoke all on function private.orbita_link_private_alpha_user() from public, anon, authenticated;

drop trigger if exists orbita_link_private_alpha_user on auth.users;
create trigger orbita_link_private_alpha_user
after insert on auth.users
for each row execute function private.orbita_link_private_alpha_user();

create or replace function private.orbita_tester_registry_timestamps()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  if new.status = 'invited' and (tg_op = 'INSERT' or old.status is distinct from 'invited') then
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

drop trigger if exists orbita_tester_registry_timestamps on public.orbita_tester_registry;
create trigger orbita_tester_registry_timestamps
before insert or update on public.orbita_tester_registry
for each row execute function private.orbita_tester_registry_timestamps();

create or replace function private.orbita_log_tester_invite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'invited' and (tg_op = 'INSERT' or old.status is distinct from 'invited') then
    insert into public.orbita_funnel_events (tester_id, user_id, event_name, properties)
    values (new.id, new.auth_user_id, 'tester_invited', '{}'::jsonb);
  end if;
  return new;
end;
$$;

revoke all on function private.orbita_log_tester_invite() from public, anon, authenticated;

drop trigger if exists orbita_log_tester_invite on public.orbita_tester_registry;
create trigger orbita_log_tester_invite
after insert or update on public.orbita_tester_registry
for each row execute function private.orbita_log_tester_invite();

-- Operator-only PMF view. Private schema is not exposed to browser roles.
create or replace view private.orbita_private_alpha_funnel as
select
  t.id as tester_id,
  t.display_name,
  t.survey_response_id,
  t.source_kind,
  t.status,
  t.invited_at,
  t.activated_at,
  t.first_value_at,
  t.action_taken_at,
  t.retained_at,
  t.aha_moment,
  t.action_taken,
  t.outcome,
  t.qualitative_feedback,
  t.blocking_bug,
  count(e.id) filter (where e.event_name = 'first_login') as first_login_events,
  count(e.id) filter (where e.event_name = 'return_session') as return_sessions,
  count(e.id) filter (where e.event_name = 'opportunity_opened') as opportunity_opens,
  count(e.id) filter (where e.event_name = 'opportunity_marked_relevant') as relevant_marks,
  count(e.id) filter (where e.event_name = 'action_started') as actions_started,
  max(e.created_at) as last_event_at
from public.orbita_tester_registry t
left join public.orbita_funnel_events e on e.tester_id = t.id or (t.auth_user_id is not null and e.user_id = t.auth_user_id)
group by t.id;

revoke all on private.orbita_private_alpha_funnel from public, anon, authenticated;

comment on table public.orbita_tester_registry is 'Private Alpha operator registry. Links survey respondent IDs to testers and Auth users without copying survey answers.';
comment on table public.orbita_funnel_events is 'Minimal auditable PMF funnel telemetry. Never store relationship names, notes, emails, goals or other relational content in properties.';
comment on table public.orbita_tester_feedback is 'Tester-submitted feedback and bug reports with non-sensitive technical context only.';
