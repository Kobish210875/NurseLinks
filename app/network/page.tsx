import { Suspense } from "react";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import NetworkPanel from "@/components/network/NetworkPanel";
import NetworkSidebar from "@/components/network/NetworkSidebar";
import NetworkSidebarSkeleton from "@/components/network/NetworkSidebarSkeleton";
import NetworkSkeleton from "@/components/network/NetworkSkeleton";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getNetworkPageData } from "@/lib/data/connections";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";
import { createClient } from "@/lib/supabase/server";
import {
  isHebrewNameSearchQuery,
  sanitizeHebrewNameSearchInput,
} from "@/lib/validation/hebrew-name";

type NetworkPageProps = {
  searchParams: Promise<{ q?: string }>;
};

async function NetworkContent({ query }: { query: string }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }
  const supabase = await createClient();
  const { connections, invitations, sentInvitations, searchResults, recommendations } =
    await getNetworkPageData(supabase, user.id, query, user.isAdmin);
  return (
    <NetworkPanel
      connections={connections}
      invitations={invitations}
      sentInvitations={sentInvitations}
      initialQuery={query}
      recommendations={recommendations}
      searchResults={searchResults}
    />
  );
}

export default async function NetworkPage({ searchParams }: NetworkPageProps) {
  const [locale, params] = await Promise.all([getLocale(), searchParams]);
  const t = createT(getMessages(locale));
  const rawQuery = typeof params.q === "string" ? params.q.trim() : "";
  const query =
    rawQuery.length >= 2 && isHebrewNameSearchQuery(rawQuery)
      ? sanitizeHebrewNameSearchInput(rawQuery)
      : "";

  return (
    <>
      <div className="home-page-root flex min-h-screen flex-col max-md:block max-md:min-h-0">
        <Navbar authenticated />
        <main className="home-main-shell feed-page home-feed-shell h-full min-h-0 w-full min-w-0 max-w-[100vw] overflow-x-clip py-3 max-md:h-auto max-md:overflow-visible md:min-h-[calc(100vh-4rem)] md:py-6 lg:overflow-hidden lg:py-2">
          <div className="mx-auto flex h-full w-full min-w-0 max-w-[1240px] flex-col px-3 sm:px-4 max-md:h-auto">
            <div className="home-feed-grid grid h-full min-h-0 flex-1 grid-cols-1 gap-4 max-md:h-auto max-md:min-h-0 max-md:flex-none lg:grid-cols-[280px_minmax(0,1fr)_260px] lg:items-stretch lg:gap-6">
              <div className="home-feed-sidebar order-1 hidden h-full min-h-0 lg:block">
                <Suspense fallback={<NetworkSidebarSkeleton />}>
                  <NetworkSidebar />
                </Suspense>
              </div>
              <div className="home-feed-center order-2 flex h-full min-h-0 min-w-0 flex-col max-md:h-auto lg:col-span-2">
                <header className="mb-4 shrink-0 min-w-0 text-start">
                  <h1 className="break-words text-lg font-bold text-foreground sm:text-xl">
                    {t("network.title")}
                  </h1>
                </header>
                <Suspense fallback={<NetworkSkeleton />}>
                  <NetworkContent query={query} />
                </Suspense>
              </div>
            </div>
          </div>
        </main>
        <div className="lg:hidden">
          <Footer />
        </div>
      </div>
    </>
  );
}
