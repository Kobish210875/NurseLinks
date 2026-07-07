"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useT } from "@/components/i18n/LocaleProvider";
import NavUnreadDot from "@/components/nav/NavUnreadDot";
import { useNavCounts } from "@/components/nav/NavCountsProvider";
import { SHOW_DISCUSSIONS_IN_NAV, SHOW_JOBS_IN_NAV } from "@/lib/features/nav";

type BottomItem = {
  href: string;
  label: string;
  match: (pathname: string, search: URLSearchParams) => boolean;
  badge?: "network" | "messages" | "jobs";
};

export default function MobileBottomNav() {
  const t = useT();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { pendingInvitations, unreadMessages, unreadJobs } = useNavCounts();

  const items: BottomItem[] = [
    {
      href: "/home",
      label: t("nav.home"),
      match: (path) => path === "/home",
    },
    {
      href: "/network",
      label: t("nav.network"),
      badge: "network",
      match: (path) => path === "/network" || path.startsWith("/network/"),
    },
    {
      href: "/institutions",
      label: t("nav.institutions"),
      match: (path) => path === "/institutions" || path.startsWith("/hospitals/"),
    },
    ...(SHOW_DISCUSSIONS_IN_NAV
      ? [
          {
            href: "/discussions",
            label: t("nav.discussions"),
            match: (path: string) => path === "/discussions" || path.startsWith("/discussions/"),
          } satisfies BottomItem,
        ]
      : []),
    ...(SHOW_JOBS_IN_NAV
      ? [
          {
            href: "/jobs",
            label: t("nav.jobs"),
            badge: "jobs" as const,
            match: (path: string) => path === "/jobs" || path.startsWith("/jobs/"),
          } satisfies BottomItem,
        ]
      : []),
    {
      href: "/messages",
      label: t("nav.messages"),
      match: (path) => path === "/messages" || path.startsWith("/messages/"),
    },
  ];

  function badgeCount(kind: BottomItem["badge"]) {
    if (kind === "network") {
      return pendingInvitations;
    }
    if (kind === "messages") {
      return unreadMessages;
    }
    if (kind === "jobs") {
      return unreadJobs;
    }
    return 0;
  }

  function badgeLabel(kind: BottomItem["badge"], count: number) {
    if (kind === "network") {
      return t("nav.pendingInvitations").replace("{count}", String(count));
    }
    if (kind === "messages") {
      return t("nav.unreadMessages").replace("{count}", String(count));
    }
    if (kind === "jobs") {
      return t("nav.unreadJobs").replace("{count}", String(count));
    }
    return "";
  }

  return (
    <nav
      className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-[60] overflow-hidden border-t border-border bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgb(44_74_110/0.1)] md:hidden"
      aria-label={t("nav.mobileBottomAria")}
      dir="rtl"
    >
      <ul
        className="mx-auto grid h-[3.75rem] w-full gap-0 overflow-visible px-0"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        dir="rtl"
      >
        {items.map((item) => {
          const active = item.match(pathname, searchParams);
          const count = badgeCount(item.badge);
          const showBadge = count > 0 && item.badge;

          return (
            <li key={item.href} className="min-w-0 overflow-visible">
              <Link
                href={item.href}
                className={`relative flex h-full min-w-0 flex-col items-center justify-center overflow-visible px-0 text-center text-[11px] font-semibold leading-[1.15] transition ${
                  active
                    ? "text-foreground after:absolute after:inset-x-0.5 after:top-0 after:h-0.5 after:rounded-full after:bg-foreground"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <span className="inline-flex max-w-full items-start justify-center gap-0.5" dir="rtl">
                  {showBadge ? (
                    <NavUnreadDot ariaLabel={badgeLabel(item.badge, count)} className="mt-0.5 shrink-0" />
                  ) : null}
                  <span className="line-clamp-2 whitespace-normal">{item.label}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
