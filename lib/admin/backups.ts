import { createAdminClient } from "@/lib/supabase/admin";

export type BackupLogRow = {
  id: string;
  backup_type: "full" | "incremental";
  environment: "dev" | "prod";
  status: "pending" | "running" | "completed" | "failed";
  started_at: string;
  completed_at: string | null;
  file_path: string | null;
  file_size_bytes: number | null;
  tables_dumped: number | null;
  triggered_by: "schedule" | "manual";
  error_message: string | null;
  github_run_url: string | null;
};

export async function getBackupLogs(): Promise<{
  logs: BackupLogRow[];
  error: string | null;
}> {
  const admin = createAdminClient();
  if (!admin) {
    return { logs: [], error: "missing-service-role" };
  }

  const { data, error } = await admin
    .from("backup_logs")
    .select(
      "id,backup_type,environment,status,started_at,completed_at,file_path,file_size_bytes,tables_dumped,triggered_by,error_message,github_run_url",
    )
    .order("started_at", { ascending: false })
    .limit(100)
    .returns<BackupLogRow[]>();

  if (error) {
    return { logs: [], error: "load-failed" };
  }

  return { logs: data ?? [], error: null };
}

export async function getBackupDownloadUrl(
  filePath: string,
): Promise<{ url: string | null; error: string | null }> {
  const admin = createAdminClient();
  if (!admin) {
    return { url: null, error: "missing-service-role" };
  }

  const { data, error } = await admin.storage
    .from("backups")
    .createSignedUrl(filePath, 300);

  if (error || !data?.signedUrl) {
    return { url: null, error: "signed-url-failed" };
  }

  return { url: data.signedUrl, error: null };
}
