-- Nested replies on post comments (run in Supabase SQL Editor after feed-social.sql)

alter table public.post_comments
  add column if not exists parent_comment_id uuid references public.post_comments (id) on delete cascade;

create index if not exists post_comments_parent_id_idx
  on public.post_comments (parent_comment_id)
  where parent_comment_id is not null;

create or replace function public.post_comments_validate_parent()
returns trigger
language plpgsql
as $$
begin
  if new.parent_comment_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.post_comments parent
    where parent.id = new.parent_comment_id
      and parent.post_id = new.post_id
  ) then
    raise exception 'parent_comment_wrong_post';
  end if;

  -- One nesting level: replies attach only to top-level comments.
  if exists (
    select 1
    from public.post_comments parent
    where parent.id = new.parent_comment_id
      and parent.parent_comment_id is not null
  ) then
    raise exception 'nested_reply_too_deep';
  end if;

  return new;
end;
$$;

drop trigger if exists post_comments_validate_parent on public.post_comments;

create trigger post_comments_validate_parent
  before insert on public.post_comments
  for each row
  execute function public.post_comments_validate_parent();
