"use client";

import Link from "next/link";
import {
  acceptConnectionRequest,
  cancelConnectionRequest,
  dismissConnectionRecommendation,
  rejectConnectionRequest,
  removeConnection,
  sendConnectionRequest,
} from "@/app/actions/connections";
import { useT } from "@/components/i18n/LocaleProvider";
import type {
  ConnectionStatus,
  NetworkMember,
  NetworkProfileSummary,
  RecommendationSource,
} from "@/lib/network/types";
import {
  formatProfileHeadline,
  getInstitutionLabel,
} from "@/lib/profile/display-professional";
import { useEffect, useState, useTransition } from "react";

type MemberRowProps = {
  member: NetworkMember & {
    mutualCount?: number;
    mutualConnections?: NetworkProfileSummary[];
    recommendationSource?: RecommendationSource;
    institutionSlug?: string | null;
  };
  variant?: "connection" | "search" | "invitation" | "recommendation";
  onDismissRecommendation?: (memberId: string) => void;
};

const actionBtn =
  "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-tight transition disabled:opacity-60 sm:text-xs";

const iconActionBtn =
  "inline-flex size-7 items-center justify-center rounded-full border transition disabled:opacity-60 sm:size-8";
const primaryIconBtn = `${iconActionBtn} border-primary text-primary hover:bg-primary/5`;
const dangerIconBtn = `${iconActionBtn} border-red-200 text-red-600 hover:bg-red-50`;

