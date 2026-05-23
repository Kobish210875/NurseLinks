"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LanguageToggle from "@/components/i18n/LanguageToggle";
import { useT } from "@/components/i18n/LocaleProvider";
import NavUnreadDot from "@/components/nav/NavUnreadDot";
import NavPeopleSearch from "@/components/nav/NavPeopleSearch";
import { useNavCounts } from "@/components/nav/NavCountsProvider";
import NurseLinkWordmark from "@/components/NurseLinkWordmark";

type NavbarProps = {
  authenticated?: boolean;
};

type NavItem = {
  href: string;
  label: string;
  badge?: "network" | "messages" | "jobs";
};

export default function Navbar({ authenticated = false }: NavbarProps) {
  const t = useT();
  const pathname = usePathname();
  const { pendingInvitations, unreadMessages, unreadJobs } = useNavCounts();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    { href: "/home", label: t("nav.home") },
    { href: "/network", label: t("nav.network"), badge: "network" },
    { href: "/jobs", label: t("nav.jobs"), badge: "jobs" },
    { href: "/messages", label: t("nav.messages"), badge: "messages" },
  ];

  function isActive(href: string) {
    if (href.startsWith("#")) {
      return false;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function badgeCount(kind: NavItem["badge"]) {
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

  function badgeLabel(kind: NavItem["badge"], count: number) {
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

  function renderNavBadge(kind: NavItem["badge"], count: number) {
    if (count <= 0 || !kind) {
      return null;
    }
    return <NavUnreadDot ariaLabel={badgeLabel(kind, count)} />;
  }

  return (
    <header className="sticky top-0 z-50 overflow-x-clip border-b border-border bg-nav-bg">
      <nav className="mx-auto flex h-14 w-full min-w-0 max-w-[1128px] items-center gap-1.5 px-3 sm:gap-2 sm:px-4">
        <Link
          href={authenticated ? "/home" : "/"}
          className="min-w-0 shrink pe-1 text-base font-bold text-primary sm:pe-2 sm:text-lg"
          aria-label={t("nav.homeAria")}
        >
          <NurseLinkWordmark textClassName="text-primary text-base sm:text-lg" />
        </Link>

        {authenticated ? (
          <div className="mx-2 hidden min-w-0 flex-1 md:block">
            <NavPeopleSearch />
          </div>
        ) : null}

        <div className="hidden items-stretch gap-1 md:flex">
          {authenticated
            ? navItems.map((item) => {
                const count = badgeCount(item.badge);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex min-w-[4.5rem] flex-col items-center justify-center px-2 py-1 text-xs font-medium transition-colors ${
                      isActive(item.href)
                        ? "nav-link-active"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    <span
                      className={
                        item.badge
                          ? "inline-flex items-center gap-1.5 px-1"
                          : "px-1"
                      }
                    >
                      {item.label}
                      {renderNavBadge(item.badge, count)}
                    </span>
                  </Link>
                );
              })
            : null}
        </div>

        <div className="ms-auto hidden items-center gap-2 md:flex">
          <LanguageToggle />
          {!authenticated ? (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-white hover:text-primary"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/register"
                className="btn-primary rounded-md px-4 py-1.5 text-sm font-semibold text-primary-foreground"
              >
                {t("nav.register")}
              </Link>
            </>
          ) : null}
        </div>

        <div className="ms-auto flex min-w-0 shrink-0 items-center gap-1.5 md:ms-0 md:hidden sm:gap-2">
          <LanguageToggle />
          <button
            type="button"
            className="rounded-md p-2 text-muted-foreground hover:bg-white md:hidden"
            aria-label={t("nav.openMenu")}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>
        </div>
      </nav>

      {mobileOpen && authenticated ? (
        <div className="border-t border-border bg-nav-bg md:hidden">
          <div className="space-y-1 px-4 py-3">
            <div className="pb-2 md:hidden">
              <NavPeopleSearch />
            </div>
            {navItems.map((item) => {
              const count = badgeCount(item.badge);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium ${
                    isActive(item.href)
                      ? "bg-white text-primary"
                      : "text-muted-foreground hover:bg-white hover:text-primary"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="inline-flex items-center gap-2">
                    {item.label}
                    {count > 0 && item.badge ? (
                      <NavUnreadDot ariaLabel={badgeLabel(item.badge, count)} />
                    ) : null}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      {mobileOpen && !authenticated ? (
        <div className="border-t border-border bg-nav-bg md:hidden">
          <div className="space-y-1 px-4 py-3">
            <div className="flex gap-2 pt-1">
              <Link
                href="/login"
                className="flex-1 rounded-md border border-border bg-white py-2 text-center text-sm font-medium"
                onClick={() => setMobileOpen(false)}
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/register"
                className="btn-primary flex-1 rounded-md py-2 text-center text-sm font-semibold text-primary-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {t("nav.register")}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
