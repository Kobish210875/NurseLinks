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

  return (
    <div className="space-y-4">
      <DiscussionSearchBar defaultQuery={searchQuery} />
      <DiscussionComposer />
      <DiscussionList
        threads={result.threads}
        emptyLabel={t("discussions.emptyList")}
        searchEmptyLabel={t("discussions.searchEmpty")}
        isSearchActive={searchQuery.length > 0}
        repliesLabel={(count) =>
          count === 0
            ? t("discussions.noRepliesShort")
            : t("discussions.repliesCount").replace("{count}", String(count))
        }
      />
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
        <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col px-3 sm:px-4">
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
