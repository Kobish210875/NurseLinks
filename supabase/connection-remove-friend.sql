-- Allow either party to remove an accepted connection (unfriend).
-- Run in Supabase SQL Editor if removing friends returns a permission error.
-- Safe to run after connections-messaging.sql or account-deletion-and-recommendations.sql.

drop policy if exists "Users can delete pending connections they are part of" on public.connections;
drop policy if exists "Users can delete connections they are part of" on public.connections;

create policy "Users can delete connections they are part of"
  on public.connections for delete
  to authenticated
  using (auth.uid() in (requester_id, addressee_id));
