"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useT } from "@/components/i18n/LocaleProvider";
import NavUnreadDot from "@/components/nav/NavUnreadDot";
import { useNavCounts } from "@/components/nav/NavCountsProvider";

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
    {
      href: "/jobs",
      label: t("nav.jobs"),
      badge: "jobs",
      match: (path) => path === "/jobs" || path.startsWith("/jobs/"),
    },
    {
      href: "/messages",
      label: t("nav.messages"),
      badge: "messages",
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
      className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-[60] overflow-visible border-t border-border bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label={t("nav.mobileBottomAria")}
      dir="rtl"
    >
      <ul className="mx-auto grid h-12 w-full max-w-none grid-cols-5 overflow-visible" dir="rtl">
        {items.map((item) => {
          const active = item.match(pathname, searchParams);
          const count = badgeCount(item.badge);
          const showBadge = count > 0 && item.badge;

          return (
            <li key={item.href} className="min-w-0 overflow-visible">
              <Link
                href={item.href}
                className={`relative flex h-full min-h-12 min-w-0 flex-col items-center justify-center overflow-visible px-0.5 py-1 text-center transition ${
                  active
                    ? "text-foreground after:absolute after:inset-x-1 after:top-0 after:h-0.5 after:rounded-full after:bg-foreground"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {showBadge ? (
                  <NavUnreadDot
                    className="absolute top-1 z-10 start-1.5"
                    ariaLabel={badgeLabel(item.badge, count)}
                  />
                ) : null}
                <span className="max-w-full truncate text-[11px] font-semibold leading-tight">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
