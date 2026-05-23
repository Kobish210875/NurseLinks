-- One-time: remove legacy filled jobs (run after switching to delete-on-filled)
delete from public.jobs where status = 'filled';
