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
  isPost?: boolean;
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
      match: (path, search) => path === "/home" && search.get("compose") !== "1",
    },
    {
      href: "/network",
      label: t("nav.network"),
      badge: "network",
      match: (path) => path === "/network" || path.startsWith("/network/"),
    },
    {
      href: "/home?compose=1",
      label: t("nav.post"),
      isPost: true,
      match: (_path, search) => search.get("compose") === "1",
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
      return t("nav.unreadJobsDot");
    }
    return "";
  }

  return (
    <nav
      className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label={t("nav.mobileBottomAria")}
      dir="rtl"
    >
      <ul className="mx-auto grid h-14 max-w-lg grid-cols-5" dir="rtl">
        {items.map((item) => {
          const active = item.match(pathname, searchParams);
          const count = badgeCount(item.badge);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`relative flex h-full flex-col items-center justify-center gap-0.5 px-1 text-center text-[13px] font-semibold leading-snug transition ${
                  active
                    ? "text-foreground after:absolute after:inset-x-2 after:top-0 after:h-0.5 after:rounded-full after:bg-foreground"
                    : "text-muted-foreground hover:text-primary"
                } ${item.isPost ? "text-primary" : ""}`}
              >
                <span className="inline-flex max-w-full items-center gap-1">
                  <span className="truncate">{item.label}</span>
                  {count > 0 && item.badge ? (
                    <NavUnreadDot ariaLabel={badgeLabel(item.badge, count)} />
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
