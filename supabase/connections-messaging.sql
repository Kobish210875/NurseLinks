-- Connections polish + direct messages (run after schema.sql)

create extension if not exists pg_trgm;

-- Allow cancel/reject on pending requests
drop policy if exists "Users can delete pending connections they are part of" on public.connections;
create policy "Users can delete pending connections they are part of"
  on public.connections for delete
  to authenticated
  using (
    status = 'pending'
    and auth.uid() in (requester_id, addressee_id)
  );

-- Shared helper: are two users connected?
create or replace function public.users_are_connected(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.connections c
    where c.status = 'accepted'
      and (
        (c.requester_id = user_a and c.addressee_id = user_b)
        or (c.requester_id = user_b and c.addressee_id = user_a)
      )
  );
$$;

grant execute on function public.users_are_connected(uuid, uuid) to authenticated;

-- Direct messages between connected users only
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint direct_messages_no_self check (sender_id <> recipient_id),
  constraint direct_messages_body_len check (char_length(body) <= 4000)
);

create index if not exists direct_messages_recipient_created_idx
  on public.direct_messages (recipient_id, created_at desc);

create index if not exists direct_messages_sender_created_idx
  on public.direct_messages (sender_id, created_at desc);

create index if not exists direct_messages_pair_created_idx
  on public.direct_messages (
    least(sender_id, recipient_id),
    greatest(sender_id, recipient_id),
    created_at desc
  );

alter table public.direct_messages enable row level security;

drop policy if exists "Users read their own messages" on public.direct_messages;
create policy "Users read their own messages"
  on public.direct_messages for select
  to authenticated
  using (auth.uid() in (sender_id, recipient_id));

drop policy if exists "Connected users can send messages" on public.direct_messages;
create policy "Connected users can send messages"
  on public.direct_messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1
      from public.connections c
      where c.status = 'accepted'
        and (
          (c.requester_id = auth.uid() and c.addressee_id = recipient_id)
          or (c.requester_id = recipient_id and c.addressee_id = auth.uid())
        )
    )
  );

grant select, insert, update on public.direct_messages to authenticated;

drop policy if exists "Recipients can mark messages read" on public.direct_messages;
create policy "Recipients can mark messages read"
  on public.direct_messages for update
  to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- Faster name search (Hebrew + English names in full_name)
create index if not exists profiles_full_name_trgm_idx
  on public.profiles using gin (full_name gin_trgm_ops);

-- Requires: create extension if not exists pg_trgm; (run once per database)
-- If pg_trgm is unavailable, skip the index above and rely on ilike.
