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
import { notifyConnectionsChanged } from "@/lib/client/sync-events";
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
    // Sync when server-provided relation status changes after navigation/revalidation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      notifyConnectionsChanged();
    });
  }

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
    <li className="min-w-0">
      <article className="feed-card min-w-0 overflow-hidden transition hover:border-primary/25">
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
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm(t("network.removeFriendConfirm"))) {
                      return;
                    }
                    run(() => removeConnection(member.id), "none");
                  }}
                  className={`${actionBtn} border-border text-muted-foreground hover:bg-muted/60`}
                >
                  {t("network.removeFriend")}
                </button>
              </>
            ) : null}

            {variant === "recommendation" ? (
              <>
                {optimisticStatus === "none" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => sendConnectionRequest(member.id), "pending_out")}
                    className={`${actionBtn} border-primary bg-primary text-primary-foreground hover:bg-primary/90`}
                  >
                    {t("network.accept")}
                  </button>
                ) : null}
                {optimisticStatus === "pending_out" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => cancelConnectionRequest(member.id), "none")}
                    className={`${actionBtn} border-border text-muted-foreground hover:border-red-200 hover:bg-red-50 hover:text-red-700`}
                  >
                    {t("network.cancelRequest")}
                  </button>
                ) : null}
                {optimisticStatus === "pending_in" ? (
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
                {optimisticStatus === "none" ? (
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
                    className={`${actionBtn} border-border text-muted-foreground hover:bg-muted/60`}
                  >
                    {t("network.ignore")}
                  </button>
                ) : null}
              </>
            ) : null}

            {variant === "search" ? (
              <>
                {optimisticStatus === "none" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => sendConnectionRequest(member.id), "pending_out")}
                    className={`${actionBtn} border-primary bg-primary text-primary-foreground hover:bg-primary/90`}
                  >
                    {t("network.connect")}
                  </button>
                ) : null}
                {optimisticStatus === "pending_out" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => cancelConnectionRequest(member.id), "none")}
                    className={`${actionBtn} border-border text-muted-foreground hover:border-red-200 hover:bg-red-50 hover:text-red-700`}
                  >
                    {t("network.cancelRequest")}
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
