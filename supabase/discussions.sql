-- Community discussion threads (ענפי שיחה) — run in Supabase SQL Editor on DEV first.

create table if not exists public.discussion_threads (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  is_anonymous boolean not null default false,
  anonymous_label text,
  reply_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_reply_at timestamptz,
  constraint discussion_threads_title_len check (char_length(title) between 1 and 200),
  constraint discussion_threads_body_len check (char_length(body) between 1 and 4000),
  constraint discussion_threads_anonymous_label_len check (
    anonymous_label is null or char_length(anonymous_label) <= 80
  )
);

create index if not exists discussion_threads_last_activity_idx
  on public.discussion_threads (coalesce(last_reply_at, created_at) desc);

create index if not exists discussion_threads_author_idx
  on public.discussion_threads (author_id);

create table if not exists public.discussion_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.discussion_threads (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  is_anonymous boolean not null default false,
  anonymous_label text,
  created_at timestamptz not null default now(),
  constraint discussion_replies_body_len check (char_length(body) between 1 and 4000),
  constraint discussion_replies_anonymous_label_len check (
    anonymous_label is null or char_length(anonymous_label) <= 80
  )
);

create index if not exists discussion_replies_thread_created_idx
  on public.discussion_replies (thread_id, created_at asc);

alter table public.discussion_threads enable row level security;
alter table public.discussion_replies enable row level security;

create policy "Discussion threads are readable by authenticated users"
  on public.discussion_threads for select
  to authenticated
  using (true);

create policy "Users can create discussion threads as themselves"
  on public.discussion_threads for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "Authors can delete their discussion threads"
  on public.discussion_threads for delete
  to authenticated
  using (auth.uid() = author_id);

create policy "Discussion replies are readable by authenticated users"
  on public.discussion_replies for select
  to authenticated
  using (true);

create policy "Users can reply as themselves"
  on public.discussion_replies for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "Authors can delete their discussion replies"
  on public.discussion_replies for delete
  to authenticated
  using (auth.uid() = author_id);

create or replace function public.discussion_on_reply_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.discussion_threads
  set
    reply_count = reply_count + 1,
    last_reply_at = new.created_at,
    updated_at = new.created_at
  where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists discussion_replies_after_insert on public.discussion_replies;
create trigger discussion_replies_after_insert
  after insert on public.discussion_replies
  for each row
  execute function public.discussion_on_reply_insert();

-- Extend moderation content types (safe if constraint name differs — adjust in SQL editor if needed)
alter table public.moderation_flags
  drop constraint if exists moderation_flags_content_type_check;

alter table public.moderation_flags
  add constraint moderation_flags_content_type_check
  check (content_type in ('post', 'comment', 'message', 'discussion', 'discussion_reply'));