function IconPlus() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="size-3.5"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function IconX() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="size-3.5"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function IconMessage() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="size-3.5"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function MemberRow({
  member,
  variant = "connection",
  onDismissRecommendation,
}: MemberRowProps) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState<ConnectionStatus>(member.connectionStatus);
  const [showMutualConnections, setShowMutualConnections] = useState(false);

  useEffect(() => {
    setOptimisticStatus(member.connectionStatus);
  }, [member.connectionStatus]);

  function hasActionError(result: unknown): result is { error: string } {
    return Boolean(result && typeof result === "object" && "error" in result);
  }

  function run(action: () => Promise<unknown>, nextStatus: ConnectionStatus) {
    const previous = optimisticStatus;
    setOptimisticStatus(nextStatus);
    startTransition(async () => {
      const result = await action();
      if (hasActionError(result)) {
        setOptimisticStatus(previous);
        return;
      }
    });
  }

  const messageHref = `/messages/${member.id}`;
  const professionalLine = formatProfileHeadline(
    member.headline,
    member.workplaceInstitutionSlug,
    t("profile.institutionOther"),
  );
  const workplaceInstitutionLabel =
    member.institutionSlug &&
    (member.recommendationSource === "workplace" || member.recommendationSource === "both")
      ? getInstitutionLabel(member.institutionSlug, t("profile.institutionOther"))
      : null;

  return (
    <li>
      <article className="feed-card overflow-hidden transition hover:border-primary/25">
        <div className="flex items-center gap-2 p-2 sm:gap-2.5 sm:p-2.5">
          <Link
            href={`/profile/${member.id}`}
            className="relative flex size-7 shrink-0 overflow-hidden rounded-full border border-border bg-primary/10 sm:size-8"
          >
            {member.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-[9px] font-semibold text-primary sm:text-[10px]">
                {member.initials}
              </span>
            )}
          </Link>

          <div className="min-w-0 flex-1 text-start">
            <Link
              href={`/profile/${member.id}`}
              className="block truncate text-xs font-semibold text-foreground hover:text-primary hover:underline sm:text-sm"
            >
              {member.fullName}
            </Link>
            {professionalLine ? (
              <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
                {professionalLine}
              </p>
            ) : null}
            {workplaceInstitutionLabel ? (
              <p className="truncate text-[11px] font-medium text-primary sm:text-xs">
                {t("network.sameWorkplace").replace("{institution}", workplaceInstitutionLabel)}
              </p>
            ) : null}
            {member.mutualCount && member.mutualConnections?.length ? (
              <button
                type="button"
                onClick={() => setShowMutualConnections(true)}
                className="block truncate text-start text-[11px] font-medium text-primary hover:underline sm:text-xs"
              >
                {t("network.mutualConnections").replace("{count}", String(member.mutualCount))}
              </button>
            ) : null}
          </div>

          <div className="flex max-w-[42%] shrink-0 flex-wrap items-center justify-end gap-1.5">
            {variant === "invitation" ? (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => acceptConnectionRequest(member.id), "connected")}
                  className={`${actionBtn} border-primary bg-primary text-primary-foreground hover:bg-primary/90`}
                >
                  {t("network.accept")}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => rejectConnectionRequest(member.id), "none")}
                  className={`${actionBtn} border-border text-muted-foreground hover:bg-muted/60`}
                >
                  {t("network.ignore")}
                </button>
              </>
            ) : null}

            {variant === "connection" ? (
              <>
                <Link
                  href={messageHref}
                  className={primaryIconBtn}
                  aria-label={t("network.message")}
                  title={t("network.message")}
                >
                  <IconMessage />
                  <span className="sr-only">{t("network.message")}</span>
                </Link>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm(t("network.removeFriendConfirm"))) {
                      return;
                    }
                    run(() => removeConnection(member.id), "none");
                  }}
                  className={dangerIconBtn}
                  aria-label={t("network.removeFriend")}
                  title={t("network.removeFriend")}
                >
                  <IconX />
                  <span className="sr-only">{t("network.removeFriend")}</span>
                </button>
              </>
            ) : null}

            {variant === "recommendation" ? (
              <div className="flex w-full items-center justify-between gap-3 [direction:ltr]">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (onDismissRecommendation) {
                      onDismissRecommendation(member.id);
                      return;
                    }
                    run(() => dismissConnectionRecommendation(member.id), optimisticStatus);
                  }}
                  className={dangerIconBtn}
                  aria-label={t("network.dismissRecommendation")}
                  title={t("network.dismissRecommendation")}
                >
                  <IconX />
                  <span className="sr-only">{t("network.dismissRecommendation")}</span>
                </button>
                <div className="flex items-center gap-1.5 ps-2">
                  {optimisticStatus === "none" ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => sendConnectionRequest(member.id), "pending_out")}
                      className={primaryIconBtn}
                      aria-label={t("network.connect")}
                      title={t("network.connect")}
                    >
                      <IconPlus />
                      <span className="sr-only">{t("network.connect")}</span>
                    </button>
                  ) : null}
                  {optimisticStatus === "pending_out" ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => cancelConnectionRequest(member.id), "none")}
                      className={`${actionBtn} border-border text-muted-foreground`}
                    >
                      {t("network.pending")}
                    </button>
                  ) : null}
                  {optimisticStatus === "pending_in" ? (
                    <>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => run(() => acceptConnectionRequest(member.id), "connected")}
                        className={`${actionBtn} border-primary bg-primary text-primary-foreground`}
                      >
                        {t("network.accept")}
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => run(() => rejectConnectionRequest(member.id), "none")}
                        className={`${actionBtn} border-border text-muted-foreground`}
                      >
                        {t("network.ignore")}
                      </button>
                    </>
                  ) : null}
                  <Link
                    href={messageHref}
                    className={primaryIconBtn}
                    aria-label={t("network.message")}
                    title={t("network.message")}
                  >
                    <IconMessage />
                    <span className="sr-only">{t("network.message")}</span>
                  </Link>
                </div>
              </div>
            ) : null}

            {variant === "search" ? (
              <>
                {optimisticStatus === "none" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => sendConnectionRequest(member.id), "pending_out")}
                    className={primaryIconBtn}
                    aria-label={t("network.connect")}
                    title={t("network.connect")}
                  >
                    <IconPlus />
                    <span className="sr-only">{t("network.connect")}</span>
                  </button>
                ) : null}
                {optimisticStatus === "pending_out" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => cancelConnectionRequest(member.id), "none")}
                    className={`${actionBtn} border-border text-muted-foreground`}
                  >
                    {t("network.pending")}
                  </button>
                ) : null}
                {optimisticStatus === "pending_in" ? (
                  <>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => acceptConnectionRequest(member.id), "connected")}
                      className={`${actionBtn} border-primary bg-primary text-primary-foreground`}
                    >
                      {t("network.accept")}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => rejectConnectionRequest(member.id), "none")}
                      className={`${actionBtn} border-border text-muted-foreground`}
                    >
                      {t("network.ignore")}
                    </button>
                  </>
                ) : null}
                <Link
                  href={messageHref}
                  className={primaryIconBtn}
                  aria-label={t("network.message")}
                  title={t("network.message")}
                >
                  <IconMessage />
                  <span className="sr-only">{t("network.message")}</span>
                </Link>
              </>
            ) : null}
          </div>
        </div>
        {showMutualConnections && member.mutualConnections?.length ? (
          <div className="border-t border-border bg-muted/15 px-3 py-2 text-start">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-foreground">
                {t("network.mutualConnectionsTitle")}
              </p>
              <button
                type="button"
                onClick={() => setShowMutualConnections(false)}
                className="text-xs font-medium text-primary hover:underline"
              >
                {t("network.back")}
              </button>
            </div>
            <ul className="space-y-1.5">
              {member.mutualConnections.map((mutual) => (
                <li key={mutual.id}>
                  <Link
                    href={`/profile/${mutual.id}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-white"
                  >
                    <span className="flex size-7 shrink-0 overflow-hidden rounded-full border border-border bg-primary/10">
                      {mutual.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mutual.avatarUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <span className="flex size-full items-center justify-center text-[9px] font-semibold text-primary">
                          {mutual.initials}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 truncate text-xs font-medium text-foreground">
                      {mutual.fullName}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>
    </li>
  );
}
