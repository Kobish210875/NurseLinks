import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import DiscussionComposer from "@/components/discussions/DiscussionComposer";
import DiscussionList from "@/components/discussions/DiscussionList";
import DiscussionSearchBar from "@/components/discussions/DiscussionSearchBar";
import DiscussionsSkeleton from "@/components/discussions/DiscussionsSkeleton";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getDiscussionThreads } from "@/lib/data/discussions";
import { normalizeDiscussionSearchQuery } from "@/lib/discussions/search-query";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";
import { createClient } from "@/lib/supabase/server";

type DiscussionsPageProps = {
  searchParams: Promise<{ q?: string }>;
};

async function DiscussionsContent({ searchQuery }: { searchQuery: string }) {
  const [user, locale, supabase] = await Promise.all([
    getCurrentUser(),
    getLocale(),
    createClient(),
  ]);

  if (!user) {
    redirect("/");
  }

  const t = createT(getMessages(locale));
  const result = await getDiscussionThreads(supabase, locale, searchQuery);

  if ("error" in result) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
        <p className="font-semibold">{t("discussions.notConfiguredTitle")}</p>
        <p className="mt-2 leading-relaxed">{t("discussions.notConfigured")}</p>
      </div>
    );
  }

  const isSearchActive = searchQuery.length > 0;

  return (
    <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:items-stretch lg:gap-6">
      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <DiscussionSearchBar defaultQuery={searchQuery} />
        <DiscussionComposer />
      </aside>

      <section className="flex min-h-0 min-w-0 flex-col lg:min-h-[calc(100dvh-11rem)]">
        <div className="mb-2 flex min-w-0 flex-wrap items-center justify-between gap-2 px-1">
          <h2 className="text-sm font-semibold text-foreground">
            {isSearchActive
              ? t("discussions.searchResultsHeading").replace("{query}", searchQuery)
              : t("discussions.threadsHeading")}
          </h2>
          {isSearchActive ? (
            <Link
              href="/discussions"
              className="shrink-0 text-sm font-medium text-primary hover:text-primary/80"
            >
              {t("discussions.clearSearch")}
            </Link>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain lg:rounded-lg lg:border lg:border-border lg:bg-white">
          <DiscussionList
            threads={result.threads}
            emptyLabel={t("discussions.emptyList")}
            searchEmptyLabel={t("discussions.searchEmpty")}
            isSearchActive={isSearchActive}
            repliesLabel={(count) =>
              count === 0
                ? t("discussions.noRepliesShort")
                : t("discussions.repliesCount").replace("{count}", String(count))
            }
          />
        </div>
      </section>
    </div>
  );
}

export default async function DiscussionsPage({ searchParams }: DiscussionsPageProps) {
  const locale = await getLocale();
  const t = createT(getMessages(locale));
  const params = await searchParams;
  const searchQuery = normalizeDiscussionSearchQuery(params.q);

  return (
    <div className="home-page-root flex min-h-screen flex-col max-md:block max-md:min-h-0">
      <Navbar authenticated />
      <main className="home-main-shell feed-page flex min-h-0 w-full min-w-0 max-w-[100vw] flex-1 flex-col overflow-x-clip py-3 max-md:h-auto max-md:overflow-visible md:min-h-[calc(100vh-4rem)] md:py-6">
        <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col px-3 sm:px-4">
          <header className="mb-4 min-w-0 text-start">
            <h1 className="break-words text-lg font-bold text-foreground sm:text-xl">
              {t("discussions.title")}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t("discussions.subtitle")}
            </p>
          </header>
          <Suspense fallback={<DiscussionsSkeleton />}>
            <DiscussionsContent searchQuery={searchQuery} />
          </Suspense>
        </div>
      </main>
      <div className="lg:hidden">
        <Footer />
      </div>
    </div>
  );
}
