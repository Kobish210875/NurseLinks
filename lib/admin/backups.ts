import type { BackupEnvironment } from "@/lib/admin/backup-environment";
import { isProductionApp } from "@/lib/env/app-environment";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type BackupLogRow = {
  id: string;
  backup_type: "snapshot" | "full" | "incremental";
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
  "id,backup_type,environment,status,started_at,completed_at,file_path,file_size_bytes,tables_dumped,triggered_by,error_message,github_run_url";

function createBackupProjectClient(environment: BackupEnvironment) {
  if (environment === "prod" || !isProductionApp()) {
    return createAdminClient();
  }

  const url = process.env.SUPABASE_DEV_URL;
  const serviceRoleKey = process.env.SUPABASE_DEV_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function backupEnvironmentFromPath(filePath: string): BackupEnvironment | null {
  if (filePath.startsWith("prod/")) return "prod";
  if (filePath.startsWith("dev/")) return "dev";
  return null;
}

async function fetchBackupLogsForEnvironment(environment: BackupEnvironment) {
  const admin = createBackupProjectClient(environment);
  if (!admin) {
    return { logs: [] as BackupLogRow[], error: environment === "prod" ? "missing-service-role" : null };
  }

  const { data, error } = await admin
    .from("backup_logs")
    .select(BACKUP_LOG_COLUMNS)
    .eq("environment", environment)
    .order("started_at", { ascending: false })
    .limit(100)
    .returns<BackupLogRow[]>();

  if (error) {
    return { logs: [] as BackupLogRow[], error: "load-failed" };
  }

  return { logs: data ?? [], error: null };
}

export async function getBackupLogs(): Promise<{
  logs: BackupLogRow[];
  error: string | null;
}> {
  const environments: BackupEnvironment[] = isProductionApp() ? ["prod", "dev"] : ["dev"];
  let error: string | null = null;
  const merged: BackupLogRow[] = [];

  for (const environment of environments) {
    const result = await fetchBackupLogsForEnvironment(environment);
    merged.push(...result.logs);
    if (result.error && !error) {
      error = result.error;
    }
  }

  merged.sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
  );

  return { logs: merged.slice(0, 100), error: merged.length > 0 ? null : error };
}

export async function getBackupDownloadUrl(
  filePath: string,
): Promise<{ url: string | null; error: string | null }> {
  const environment = backupEnvironmentFromPath(filePath);
  if (!environment) {
    return { url: null, error: "invalid-path" };
  }

  const admin = createBackupProjectClient(environment);
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
