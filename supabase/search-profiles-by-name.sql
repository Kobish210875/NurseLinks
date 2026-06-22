-- People search by name (network page + navbar autocomplete).
-- Run in Supabase SQL Editor on dev and prod.
-- PostgREST cannot use SQL subqueries in .not('id','in',...) filters; this RPC
-- excludes admin users server-side when exclude_admin is true.

create or replace function public.search_profiles_by_name(
  name_pattern text,
  result_limit int default 20,
  exclude_admin boolean default true
)
returns table (
  id uuid,
  full_name text,
  headline text,
  workplace_institution_slug text,
  avatar_url text,
  cv_draft jsonb,
  deleted_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.headline,
    p.workplace_institution_slug,
    p.avatar_url,
    p.cv_draft,
    p.deleted_at
  from public.profiles p
  where auth.uid() is not null
    and p.id <> auth.uid()
    and p.deleted_at is null
    and p.full_name ilike name_pattern
    and (
      not exclude_admin
      or p.id not in (select au.user_id from public.admin_users au)
    )
  order by p.full_name asc
  limit greatest(1, least(coalesce(result_limit, 20), 50));
$$;

grant execute on function public.search_profiles_by_name(text, int, boolean) to authenticated;
