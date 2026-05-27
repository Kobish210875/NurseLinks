"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LanguageToggle from "@/components/i18n/LanguageToggle";
import { useT } from "@/components/i18n/LocaleProvider";
import { useCurrentUser } from "@/components/nav/CurrentUserProvider";
import MobileMoreMenu from "@/components/nav/MobileMoreMenu";
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
  const mobileUser = useCurrentUser();
  const { pendingInvitations, unreadMessages, unreadJobs } = useNavCounts();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { href: "/home", label: t("nav.home") },
    { href: "/network", label: t("nav.network"), badge: "network" },
    { href: "/jobs", label: t("nav.jobs"), badge: "jobs" },
    { href: "/messages", label: t("nav.messages"), badge: "messages" },
    ...(mobileUser?.isAdmin ? [{ href: "/admin/users", label: t("nav.admin") }] : []),
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

  function renderDesktopNavLinks() {
    return (
      <div className="hidden shrink-0 items-center gap-0.5 md:flex">
        {authenticated
          ? navItems.map((item) => {
              if (item.href === "/admin/users" && mobileUser?.isAdmin) {
                const adminActive = isActive("/admin");
                return (
                  <div key="admin-menu" className="group relative flex items-stretch">
                    <button
                      type="button"
                      className={`relative z-10 flex items-center justify-center whitespace-nowrap rounded-t-xl px-2.5 py-2 text-xs font-medium transition-colors ${
                        adminActive
                          ? "bg-white text-primary"
                          : "text-muted-foreground hover:bg-white hover:text-primary"
                      }`}
                      aria-haspopup="menu"
                    >
                      <span className="inline-flex items-center gap-1">
                        {t("nav.admin")}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </button>
                    <div className="invisible absolute right-0 top-full z-50 -mt-px w-52 overflow-hidden rounded-b-2xl border border-border border-t-0 bg-white p-2 opacity-0 shadow-sm transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                      <Link
                        href="/admin/users"
                        className={`relative flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition ${
                          isActive("/admin/users")
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted/70"
                        }`}
                      >
                        <span>{t("nav.adminUsers")}</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-primary"
                          aria-hidden="true"
                        >
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                );
              }

              const count = badgeCount(item.badge);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center justify-center whitespace-nowrap px-2.5 py-2 text-xs font-medium transition-colors ${
                    isActive(item.href)
                      ? "nav-link-active"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <span
                    className={
                      item.badge
                        ? "inline-flex items-center gap-1.5"
                        : "inline-flex items-center"
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
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-nav-bg md:overflow-x-clip">
      {/* Mobile app header — physical LTR: logo left, menu right */}
      {authenticated && mobileUser ? (
        <nav
          className="grid h-14 w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 overflow-visible px-3 md:hidden"
          dir="ltr"
          aria-label={t("nav.mobileHeaderAria")}
        >
          <Link
            href="/home"
            className="shrink-0 justify-self-start text-base font-bold text-primary"
            aria-label={t("nav.homeAria")}
          >
            <NurseLinkWordmark
              className="gap-1"
              textClassName="text-primary text-sm"
              iconClassName="size-[0.85em] shrink-0 text-primary"
            />
          </Link>

          <div className="min-w-0 overflow-visible ps-1">
            <NavPeopleSearch compact />
          </div>

          <Link
            href="/profile"
            className="relative flex size-9 shrink-0 justify-self-end overflow-hidden rounded-full border border-border bg-primary/10"
            aria-label={t("nav.myProfile")}
          >
            {mobileUser.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mobileUser.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-[10px] font-semibold text-primary">
                {mobileUser.initials}
              </span>
            )}
          </Link>

          <button
            type="button"
            className="-me-1 shrink-0 justify-self-end rounded-md p-2 text-muted-foreground hover:bg-white"
            aria-label={t("nav.openMenu")}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
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
        </nav>
      ) : null}

      {/* Desktop + logged-out mobile */}
      <nav
        className={`mx-auto h-14 w-full min-w-0 max-w-[1128px] px-3 sm:px-4 ${
          authenticated ? "hidden md:block" : "flex items-center gap-1.5 sm:gap-2"
        }`}
      >
        {authenticated ? (
          <div className="grid h-14 w-full items-center gap-3 max-lg:grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,260px)] lg:gap-6">
            <div className="hidden lg:col-start-1 lg:block" aria-hidden="true" />

            <div className="col-start-1 flex min-w-0 items-center justify-end gap-2 sm:gap-3 lg:col-start-2 lg:justify-start">
              {renderDesktopNavLinks()}
              <div className="w-full min-w-0 max-w-[14rem] sm:max-w-xs md:max-w-sm lg:max-w-md">
                <NavPeopleSearch />
              </div>
            </div>

            <Link
              href="/home"
              className="hidden shrink-0 text-base font-bold text-primary lg:col-start-3 lg:block lg:justify-self-end"
              aria-label={t("nav.homeAria")}
            >
              <NurseLinkWordmark textClassName="text-primary text-base sm:text-lg" />
            </Link>
          </div>
        ) : (
          <div className="flex h-14 w-full items-center gap-1.5 sm:gap-2">
            <Link
              href="/"
              className="min-w-0 shrink pe-1 text-base font-bold text-primary sm:pe-2 sm:text-lg"
              aria-label={t("nav.homeAria")}
            >
              <NurseLinkWordmark textClassName="text-primary text-base sm:text-lg" />
            </Link>

            <div className="ms-auto hidden items-center gap-2 md:flex">
              <LanguageToggle />
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
            </div>

            <div className="ms-auto flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2 md:hidden">
              <LanguageToggle />
              <Link
                href="/login"
                className="rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground"
              >
                {t("nav.login")}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {authenticated && mobileUser ? (
        <MobileMoreMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      ) : null}
    </header>
  );
}
