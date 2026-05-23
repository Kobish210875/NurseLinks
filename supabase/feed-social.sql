-- Social layer for posts (run in Supabase SQL Editor after schema.sql)

create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_likes_post_id_idx on public.post_likes (post_id);
create index if not exists post_likes_user_id_idx on public.post_likes (user_id);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint post_comments_body_len check (char_length(body) <= 2000)
);

create index if not exists post_comments_post_created_idx
  on public.post_comments (post_id, created_at desc);

alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;

create policy "Post likes are readable by everyone"
  on public.post_likes for select
  using (true);

create policy "Users can like as themselves"
  on public.post_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can unlike their own like"
  on public.post_likes for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Post comments are readable by everyone"
  on public.post_comments for select
  using (true);

create policy "Users can comment as themselves"
  on public.post_comments for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "Post authors can delete comments on their posts"
  on public.post_comments for delete
  to authenticated
  using (
    exists (
      select 1
      from public.posts p
      where p.id = post_id
        and p.author_id = auth.uid()
    )
  );

-- Aggregate counts for feed (one round-trip)
create or replace function public.feed_post_stats(post_ids uuid[])
returns table (post_id uuid, like_count bigint, comment_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select pid as post_id,
    (select count(*)::bigint from post_likes l where l.post_id = pid),
    (select count(*)::bigint from post_comments c where c.post_id = pid)
  from unnest(post_ids) as u(pid);
$$;

grant execute on function public.feed_post_stats(uuid[]) to anon, authenticated;
