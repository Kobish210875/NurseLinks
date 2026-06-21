-- Run on DEV + PROD. Distinguishes backup vs restore rows in admin history.
alter table public.backup_logs
  add column if not exists operation text not null default 'backup'
  check (operation in ('backup', 'restore'));

create index if not exists backup_logs_operation_idx
  on public.backup_logs (operation, started_at desc);
