create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.orbita_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  workspace jsonb not null default '{}'::jsonb,
  schema_version integer not null default 5 check (schema_version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orbita_workspace_must_be_object check (jsonb_typeof(workspace) = 'object')
);

create or replace function private.orbita_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function private.orbita_set_updated_at() from public, anon, authenticated;

drop trigger if exists orbita_workspaces_set_updated_at on public.orbita_workspaces;
create trigger orbita_workspaces_set_updated_at
before update on public.orbita_workspaces
for each row
execute function private.orbita_set_updated_at();

alter table public.orbita_workspaces enable row level security;
alter table public.orbita_workspaces force row level security;

revoke all on table public.orbita_workspaces from public, anon, authenticated;
grant select, insert, update, delete on table public.orbita_workspaces to authenticated;

drop policy if exists "Users can read own ORBITA workspace" on public.orbita_workspaces;
create policy "Users can read own ORBITA workspace"
on public.orbita_workspaces
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false
);

drop policy if exists "Users can insert own ORBITA workspace" on public.orbita_workspaces;
create policy "Users can insert own ORBITA workspace"
on public.orbita_workspaces
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false
);

drop policy if exists "Users can update own ORBITA workspace" on public.orbita_workspaces;
create policy "Users can update own ORBITA workspace"
on public.orbita_workspaces
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false
)
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false
);

drop policy if exists "Users can delete own ORBITA workspace" on public.orbita_workspaces;
create policy "Users can delete own ORBITA workspace"
on public.orbita_workspaces
for delete
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false
);

comment on table public.orbita_workspaces is 'ORBITA V0.5 per-user workspace. Access must remain isolated by RLS.';
comment on column public.orbita_workspaces.workspace is 'User-owned relational workspace payload. Never expose through service-role credentials in client code.';
