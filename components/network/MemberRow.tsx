"use client";

import Link from "next/link";
import {
  acceptConnectionRequest,
  cancelConnectionRequest,
  rejectConnectionRequest,
  sendConnectionRequest,
} from "@/app/actions/connections";
import { useT } from "@/components/i18n/LocaleProvider";
import type { ConnectionStatus, NetworkMember } from "@/lib/network/types";
import { formatProfileHeadline } from "@/lib/profile/display-professional";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type MemberRowProps = {
  member: NetworkMember & { mutualCount?: number };
  variant?: "connection" | "search" | "invitation" | "recommendation";
};

const actionBtn =
  "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-tight transition disabled:opacity-60 sm:text-xs";

const msgBtn =
  "shrink-0 rounded-full border border-primary px-2 py-0.5 text-[11px] font-medium leading-tight text-primary transition hover:bg-primary/5 sm:text-xs";

export default function MemberRow({ member, variant = "connection" }: MemberRowProps) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState<ConnectionStatus>(member.connectionStatus);

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
      router.refresh();
    });
  }

  const messageHref =
    optimisticStatus === "connected" ? `/messages/${member.id}` : undefined;
  const professionalLine = formatProfileHeadline(
    member.headline,
    member.workplaceInstitutionSlug,
    t("profile.institutionOther"),
  );

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
            {member.mutualCount ? (
              <p className="truncate text-[11px] text-primary sm:text-xs">
                {t("network.mutualConnections").replace("{count}", String(member.mutualCount))}
              </p>
            ) : null}
          </div>

          <div className="flex max-w-[42%] shrink-0 flex-wrap items-center justify-end gap-1">
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

            {variant === "search" || variant === "recommendation" ? (
              <>
                {optimisticStatus === "none" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => sendConnectionRequest(member.id), "pending_out")}
                    className={`${actionBtn} border-primary text-primary hover:bg-primary/5`}
                  >
                    {t("network.connect")}
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
                {optimisticStatus === "connected" && messageHref ? (
                  <Link href={messageHref} className={msgBtn}>
                    {t("network.message")}
                  </Link>
                ) : null}
              </>
            ) : null}

            {variant === "connection" && messageHref ? (
              <Link href={messageHref} className={msgBtn}>
                {t("network.message")}
              </Link>
            ) : null}
          </div>
        </div>
      </article>
    </li>
  );
}
