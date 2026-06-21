import { getBackupEnvironmentForApp } from "@/lib/admin/backup-environment";
import { createAdminClient } from "@/lib/supabase/admin";

export type BackupLogRow = {
  id: string;
  backup_type: "snapshot" | "full" | "incremental";
  operation?: "backup" | "restore";
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

const BACKUP_LOG_COLUMNS =
  "id,backup_type,operation,environment,status,started_at,completed_at,file_path,file_size_bytes,tables_dumped,triggered_by,error_message,github_run_url";

/** Legacy rows may lack operation or use error_message before the column existed. */
export function getBackupLogOperation(
  log: Pick<BackupLogRow, "operation" | "error_message">,
): "backup" | "restore" {
  if (log.operation === "restore") return "restore";
  if (log.error_message?.startsWith("RESTORE from:")) return "restore";
  return "backup";
}

export async function getBackupLogs(): Promise<{
  logs: BackupLogRow[];
  error: string | null;
}> {
  const admin = createAdminClient();
  if (!admin) {
    return { logs: [], error: "missing-service-role" };
  }

  const environment = getBackupEnvironmentForApp();

  const { data, error } = await admin
    .from("backup_logs")
    .select(BACKUP_LOG_COLUMNS)
    .eq("environment", environment)
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
  const environment = getBackupEnvironmentForApp();
  const expectedPrefix = `${environment}/`;
  if (!filePath.startsWith(expectedPrefix)) {
    return { url: null, error: "invalid-path" };
  }

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
