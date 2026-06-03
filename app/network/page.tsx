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

type NetworkPageProps = {
  searchParams: Promise<{ q?: string }>;
};

async function NetworkContent({ query }: { query: string }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }
  const supabase = await createClient();
  const { connections, invitations, searchResults, recommendations } = await getNetworkPageData(
    supabase,
    user.id,
    query,
  );
  return (
    <NetworkPanel
      connections={connections}
      invitations={invitations}
      initialQuery={query}
      recommendations={recommendations}
      searchResults={searchResults}
    />
  );
}

export default async function NetworkPage({ searchParams }: NetworkPageProps) {
  const [locale, params] = await Promise.all([getLocale(), searchParams]);
  const t = createT(getMessages(locale));
  const query = typeof params.q === "string" ? params.q.trim() : "";

  return (
    <>
      <Navbar authenticated />
      <main className="feed-page home-feed-shell min-h-0 w-full min-w-0 max-w-[100vw] overflow-x-clip py-3 md:min-h-[calc(100vh-4rem)] md:py-6 lg:overflow-hidden lg:py-4">
        <div className="mx-auto flex h-full w-full min-w-0 max-w-[1240px] flex-col px-3 sm:px-4">
          <header className="mb-4 shrink-0 min-w-0 text-start">
            <h1 className="break-words text-lg font-bold text-foreground sm:text-xl">
              {t("network.title")}
            </h1>
          </header>
          {/*
           * Same 3-track grid as the navbar (280 | 1fr | 260). Network spans the
           * left + center tracks so its edge lines up under the logo column.
           */}
          <div className="home-feed-grid grid min-h-0 w-full flex-1 grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)_260px] lg:items-start lg:gap-6">
            <div className="home-feed-sidebar order-1 hidden lg:block">
              <Suspense fallback={<NetworkSidebarSkeleton />}>
                <NetworkSidebar />
              </Suspense>
            </div>
            <div className="home-feed-center order-2 flex min-h-0 min-w-0 flex-col lg:col-span-2">
              <Suspense fallback={<NetworkSkeleton />}>
                <NetworkContent query={query} />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
