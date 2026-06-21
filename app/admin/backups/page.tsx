import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { requireAdmin } from "@/lib/auth/admin";
import { getBackupEnvironmentForApp } from "@/lib/admin/backup-environment";
import { getBackupLogs, type BackupLogRow } from "@/lib/admin/backups";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";
import {
  BackupDownloadButton,
  BackupRestoreButton,
  BackupTriggerButton,
} from "@/components/admin/BackupActionButtons";

function formatDate(value: string | null, locale: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(start: string, end: string | null): string {
  if (!end) return "—";
  const seconds = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: BackupLogRow["status"] }) {
  const colors: Record<BackupLogRow["status"], string> = {
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    running: "bg-blue-100 text-blue-700",
    pending: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${colors[status]}`}>
      {status}
    </span>
  );
}

export default async function AdminBackupsPage() {
  await requireAdmin();
  const locale = await getLocale();
  const t = createT(getMessages(locale));
  const { logs, error } = await getBackupLogs();
  const backupEnvironment = getBackupEnvironmentForApp();

  return (
    <div className="home-page-root flex min-h-screen flex-col max-md:block max-md:min-h-0">
      <Navbar authenticated />
      <main className="home-main-shell feed-page min-h-0 w-full min-w-0 max-w-[100vw] flex-1 overflow-hidden py-4 max-md:block max-md:flex-none max-md:overflow-x-clip max-md:py-8 max-md:pb-[calc(var(--mobile-bottom-nav-offset)+1.75rem)] md:py-6">
        <div className="mx-auto flex h-full w-full min-w-0 max-w-[1128px] flex-col gap-3 overflow-hidden px-4 max-md:block max-md:h-auto max-md:overflow-x-clip max-md:pb-[calc(var(--mobile-bottom-nav-offset)+1.5rem)]">

          {/* Header */}
          <div className="shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {t("admin.badge")}
            </p>
            <h1 className="text-2xl font-bold text-foreground">{t("admin.backupTitle")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("admin.backupSubtitle")}</p>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {t("admin.backupLoadFailed")}
            </p>
          ) : null}

          {/* Trigger card — only the environment matching this deployment */}
          <section className="feed-card shrink-0 p-4">
            <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
                {backupEnvironment === "dev"
                  ? t("admin.backupEnvDev")
                  : t("admin.backupEnvProd")}
              </h2>
              <div className="flex flex-wrap gap-2">
                <BackupTriggerButton backupType="full" environment={backupEnvironment} />
                <BackupTriggerButton
                  backupType="incremental"
                  environment={backupEnvironment}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {backupEnvironment === "dev"
                  ? t("admin.backupTriggerHintDev")
                  : t("admin.backupTriggerHintProd")}
              </p>
            </div>
          </section>

          {/* History table */}
          <section className="feed-card flex min-h-0 flex-1 flex-col overflow-hidden lg:min-h-[min(24rem,50vh)] max-md:flex-none max-md:overflow-visible">
            <div className="border-b border-border bg-muted/20 px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">{t("admin.backupHistoryTitle")}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("admin.backupHistoryHint")}
                </p>
              </div>
              <form>
                <button
                  type="submit"
                  formAction=""
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/40"
                >
                  {t("admin.backupRefresh")}
                </button>
              </form>
            </div>

            <div className="min-h-0 flex-1 overflow-auto max-md:overflow-x-auto max-md:overflow-y-visible" dir="ltr">
              <table className="w-full min-w-[900px] text-sm" dir="ltr">
                <thead className="sticky top-0 z-10 bg-muted text-xs font-semibold text-muted-foreground shadow-sm">
                  <tr>
                    <th className="px-4 py-3 text-left">{t("admin.backupColType")}</th>
                    <th className="px-4 py-3 text-left">{t("admin.backupColEnv")}</th>
                    <th className="px-4 py-3 text-left">{t("admin.backupColStatus")}</th>
                    <th className="px-4 py-3 text-left">{t("admin.backupColStarted")}</th>
                    <th className="px-4 py-3 text-left">{t("admin.backupColDuration")}</th>
                    <th className="px-4 py-3 text-left">{t("admin.backupColSize")}</th>
                    <th className="px-4 py-3 text-left">{t("admin.backupColActions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => (
                    <tr key={log.id} className="align-middle">
                      <td className="px-4 py-2.5 font-medium capitalize">{log.backup_type}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            log.environment === "prod"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {log.environment.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={log.status} />
                        {log.error_message ? (
                          <p
                            className="mt-1 max-w-[220px] truncate text-xs text-red-600"
                            title={log.error_message}
                          >
                            {log.error_message}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                        {formatDate(log.started_at, locale)}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                        {formatDuration(log.started_at, log.completed_at)}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                        {formatBytes(log.file_size_bytes)}
                        {log.tables_dumped != null ? (
                          <span className="ml-1 text-xs">({log.tables_dumped} tables)</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-2">
                          {log.status === "completed" && log.file_path ? (
                            <>
                              <BackupDownloadButton filePath={log.file_path} />
                              <BackupRestoreButton
                                filePath={log.file_path}
                                environment={log.environment}
                                logId={log.id}
                              />
                            </>
                          ) : null}
                          {log.github_run_url ? (
                            <a
                              href={log.github_run_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/40"
                            >
                              {t("admin.backupViewRun")}
                            </a>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && !error ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        {t("admin.backupEmpty")}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mobile-feed-bottom-spacer md:hidden" aria-hidden="true" />
        </div>
      </main>
      <div className="lg:hidden">
        <Footer />
      </div>
    </div>
  );
}
