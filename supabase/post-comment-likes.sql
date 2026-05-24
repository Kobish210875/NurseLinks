-- Comment likes + authors can delete their own comments (run in Supabase SQL Editor)

create table if not exists public.post_comment_likes (
  comment_id uuid not null references public.post_comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists post_comment_likes_comment_id_idx
  on public.post_comment_likes (comment_id);

create index if not exists post_comment_likes_user_id_idx
  on public.post_comment_likes (user_id);

alter table public.post_comment_likes enable row level security;

create policy "Comment likes are readable by everyone"
  on public.post_comment_likes for select
  using (true);

create policy "Users can like comments as themselves"
  on public.post_comment_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can unlike their own comment like"
  on public.post_comment_likes for delete
  to authenticated
  using (auth.uid() = user_id);

-- Allow comment authors to remove their own comments (post authors already can via feed-social.sql)
drop policy if exists "Comment authors can delete their own comments" on public.post_comments;

create policy "Comment authors can delete their own comments"
  on public.post_comments for delete
  to authenticated
  using (auth.uid() = author_id);
