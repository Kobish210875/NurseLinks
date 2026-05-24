-- Post shares (send link to a connection via messages). Run after feed-social.sql

create table if not exists public.post_shares (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  sharer_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint post_shares_unique_per_recipient unique (post_id, sharer_id, recipient_id)
);

create index if not exists post_shares_post_id_idx on public.post_shares (post_id);

alter table public.post_shares enable row level security;

create policy "Post shares are readable by everyone"
  on public.post_shares for select
  using (true);

create policy "Users can share as themselves"
  on public.post_shares for insert
  to authenticated
  with check (auth.uid() = sharer_id);

-- Extend feed stats RPC (adds share_count; must drop old return type first)
drop function if exists public.feed_post_stats(uuid[]);

create function public.feed_post_stats(post_ids uuid[])
returns table (
  post_id uuid,
  like_count bigint,
  comment_count bigint,
  share_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select pid as post_id,
    (select count(*)::bigint from post_likes l where l.post_id = pid),
    (select count(*)::bigint from post_comments c where c.post_id = pid),
    (select count(*)::bigint from post_shares s where s.post_id = pid)
  from unnest(post_ids) as u(pid);
$$;

grant execute on function public.feed_post_stats(uuid[]) to anon, authenticated;
