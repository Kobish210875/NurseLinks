"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/i18n/LocaleProvider";

const ADMIN_TABS = [
  { href: "/admin/users", labelKey: "nav.adminUsers" },
  { href: "/admin/backups", labelKey: "nav.adminBackups" },
  { href: "/admin/moderation", labelKey: "nav.adminModeration" },
] as const;

export default function AdminNavTabs() {
  const t = useT();
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-2"
      aria-label={t("nav.admin")}
    >
      {ADMIN_TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-primary/30 text-primary hover:bg-primary/5"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {t(tab.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
