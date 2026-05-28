-- Scheduled snapshots for connection recommendations
-- Run in Supabase SQL Editor.

create table if not exists public.connection_recommendation_snapshots (
  user_id uuid not null references public.profiles (id) on delete cascade,
  candidate_id uuid not null references public.profiles (id) on delete cascade,
  mutual_count bigint not null default 0,
  mutual_ids uuid[] not null default '{}',
  rank integer not null,
  generated_at timestamptz not null default now(),
  primary key (user_id, candidate_id)
);

create index if not exists connection_recommendation_snapshots_user_rank_idx
  on public.connection_recommendation_snapshots (user_id, rank);

alter table public.connection_recommendation_snapshots enable row level security;

drop policy if exists "Users can read their recommendation snapshots" on public.connection_recommendation_snapshots;
create policy "Users can read their recommendation snapshots"
  on public.connection_recommendation_snapshots for select
  to authenticated
  using (auth.uid() = user_id);

drop function if exists public.connection_recommendations_for_user(uuid, int);
create function public.connection_recommendations_for_user(target_user_id uuid, limit_count int default 10)
returns table (profile_id uuid, mutual_count bigint, mutual_ids uuid[])
language sql
stable
security definer
set search_path = public
as $$
  with my_connections as (
    select
      case
        when c.requester_id = target_user_id then c.addressee_id
        else c.requester_id
      end as friend_id
    from public.connections c
    where c.status = 'accepted'
      and target_user_id in (c.requester_id, c.addressee_id)
  ),
  existing_connections as (
    select
      case
        when c.requester_id = target_user_id then c.addressee_id
        else c.requester_id
      end as peer_id
    from public.connections c
    where target_user_id in (c.requester_id, c.addressee_id)
  ),
  second_degree as (
    select distinct
      case
        when c.requester_id = mc.friend_id then c.addressee_id
        else c.requester_id
      end as candidate_id,
      mc.friend_id
    from my_connections mc
    join public.connections c
      on c.status = 'accepted'
      and mc.friend_id in (c.requester_id, c.addressee_id)
  )
  select
    sd.candidate_id as profile_id,
    count(distinct sd.friend_id)::bigint as mutual_count,
    array_agg(distinct sd.friend_id order by sd.friend_id) as mutual_ids
  from second_degree sd
  join public.profiles p on p.id = sd.candidate_id
  where sd.candidate_id <> target_user_id
    and p.deleted_at is null
    and not exists (
      select 1 from my_connections mc where mc.friend_id = sd.candidate_id
    )
    and not exists (
      select 1 from existing_connections ec where ec.peer_id = sd.candidate_id
    )
  group by sd.candidate_id
  order by count(distinct sd.friend_id) desc, max(p.created_at) desc
  limit greatest(0, limit_count);
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
    rank,
    generated_at
  )
  select
    p.id as user_id,
    r.profile_id as candidate_id,
    r.mutual_count,
    r.mutual_ids,
    row_number() over (partition by p.id order by r.mutual_count desc, r.profile_id) as rank,
    now()
  from public.profiles p
  cross join lateral public.connection_recommendations_for_user(p.id, limit_count) r
  where p.deleted_at is null;

  get diagnostics affected_rows = row_count;
  return affected_rows;
end;
$$;

grant execute on function public.connection_recommendations_for_user(uuid, int) to authenticated;
grant execute on function public.refresh_connection_recommendation_snapshots(int) to service_role;
