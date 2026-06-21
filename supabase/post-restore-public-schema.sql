-- Run after restoring public schema from a snapshot (GitHub restore or manual psql).
-- DROP SCHEMA public CASCADE removes public.handle_new_user(); the auth.users trigger
-- may then be broken and auth accounts can exist without a matching profiles row.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, headline, city)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    ),
    nullif(new.raw_user_meta_data ->> 'headline', ''),
    nullif(new.raw_user_meta_data ->> 'city', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auth users survive restore but profiles come from the backup file only.
insert into public.profiles (id, full_name, headline)
select
  u.id,
  coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    split_part(u.email, '@', 1)
  ),
  nullif(u.raw_user_meta_data ->> 'headline', '')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
  and u.deleted_at is null
on conflict (id) do nothing;

-- Snapshot backups use pg_dump --no-acl, so PostgREST roles lose table access.
grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on all tables in schema public to postgres, service_role;
grant all on all functions in schema public to postgres, service_role;
grant all on all sequences in schema public to postgres, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

grant usage on all sequences in schema public to authenticated, anon;
