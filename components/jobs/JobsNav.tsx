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
  const view = searchParams.get("view");
  const onSearch = pathname === "/jobs" && view !== "applications";
  const onApplications = pathname === "/jobs" && view === "applications";
  const onPublish = pathname.startsWith("/jobs/new");

  const tabClass = (active: boolean) =>
    `relative flex min-h-[2.25rem] min-w-0 items-center justify-center rounded-lg px-1 py-1.5 text-center text-[11px] font-semibold leading-tight transition sm:min-h-0 sm:px-2.5 sm:py-2 sm:text-sm sm:leading-snug ${
      active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    }`;

  return (
    <nav
      className="feed-card grid min-w-0 grid-cols-3 gap-0.5 p-0.5 sm:gap-1 sm:p-1"
      aria-label={t("jobs.navAria")}
    >
      <Link href="/jobs" className={tabClass(onSearch)}>
        {t("jobs.tabBrowse")}
      </Link>
      <Link href="/jobs?view=applications" className={tabClass(onApplications)}>
        <span className="inline-flex max-w-full flex-wrap items-center justify-center gap-0.5">
          <span className="truncate">{t("jobs.tabApplications")}</span>
          {applicationsUnread > 0 ? (
            <span
              className={`inline-flex min-w-[1rem] shrink-0 items-center justify-center rounded-full px-0.5 text-[9px] font-bold leading-none sm:min-w-[1.125rem] sm:px-1 sm:text-[10px] ${
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
