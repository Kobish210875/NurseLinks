-- Allow any authenticated user to send a direct message (not only connected friends).
-- Run in Supabase SQL Editor if messages fail with RLS / "לא ניתן לשלוח את ההודעה".

drop policy if exists "Connected users can send messages" on public.direct_messages;

create policy "Authenticated users can send messages"
  on public.direct_messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and sender_id <> recipient_id
  );

grant insert on public.direct_messages to authenticated;
