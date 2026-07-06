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

async function DiscussionsContent({
  searchQuery,
  isAdmin,
}: {
  searchQuery: string;
  isAdmin: boolean;
}) {
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
    <>
      <aside className="order-1 flex min-h-0 flex-col gap-4 lg:col-start-1 lg:row-start-1 lg:self-start">
        <DiscussionSearchBar defaultQuery={searchQuery} />
        <DiscussionComposer />
      </aside>

      <section className="order-2 flex min-h-0 min-w-0 flex-col lg:col-span-2 lg:col-start-2 lg:row-start-1 lg:h-full">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          {isSearchActive ? (
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
              <p className="text-sm font-semibold text-foreground">
                {t("discussions.searchResultsHeading").replace("{query}", searchQuery)}
              </p>
              <Link
                href="/discussions"
                className="shrink-0 text-sm font-medium text-primary hover:text-primary/80"
              >
                {t("discussions.clearSearch")}
              </Link>
            </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <DiscussionList
              embedded
              isAdmin={isAdmin}
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
        </div>
      </section>
    </>
  );
}

export default async function DiscussionsPage({ searchParams }: DiscussionsPageProps) {
  const [locale, user] = await Promise.all([getLocale(), getCurrentUser()]);
  const t = createT(getMessages(locale));
  const params = await searchParams;
  const searchQuery = normalizeDiscussionSearchQuery(params.q);

  if (!user) {
    redirect("/");
  }

  return (
    <div className="home-page-root flex min-h-screen flex-col max-md:block max-md:min-h-0">
      <Navbar authenticated />
      <main className="home-main-shell feed-page home-feed-shell h-full min-h-0 w-full min-w-0 max-w-[100vw] overflow-x-clip py-3 max-md:h-auto max-md:overflow-visible md:min-h-[calc(100vh-4rem)] md:py-6 lg:overflow-hidden lg:py-2">
        <div className="mx-auto flex h-full w-full min-w-0 max-w-[1240px] flex-col px-3 sm:px-4 max-md:h-auto">
          <header className="mb-3 shrink-0 min-w-0 text-start">
            <p className="text-sm leading-relaxed text-muted-foreground">{t("discussions.subtitle")}</p>
          </header>
          <div className="home-feed-grid discussions-page-grid grid min-h-0 flex-1 grid-cols-1 gap-4 max-md:h-auto max-md:min-h-0 max-md:flex-none lg:grid-cols-[280px_minmax(0,1fr)_260px] lg:items-start lg:gap-6">
            <Suspense fallback={<DiscussionsSkeleton />}>
              <DiscussionsContent searchQuery={searchQuery} isAdmin={user.isAdmin} />
            </Suspense>
          </div>
        </div>
      </main>
      <div className="lg:hidden">
        <Footer />
      </div>
    </div>
  );
}
