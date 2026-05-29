"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useT } from "@/components/i18n/LocaleProvider";

type JobsNavProps = {
  applicationsUnread?: number;
};

export default function JobsNav({ applicationsUnread = 0 }: JobsNavProps) {
  const t = useT();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") ?? "search";
  const onSearch = pathname === "/jobs" && view !== "all" && view !== "applications";
  const onAll = pathname === "/jobs" && view === "all";
  const onApplications = pathname === "/jobs" && view === "applications";
  const onPublish = pathname.startsWith("/jobs/new");

  const tabClass = (active: boolean) =>
    `relative min-w-0 rounded-lg px-2 py-2 text-center text-[13px] font-semibold leading-snug transition sm:px-2.5 sm:text-sm ${
      active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    }`;

  return (
    <nav
      className="feed-card grid min-w-0 grid-cols-2 gap-1 p-1 sm:grid-cols-4"
      aria-label={t("jobs.navAria")}
    >
      <Link href="/jobs" className={tabClass(onSearch)}>
        {t("jobs.tabBrowse")}
      </Link>
      <Link href="/jobs?view=all" className={tabClass(onAll)}>
        {t("jobs.tabAll")}
      </Link>
      <Link href="/jobs?view=applications" className={tabClass(onApplications)}>
        <span className="inline-flex items-center justify-center gap-1">
          {t("jobs.tabApplications")}
          {applicationsUnread > 0 ? (
            <span
              className={`inline-flex min-w-[1.125rem] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none ${
                onApplications ? "bg-white/20 text-primary-foreground" : "bg-primary text-primary-foreground"
              }`}
            >
              {applicationsUnread > 9 ? "9+" : applicationsUnread}
            </span>
          ) : null}
        </span>
      </Link>
      <Link href="/jobs/new" className={tabClass(onPublish)}>
        {t("jobs.tabPublish")}
      </Link>
    </nav>
  );
}
