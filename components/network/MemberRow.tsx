"use client";

import Link from "next/link";
import {
  acceptConnectionRequest,
  cancelConnectionRequest,
  rejectConnectionRequest,
  sendConnectionRequest,
} from "@/app/actions/connections";
import { useT } from "@/components/i18n/LocaleProvider";
import type { NetworkMember } from "@/lib/network/types";
import { formatProfileHeadline } from "@/lib/profile/display-professional";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type MemberRowProps = {
  member: NetworkMember;
  variant?: "connection" | "search" | "invitation";
};

const actionBtn =
  "rounded-full border px-2.5 py-0.5 text-xs font-medium transition disabled:opacity-60 md:px-3 md:py-1 md:text-xs";

export default function MemberRow({ member, variant = "connection" }: MemberRowProps) {
  const t = useT();
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
    <li className="network-member-row flex items-center gap-2 rounded-lg border border-border/80 bg-white px-2.5 py-2 shadow-sm transition hover:border-primary/35 hover:shadow-md md:gap-3 md:px-3 md:py-2">
      <Link
        href={`/profile/${member.id}`}
        className="relative flex size-9 shrink-0 overflow-hidden rounded-full border border-border bg-primary/10 md:size-10"
      >
        {member.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-[10px] font-semibold text-primary md:text-xs">
            {member.initials}
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1 text-start">
        <Link
          href={`/profile/${member.id}`}
          className="block truncate text-sm font-semibold leading-tight text-foreground hover:text-primary hover:underline"
        >
          {member.fullName}
        </Link>
        {professionalLine ? (
          <p className="truncate text-xs text-muted-foreground">{professionalLine}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-1">
        {variant === "invitation" ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => acceptConnectionRequest(member.id))}
              className={`${actionBtn} border-primary bg-primary text-primary-foreground hover:bg-primary/90`}
            >
              {t("network.accept")}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => rejectConnectionRequest(member.id))}
              className={`${actionBtn} border-border text-muted-foreground hover:bg-muted/60`}
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
                className={`${actionBtn} border-primary text-primary hover:bg-primary/5`}
              >
                {t("network.connect")}
              </button>
            ) : null}
            {member.connectionStatus === "pending_out" ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => cancelConnectionRequest(member.id))}
                className={`${actionBtn} border-border text-muted-foreground`}
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
                  className={`${actionBtn} border-primary bg-primary text-primary-foreground`}
                >
                  {t("network.accept")}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => rejectConnectionRequest(member.id))}
                  className={`${actionBtn} border-border text-muted-foreground`}
                >
                  {t("network.ignore")}
                </button>
              </>
            ) : null}
            {member.connectionStatus === "connected" && messageHref ? (
              <Link href={messageHref} className="network-msg-btn">
                {t("network.message")}
              </Link>
            ) : null}
          </>
        ) : null}

        {variant === "connection" && messageHref ? (
          <Link href={messageHref} className="network-msg-btn">
            {t("network.message")}
          </Link>
        ) : null}
      </div>
    </li>
  );
}
