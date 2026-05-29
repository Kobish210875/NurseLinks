"use client";

import {
  adminDeleteModerationContent,
  adminDismissModerationFlag,
  adminLiftUserSuspension,
  adminSuspendUserFromFlag,
} from "@/app/admin/moderation/actions";
import { useT } from "@/components/i18n/LocaleProvider";
import type { AdminModerationFlag } from "@/lib/admin/moderation";
import Link from "next/link";

type AdminModerationPanelProps = {
  flags: AdminModerationFlag[];
};

function defaultSuspendUntil() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function contentTypeLabel(
  type: AdminModerationFlag["contentType"],
  t: ReturnType<typeof useT>,
) {
  if (type === "post") {
    return t("moderation.typePost");
  }
  if (type === "comment") {
    return t("moderation.typeComment");
  }
  return t("moderation.typeMessage");
}

export default function AdminModerationPanel({ flags }: AdminModerationPanelProps) {
  const t = useT();

  if (flags.length === 0) {
    return (
      <p className="feed-card px-4 py-8 text-center text-sm text-muted-foreground">
        {t("admin.moderationEmpty")}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {flags.map((flag) => (
        <li key={flag.id} className="feed-card space-y-3 p-4 text-start">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {flag.source === "auto"
                  ? t("admin.moderationSourceAuto")
                  : t("admin.moderationSourceReport")}
                {" · "}
                {contentTypeLabel(flag.contentType, t)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("admin.moderationSubject").replace("{name}", flag.subjectName)}
                {flag.reporterName
                  ? ` · ${t("admin.moderationReporter").replace("{name}", flag.reporterName)}`
                  : ""}
              </p>
            </div>
            <time className="shrink-0 text-xs text-muted-foreground">
              {new Date(flag.createdAt).toLocaleString()}
            </time>
          </div>

          <blockquote className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-foreground">
            {flag.bodyExcerpt}
          </blockquote>

          {flag.matchedTerm ? (
            <p className="text-xs text-muted-foreground">
              {t("admin.moderationMatchedTerm").replace("{term}", flag.matchedTerm)}
            </p>
          ) : null}
          {flag.reportNote ? (
            <p className="text-xs text-muted-foreground">
              {t("admin.moderationReportNote").replace("{note}", flag.reportNote)}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            <form action={adminDismissModerationFlag}>
              <input type="hidden" name="flagId" value={flag.id} />
              <button
                type="submit"
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/50"
              >
                {t("admin.moderationDismiss")}
              </button>
            </form>
            <form action={adminDeleteModerationContent}>
              <input type="hidden" name="flagId" value={flag.id} />
              <button
                type="submit"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                {t("admin.moderationDeleteContent")}
              </button>
            </form>
            <Link
              href={`/profile/${flag.subjectUserId}`}
              className="rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5"
            >
              {t("admin.moderationViewProfile")}
            </Link>
          </div>

          <details className="rounded-lg border border-amber-200/80 bg-amber-50/50 px-3 py-2">
            <summary className="cursor-pointer text-xs font-semibold text-amber-900">
              {t("admin.moderationSuspendTitle")}
            </summary>
            <form action={adminSuspendUserFromFlag} className="mt-3 space-y-2">
              <input type="hidden" name="flagId" value={flag.id} />
              <input type="hidden" name="userId" value={flag.subjectUserId} />
              <label className="block text-xs font-medium text-foreground">
                {t("admin.moderationSuspendUntil")}
                <input
                  type="datetime-local"
                  name="suspendedUntil"
                  required
                  defaultValue={defaultSuspendUntil()}
                  className="mt-1 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-foreground">
                {t("admin.moderationSuspendReason")}
                <input
                  type="text"
                  name="reason"
                  maxLength={200}
                  className="mt-1 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                />
              </label>
              <button
                type="submit"
                className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
              >
                {t("admin.moderationSuspendSubmit")}
              </button>
            </form>
            <form action={adminLiftUserSuspension} className="mt-2">
              <input type="hidden" name="userId" value={flag.subjectUserId} />
              <button
                type="submit"
                className="text-xs font-medium text-amber-900 underline hover:no-underline"
              >
                {t("admin.moderationLiftSuspension")}
              </button>
            </form>
          </details>
        </li>
      ))}
    </ul>
  );
}
