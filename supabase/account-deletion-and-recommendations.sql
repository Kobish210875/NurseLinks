-- Account deletion support + mutual connection recommendations
-- Run in Supabase SQL Editor.

alter table public.profiles
  add column if not exists deleted_at timestamptz;

create index if not exists profiles_deleted_at_idx
  on public.profiles (deleted_at);

-- Deleting an account removes social graph rows while preserving historical content.
drop policy if exists "Users can delete connections they are part of" on public.connections;
create policy "Users can delete connections they are part of"
  on public.connections for delete
  to authenticated
  using (auth.uid() in (requester_id, addressee_id));

drop policy if exists "Users can delete follows they are part of" on public.follows;
create policy "Users can delete follows they are part of"
  on public.follows for delete
  to authenticated
  using (auth.uid() in (follower_id, following_id));

drop function if exists public.connection_recommendations(int);

create function public.connection_recommendations(limit_count int default 10)
returns table (profile_id uuid, mutual_count bigint, mutual_ids uuid[])
language sql
stable
security definer
set search_path = public
as $$
  with my_connections as (
    select
      case
        when c.requester_id = auth.uid() then c.addressee_id
        else c.requester_id
      end as friend_id
    from public.connections c
    where c.status = 'accepted'
      and auth.uid() in (c.requester_id, c.addressee_id)
  ),
  existing_connections as (
    select
      case
        when c.requester_id = auth.uid() then c.addressee_id
        else c.requester_id
      end as peer_id
    from public.connections c
    where auth.uid() in (c.requester_id, c.addressee_id)
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
  where sd.candidate_id <> auth.uid()
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

grant execute on function public.connection_recommendations(int) to authenticated;
