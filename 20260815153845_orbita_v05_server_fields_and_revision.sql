drop trigger if exists orbita_workspaces_set_updated_at on public.orbita_workspaces;
drop function if exists private.orbita_set_updated_at();

alter table public.orbita_workspaces rename column schema_version to payload_schema_version;
alter table public.orbita_workspaces alter column payload_schema_version set default 3;
alter table public.orbita_workspaces add column if not exists revision bigint not null default 1 check (revision >= 1);

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

create trigger orbita_workspaces_set_server_fields
before insert or update on public.orbita_workspaces
for each row
execute function private.orbita_set_server_fields();

revoke all on table public.orbita_workspaces from public, anon, authenticated;
grant select (user_id, workspace, payload_schema_version, revision, created_at, updated_at)
  on table public.orbita_workspaces to authenticated;
grant insert (user_id, workspace)
  on table public.orbita_workspaces to authenticated;
grant update (workspace)
  on table public.orbita_workspaces to authenticated;
grant delete on table public.orbita_workspaces to authenticated;

comment on column public.orbita_workspaces.payload_schema_version is 'Schema version of the JSON workspace payload. Product release version is tracked separately.';
comment on column public.orbita_workspaces.revision is 'Server-controlled optimistic concurrency revision. Clients must never set this value directly.';
