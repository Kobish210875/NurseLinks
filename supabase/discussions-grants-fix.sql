-- Run this in DEV if you already ran discussions.sql before GRANT lines were added.

grant select, insert, delete on public.discussion_threads to authenticated;
grant select, insert, delete on public.discussion_replies to authenticated;
grant select, insert, update, delete on public.discussion_threads to service_role;
grant select, insert, update, delete on public.discussion_replies to service_role;

notify pgrst, 'reload schema';
