-- Only post authors may delete comments on their posts (run after feed-social.sql)
-- Deleting a post still removes all likes/comments via ON DELETE CASCADE.

drop policy if exists "Users can delete their own comments" on public.post_comments;
drop policy if exists "Post authors can delete comments on their posts" on public.post_comments;

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
