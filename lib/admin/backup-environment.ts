import { getAppEnvironment, isProductionApp } from "@/lib/env/app-environment";

export type BackupEnvironment = "dev" | "prod";

const BACKUP_ENVIRONMENTS: BackupEnvironment[] = ["dev", "prod"];

/** Which environments manual backups may target from this deployment. */
export function getAllowedBackupEnvironments(): BackupEnvironment[] {
  return isProductionApp() ? BACKUP_ENVIRONMENTS : ["dev"];
}

/** @deprecated Prefer getAllowedBackupEnvironments — kept for single-env callers. */
export function getBackupEnvironmentForApp(): BackupEnvironment {
  return isProductionApp() ? "prod" : "dev";
}

export function assertBackupEnvironmentAllowed(requested: string): BackupEnvironment {
  const allowed = getAllowedBackupEnvironments();
  const normalized: BackupEnvironment = requested === "prod" ? "prod" : "dev";

  if (!allowed.includes(normalized)) {
    const appEnv = getAppEnvironment();
    throw new Error(
      appEnv === "production"
        ? "Invalid backup environment."
        : "Dev and Preview sites can only trigger dev backups.",
    );
  }

  return normalized;
}
