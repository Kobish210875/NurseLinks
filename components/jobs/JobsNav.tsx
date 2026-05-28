"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useT } from "@/components/i18n/LocaleProvider";

export default function JobsNav() {
  const t = useT();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "search";
  const onSearch = pathname === "/jobs" && view !== "all";
  const onAll = pathname === "/jobs" && view === "all";
  const onPublish = pathname.startsWith("/jobs/new");

  const tabClass = (active: boolean) =>
    `min-w-0 rounded-lg px-2 py-2 text-center text-[15px] font-semibold leading-snug transition sm:px-3 sm:py-2.5 sm:text-sm ${
      active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    }`;

  return (
    <nav
      className="feed-card grid min-w-0 grid-cols-3 gap-1 p-1"
      aria-label={t("jobs.navAria")}
    >
      <Link href="/jobs" className={tabClass(onSearch)}>
        {t("jobs.tabBrowse")}
      </Link>
      <Link href="/jobs?view=all" className={tabClass(onAll)}>
        {t("jobs.tabAll")}
      </Link>
      <Link href="/jobs/new" className={tabClass(onPublish)}>
        {t("jobs.tabPublish")}
      </Link>
    </nav>
  );
}
