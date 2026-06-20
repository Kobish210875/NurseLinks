"use client";

import { useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";

type BackupEnv = "dev" | "prod";
type BackupType = "full" | "incremental";

export function BackupTriggerButton({
  backupType,
  environment,
}: {
  backupType: BackupType;
  environment: BackupEnv;
}) {
  const t = useT();
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleClick() {
    if (state === "loading") return;
    const label =
      backupType === "full"
        ? t("admin.backupTypeFull")
        : t("admin.backupTypeIncremental");
    if (
      !window.confirm(
        t("admin.backupTriggerConfirm")
          .replace("{type}", label)
          .replace("{env}", environment.toUpperCase()),
      )
    ) {
      return;
    }

    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/backup/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: backupType, environment }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setErrorMsg(data.error ?? t("admin.backupTriggerFailed"));
        setState("error");
        return;
      }
      setState("ok");
      setTimeout(() => setState("idle"), 5000);
    } catch {
      setErrorMsg(t("admin.backupTriggerFailed"));
      setState("error");
    }
  }

  const isLoading = state === "loading";
  const isOk = state === "ok";

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
          backupType === "full"
            ? "border-amber-300 text-amber-700 hover:bg-amber-50"
            : "border-primary/30 text-primary hover:bg-primary/5"
        }`}
      >
        {isLoading
          ? t("admin.backupTriggering")
          : isOk
            ? t("admin.backupTriggered")
            : backupType === "full"
              ? t("admin.backupRunFull")
              : t("admin.backupRunIncremental")}
      </button>
      {state === "error" && errorMsg ? (
        <p className="text-xs text-red-600">{errorMsg}</p>
      ) : null}
    </div>
  );
}

export function BackupDownloadButton({ filePath }: { filePath: string }) {
  const t = useT();
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/backup/download?path=${encodeURIComponent(filePath)}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="rounded-lg border border-green-300 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50 disabled:opacity-60"
    >
      {loading ? "…" : t("admin.backupDownload")}
    </button>
  );
}

export function BackupRestoreButton({
  filePath,
  environment,
  logId,
}: {
  filePath: string;
  environment: string;
  logId: string;
}) {
  const t = useT();
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleRestore() {
    if (state === "loading") return;
    const confirmMsg = t("admin.backupRestoreConfirm")
      .replace("{file}", filePath)
      .replace("{env}", environment.toUpperCase());
    if (!window.confirm(confirmMsg)) return;

    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          environment,
          backup_file_path: filePath,
          backup_log_id: logId,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setErrorMsg(data.error ?? t("admin.backupRestoreFailed"));
        setState("error");
        return;
      }
      setState("ok");
    } catch {
      setErrorMsg(t("admin.backupRestoreFailed"));
      setState("error");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleRestore}
        disabled={state === "loading" || state === "ok"}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
      >
        {state === "loading"
          ? t("admin.backupRestoring")
          : state === "ok"
            ? t("admin.backupRestoreTriggered")
            : t("admin.backupRestore")}
      </button>
      {state === "error" && errorMsg ? (
        <p className="max-w-[180px] text-xs text-red-600">{errorMsg}</p>
      ) : null}
    </div>
  );
}
