import { getAppEnvironment, isProductionApp } from "@/lib/env/app-environment";

export type BackupEnvironment = "dev" | "prod";

/** Which environment manual backups may target from this deployment. */
export function getAllowedBackupEnvironments(): BackupEnvironment[] {
  return isProductionApp() ? ["prod"] : ["dev"];
}

export function getBackupEnvironmentForApp(): BackupEnvironment {
  return isProductionApp() ? "prod" : "dev";
}

export function assertBackupEnvironmentAllowed(requested: string): BackupEnvironment {
  const allowed = getBackupEnvironmentForApp();
  const normalized: BackupEnvironment = requested === "prod" ? "prod" : "dev";

  if (normalized !== allowed) {
    const appEnv = getAppEnvironment();
    throw new Error(
      appEnv === "production"
        ? "Production site can only trigger prod backups."
        : "Dev and Preview sites can only trigger dev backups.",
    );
  }

  return normalized;
}
