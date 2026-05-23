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
    <li className="flex items-start gap-3 border-b border-border py-4 last:border-b-0">
      <span className="relative flex size-14 shrink-0 overflow-hidden rounded-full border-2 border-border bg-primary/10">
        {member.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-sm font-semibold text-primary">
            {member.initials}
          </span>
        )}
      </span>

      <div className="min-w-0 flex-1 text-start">
        <Link
          href={`/profile/${member.id}`}
          className="font-semibold text-foreground hover:text-primary hover:underline"
        >
          {member.fullName}
        </Link>
        {professionalLine ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{professionalLine}</p>
        ) : null}
        {variant === "connection" && member.connectedAt ? (
          <p className="mt-1 text-xs text-muted-foreground">
            <time dateTime={member.connectedAt}>
              {t("network.connectedOn")}{" "}
              {formatFeedTimestamp(member.connectedAt, locale)}
            </time>
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {variant === "invitation" ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(() => acceptConnectionRequest(member.id))
              }
              className="rounded-full border border-primary bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              {t("network.accept")}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(() => rejectConnectionRequest(member.id))
              }
              className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-60"
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
                className="rounded-full border border-primary px-4 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/5 disabled:opacity-60"
              >
                {t("network.connect")}
              </button>
            ) : null}
            {member.connectionStatus === "pending_out" ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => cancelConnectionRequest(member.id))}
                className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground disabled:opacity-60"
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
                  className="rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
                >
                  {t("network.accept")}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => rejectConnectionRequest(member.id))}
                  className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground disabled:opacity-60"
                >
                  {t("network.ignore")}
                </button>
              </>
            ) : null}
            {member.connectionStatus === "connected" && messageHref ? (
              <Link
                href={messageHref}
                className="rounded-full border border-primary px-4 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/5"
              >
                {t("network.message")}
              </Link>
            ) : null}
          </>
        ) : null}

        {variant === "connection" && messageHref ? (
          <Link
            href={messageHref}
            className="rounded-full border border-primary px-4 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/5"
          >
            {t("network.message")}
          </Link>
        ) : null}
      </div>
    </li>
  );
}
