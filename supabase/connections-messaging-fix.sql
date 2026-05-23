-- Run if messages fail with "לא ניתן לשלוח את ההודעה" after connections-messaging.sql

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
