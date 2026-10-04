-- ORBITA v0.5 — workspace persistence
-- Run this once in Supabase SQL Editor.

create table if not exists public.orbita_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  workspace jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.orbita_workspaces enable row level security;

grant select, insert, update, delete on table public.orbita_workspaces to authenticated;
revoke all on table public.orbita_workspaces from anon;

drop policy if exists "Users can read own ORBITA workspace" on public.orbita_workspaces;
create policy "Users can read own ORBITA workspace"
on public.orbita_workspaces for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own ORBITA workspace" on public.orbita_workspaces;
create policy "Users can insert own ORBITA workspace"
on public.orbita_workspaces for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own ORBITA workspace" on public.orbita_workspaces;
create policy "Users can update own ORBITA workspace"
on public.orbita_workspaces for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own ORBITA workspace" on public.orbita_workspaces;
create policy "Users can delete own ORBITA workspace"
on public.orbita_workspaces for delete
to authenticated
using ((select auth.uid()) = user_id);
