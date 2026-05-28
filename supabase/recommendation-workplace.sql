-- Workplace + mutual connection recommendations (run after recommendation-snapshots.sql)

create index if not exists profiles_workplace_slug_active_idx
  on public.profiles (workplace_institution_slug)
  where deleted_at is null and workplace_institution_slug is not null;

alter table public.connection_recommendation_snapshots
  add column if not exists source text not null default 'mutual'
    check (source in ('mutual', 'workplace', 'both')),
  add column if not exists institution_slug text;

-- Colleagues at the same medical institution (indexed column only).
drop function if exists public.workplace_colleague_recommendations_for_user(uuid, int);
create function public.workplace_colleague_recommendations_for_user(
  target_user_id uuid,
  limit_count int default 10
)
returns table (profile_id uuid, institution_slug text)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select workplace_institution_slug as slug
    from public.profiles
    where id = target_user_id
      and deleted_at is null
      and workplace_institution_slug is not null
  ),
  existing_connections as (
    select
      case
        when c.requester_id = target_user_id then c.addressee_id
        else c.requester_id
      end as peer_id
    from public.connections c
    where target_user_id in (c.requester_id, c.addressee_id)
  )
  select
    p.id as profile_id,
    p.workplace_institution_slug as institution_slug
  from me
  join public.profiles p
    on p.workplace_institution_slug = me.slug
  where p.id <> target_user_id
    and p.deleted_at is null
    and not exists (
      select 1 from existing_connections ec where ec.peer_id = p.id
    )
  order by p.created_at desc
  limit greatest(0, limit_count);
$$;

-- Mutual + workplace merged; workplace colleagues ranked before mutual-only.
drop function if exists public.connection_recommendations_merged_for_user(uuid, int);
create function public.connection_recommendations_merged_for_user(
  target_user_id uuid,
  limit_count int default 10
)
returns table (
  profile_id uuid,
  mutual_count bigint,
  mutual_ids uuid[],
  source text,
  institution_slug text
)
language sql
stable
security definer
set search_path = public
as $$
  with workplace as (
    select
      w.profile_id,
      0::bigint as mutual_count,
      '{}'::uuid[] as mutual_ids,
      'workplace'::text as source,
      w.institution_slug
    from public.workplace_colleague_recommendations_for_user(target_user_id, limit_count) w
  ),
  mutual as (
    select
      m.profile_id,
      m.mutual_count,
      m.mutual_ids,
      'mutual'::text as source,
      null::text as institution_slug
    from public.connection_recommendations_for_user(target_user_id, limit_count) m
  ),
  merged as (
    select * from workplace
    union all
    select * from mutual
  ),
  deduped as (
    select
      profile_id,
      max(mutual_count) as mutual_count,
      (
        select m.mutual_ids
        from merged m
        where m.profile_id = merged.profile_id
        order by m.mutual_count desc
        limit 1
      ) as mutual_ids,
      case
        when bool_or(source = 'workplace') and bool_or(source = 'mutual') then 'both'
        when bool_or(source = 'workplace') then 'workplace'
        else 'mutual'
      end as source,
      max(institution_slug) filter (where institution_slug is not null) as institution_slug
    from merged
    group by profile_id
  )
  select
    profile_id,
    mutual_count,
    coalesce(mutual_ids, '{}'::uuid[]) as mutual_ids,
    source,
    institution_slug
  from deduped
  order by
    case source
      when 'both' then 0
      when 'workplace' then 1
      else 2
    end,
    mutual_count desc,
    profile_id
  limit greatest(0, limit_count);
$$;

drop function if exists public.connection_recommendations(int);
create function public.connection_recommendations(limit_count int default 10)
returns table (
  profile_id uuid,
  mutual_count bigint,
  mutual_ids uuid[],
  source text,
  institution_slug text
)
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.connection_recommendations_merged_for_user(auth.uid(), limit_count);
$$;

drop function if exists public.refresh_connection_recommendation_snapshots(int);
create function public.refresh_connection_recommendation_snapshots(limit_count int default 10)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_rows integer := 0;
begin
  delete from public.connection_recommendation_snapshots;

  insert into public.connection_recommendation_snapshots (
    user_id,
    candidate_id,
    mutual_count,
    mutual_ids,
    source,
    institution_slug,
    rank,
    generated_at
  )
  select
    p.id as user_id,
    r.profile_id as candidate_id,
    r.mutual_count,
    r.mutual_ids,
    r.source,
    r.institution_slug,
    row_number() over (
      partition by p.id
      order by
        case r.source
          when 'both' then 0
          when 'workplace' then 1
          else 2
        end,
        r.mutual_count desc,
        r.profile_id
    ) as rank,
    now()
  from public.profiles p
  cross join lateral public.connection_recommendations_merged_for_user(p.id, limit_count) r
  where p.deleted_at is null;

  get diagnostics affected_rows = row_count;
  return affected_rows;
end;
$$;

grant execute on function public.workplace_colleague_recommendations_for_user(uuid, int) to authenticated;
grant execute on function public.connection_recommendations_merged_for_user(uuid, int) to authenticated;
grant execute on function public.connection_recommendations(int) to authenticated;
