import { Suspense } from "react";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import JobsAutoRefresh from "@/components/jobs/JobsAutoRefresh";
import JobsBrowseSkeleton from "@/components/jobs/JobsBrowseSkeleton";
import JobsNav from "@/components/jobs/JobsNav";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getUnreadJobApplicationCount } from "@/lib/data/jobs";
import { getJobsVersion } from "@/lib/data/sync-versions";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";
import { createClient } from "@/lib/supabase/server";

/**
 * Async component for the jobs-specific chrome: the auto-refresh poller
 * and the Browse / Applications / Publish tab bar.
 *
 * Auth + two Supabase queries live here. While this suspends, the layout
 * shell (Navbar, title) and the {children} browse skeleton are already
 * visible to the user.
 *
 * Because this and the {children} Suspense are siblings (not nested),
 * their data fetches run in parallel — both start as soon as React
 * cache() delivers getCurrentUser().
 */
async function JobsChrome() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }
  const supabase = await createClient();
  const [jobsVersion, applicationsUnread] = await Promise.all([
    getJobsVersion(supabase, user.id),
    getUnreadJobApplicationCount(supabase, user.id),
  ]);
  return (
    <>
      <JobsAutoRefresh initialVersion={jobsVersion} />
      <JobsNav applicationsUnread={applicationsUnread} />
    </>
  );
}

/**
 * Layout shell — only awaits getLocale() which reads a cookie (< 1 ms,
 * no network). The Navbar + title + both skeletons are sent as the first
 * RSC chunk before any Supabase work begins.
 */
export default async function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const t = createT(getMessages(locale));

  return (
    <div className="home-page-root flex min-h-screen flex-col max-md:block max-md:min-h-0">
      <Navbar authenticated />
      <main className="home-main-shell feed-page min-h-0 w-full min-w-0 max-w-[100vw] overflow-hidden py-4 max-md:block max-md:flex-none max-md:overflow-x-clip max-md:pb-[calc(var(--mobile-bottom-nav-offset)+1.75rem)] md:pb-6 md:pt-0">
        <div className="mx-auto flex h-full w-full min-w-0 max-w-2xl flex-col gap-3 overflow-hidden px-3 sm:px-4 max-md:block max-md:h-auto max-md:overflow-x-clip max-md:pb-[calc(var(--mobile-bottom-nav-offset)+1.5rem)] lg:max-w-[1240px] lg:gap-4">
          <header className="shrink-0 min-w-0 pt-2 text-start md:pt-3">
            <h1 className="break-words text-lg font-bold text-foreground sm:text-xl">
              {t("jobs.title")}
            </h1>
          </header>

          {/* Jobs tab-bar + auto-refresh — skeleton while auth + queries run */}
          <Suspense
            fallback={
              <div className="h-11 rounded-2xl border bg-card motion-safe:animate-pulse" />
            }
          >
            <JobsChrome />
          </Suspense>

          {/*
           * Browse content — sibling of JobsChrome, NOT nested inside it.
           * Both Suspense boundaries start resolving at the same time:
           * JobsBrowseSkeleton is visible immediately, replaced by real
           * content once getCurrentUser + job queries resolve.
           */}
          <Suspense fallback={<JobsBrowseSkeleton />}>
            <div className="jobs-browse-shell min-h-0 min-w-0 max-md:overflow-visible lg:flex-1">
              {children}
            </div>
          </Suspense>

          <div className="mobile-feed-bottom-spacer md:hidden" aria-hidden="true" />
        </div>
      </main>
      <div className="lg:hidden">
        <Footer />
      </div>
    </div>
  );
}
