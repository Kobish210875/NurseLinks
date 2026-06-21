-- One-time fix: rows left as "running" after a successful GitHub backup.
-- Safe to run on DEV or PROD when the Actions run shows completed but UI still says running.

update public.backup_logs
set
  status = 'completed',
  completed_at = coalesce(completed_at, started_at + interval '1 minute')
where status = 'running'
  and github_run_url is not null;
