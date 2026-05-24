"use client";

import Link from "next/link";
import {
  acceptConnectionRequest,
  cancelConnectionRequest,
  rejectConnectionRequest,
  sendConnectionRequest,
} from "@/app/actions/connections";
import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import { formatFeedTimestamp } from "@/lib/i18n/format-feed-time";
import type { NetworkMember } from "@/lib/network/types";
import { formatProfileHeadline } from "@/lib/profile/display-professional";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type MemberRowProps = {
  member: NetworkMember;
  variant?: "connection" | "search" | "invitation";
};

export default function MemberRow({ member, variant = "connection" }: MemberRowProps) {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<unknown>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  const messageHref =
    member.connectionStatus === "connected" ? `/messages/${member.id}` : undefined;
  const professionalLine = formatProfileHeadline(
    member.headline,
    member.workplaceInstitutionSlug,
    t("profile.institutionOther"),
  );

  return (
    <li className="network-member-row flex items-center gap-2.5 rounded-xl border border-border bg-white px-3 py-2.5 shadow-sm transition hover:border-primary/30 hover:shadow-md md:items-center md:gap-3 md:px-3.5 md:py-3">
      <span className="relative flex size-10 shrink-0 overflow-hidden rounded-full border border-border bg-primary/10 md:size-11">
        {member.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-[10px] font-semibold text-primary md:text-sm">
            {member.initials}
          </span>
        )}
      </span>

      <div className="min-w-0 flex-1 text-start">
        <Link
          href={`/profile/${member.id}`}
          className="text-sm font-semibold text-foreground hover:text-primary hover:underline"
        >
          {member.fullName}
        </Link>
        {professionalLine ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {professionalLine}
          </p>
        ) : null}
        {variant === "connection" && member.connectedAt ? (
          <p className="mt-0.5 text-[10px] text-muted-foreground md:mt-1 md:text-xs">
            <time dateTime={member.connectedAt}>
              {t("network.connectedOn")}{" "}
              {formatFeedTimestamp(member.connectedAt, locale)}
            </time>
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 md:gap-2">
        {variant === "invitation" ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(() => acceptConnectionRequest(member.id))
              }
              className="rounded-full border border-primary bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60 md:px-4 md:py-1.5 md:text-sm"
            >
              {t("network.accept")}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(() => rejectConnectionRequest(member.id))
              }
              className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-60 md:px-4 md:py-1.5 md:text-sm"
            >
              {t("network.ignore")}
            </button>
          </>
        ) : null}

        {variant === "search" ? (
          <>
            {member.connectionStatus === "none" ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => sendConnectionRequest(member.id))}
                className="rounded-full border border-primary px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary/5 disabled:opacity-60 md:px-4 md:py-1.5 md:text-sm"
              >
                {t("network.connect")}
              </button>
            ) : null}
            {member.connectionStatus === "pending_out" ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => cancelConnectionRequest(member.id))}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground disabled:opacity-60 md:px-4 md:py-1.5 md:text-sm"
              >
                {t("network.pending")}
              </button>
            ) : null}
            {member.connectionStatus === "pending_in" ? (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => acceptConnectionRequest(member.id))}
                  className="rounded-full border border-primary bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground disabled:opacity-60 md:px-3 md:py-1.5 md:text-sm"
                >
                  {t("network.accept")}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => rejectConnectionRequest(member.id))}
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground disabled:opacity-60 md:px-3 md:py-1.5 md:text-sm"
                >
                  {t("network.ignore")}
                </button>
              </>
            ) : null}
            {member.connectionStatus === "connected" && messageHref ? (
              <Link
                href={messageHref}
                className="rounded-full border border-primary px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary/5 md:px-4 md:py-1.5 md:text-sm"
              >
                {t("network.message")}
              </Link>
            ) : null}
          </>
        ) : null}

        {variant === "connection" && messageHref ? (
          <Link
            href={messageHref}
            className="rounded-full border border-primary bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10 md:px-3.5 md:py-1.5 md:text-sm"
          >
            {t("network.message")}
          </Link>
        ) : null}
      </div>
    </li>
  );
}
