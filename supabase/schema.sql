-- ORBITA V0.5.1 — canonical fresh-install schema
-- Security baseline: per-user isolation, forced RLS, least privilege,
-- server-controlled metadata and optimistic concurrency revision.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.orbita_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  workspace jsonb not null default '{}'::jsonb,
  payload_schema_version integer not null default 3 check (payload_schema_version >= 1),
  revision bigint not null default 1 check (revision >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orbita_workspace_must_be_object check (jsonb_typeof(workspace) = 'object')
);

create or replace function private.orbita_set_server_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if TG_OP = 'INSERT' then
    new.created_at = pg_catalog.now();
    new.updated_at = pg_catalog.now();
    new.revision = 1;
    new.payload_schema_version = 3;
  else
    new.user_id = old.user_id;
    new.created_at = old.created_at;
    new.updated_at = pg_catalog.now();
    new.revision = old.revision + 1;
    new.payload_schema_version = old.payload_schema_version;
  end if;
  return new;
end;
$$;

revoke all on function private.orbita_set_server_fields() from public, anon, authenticated;

drop trigger if exists orbita_workspaces_set_server_fields on public.orbita_workspaces;
create trigger orbita_workspaces_set_server_fields
before insert or update on public.orbita_workspaces
for each row
execute function private.orbita_set_server_fields();

alter table public.orbita_workspaces enable row level security;
alter table public.orbita_workspaces force row level security;

revoke all on table public.orbita_workspaces from public, anon, authenticated;
grant select (user_id, workspace, payload_schema_version, revision, created_at, updated_at)
  on table public.orbita_workspaces to authenticated;
grant insert (user_id, workspace)
  on table public.orbita_workspaces to authenticated;
grant update (workspace)
  on table public.orbita_workspaces to authenticated;
grant delete on table public.orbita_workspaces to authenticated;

drop policy if exists "Users can read own ORBITA workspace" on public.orbita_workspaces;
create policy "Users can read own ORBITA workspace"
on public.orbita_workspaces
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and coalesce((((select auth.jwt())->>'is_anonymous')::boolean), false) = false
);

drop policy if exists "Users can insert own ORBITA workspace" on public.orbita_workspaces;
create policy "Users can insert own ORBITA workspace"
on public.orbita_workspaces
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and coalesce((((select auth.jwt())->>'is_anonymous')::boolean), false) = false
);

drop policy if exists "Users can update own ORBITA workspace" on public.orbita_workspaces;
create policy "Users can update own ORBITA workspace"
on public.orbita_workspaces
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and coalesce((((select auth.jwt())->>'is_anonymous')::boolean), false) = false
)
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and coalesce((((select auth.jwt())->>'is_anonymous')::boolean), false) = false
);

drop policy if exists "Users can delete own ORBITA workspace" on public.orbita_workspaces;
create policy "Users can delete own ORBITA workspace"
on public.orbita_workspaces
for delete
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and coalesce((((select auth.jwt())->>'is_anonymous')::boolean), false) = false
);

comment on table public.orbita_workspaces is 'ORBITA V0.5 per-user workspace. Access must remain isolated by RLS.';
comment on column public.orbita_workspaces.workspace is 'User-owned relational workspace payload. Never expose through service-role credentials in client code.';
comment on column public.orbita_workspaces.payload_schema_version is 'Schema version of the JSON workspace payload. Product release version is tracked separately.';
comment on column public.orbita_workspaces.revision is 'Server-controlled optimistic concurrency revision. Clients must never set this value directly.';
