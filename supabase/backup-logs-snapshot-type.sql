-- Run on DEV + PROD after deploying snapshot backup merge.
-- Allows backup_type = 'snapshot' while keeping legacy full/incremental rows.

alter table public.backup_logs
  drop constraint if exists backup_logs_backup_type_check;

alter table public.backup_logs
  add constraint backup_logs_backup_type_check
  check (backup_type in ('snapshot', 'full', 'incremental'));
