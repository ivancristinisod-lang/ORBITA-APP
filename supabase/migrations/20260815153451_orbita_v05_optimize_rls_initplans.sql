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
