"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/components/i18n/LocaleProvider";

export default function JobsNav() {
  const t = useT();
  const pathname = usePathname();
  const onBrowse = pathname === "/jobs";
  const onPublish = pathname.startsWith("/jobs/new");

  const tabClass = (active: boolean) =>
    `flex-1 rounded-lg px-3 py-2.5 text-center text-sm font-semibold transition ${
      active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    }`;

  return (
    <nav
      className="feed-card grid grid-cols-2 gap-1 p-1"
      aria-label={t("jobs.navAria")}
    >
      <Link href="/jobs" className={tabClass(onBrowse)}>
        {t("jobs.tabBrowse")}
      </Link>
      <Link href="/jobs/new" className={tabClass(onPublish)}>
        {t("jobs.tabPublish")}
      </Link>
    </nav>
  );
}
