import { Suspense } from "react";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import NetworkPanel from "@/components/network/NetworkPanel";
import NetworkSkeleton from "@/components/network/NetworkSkeleton";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getNetworkPageData } from "@/lib/data/connections";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";
import { createClient } from "@/lib/supabase/server";

type NetworkPageProps = {
  searchParams: Promise<{ q?: string }>;
};

/**
 * Auth check + data fetch live here, inside the Suspense boundary.
 * NetworkSkeleton is already visible on the client while this awaits.
 */
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

/**
 * Page shell — only awaits getLocale() and searchParams, both resolve
 * in <1 ms (cookie read + routing data). The Navbar + heading + skeleton
 * are sent as the first RSC chunk before any Supabase call starts.
 */
export default async function NetworkPage({ searchParams }: NetworkPageProps) {
  const [locale, params] = await Promise.all([getLocale(), searchParams]);
  const t = createT(getMessages(locale));
  const query = typeof params.q === "string" ? params.q.trim() : "";

  return (
    <>
      <Navbar authenticated />
      <main className="feed-page min-h-0 w-full min-w-0 max-w-[100vw] overflow-x-clip py-4 md:min-h-[calc(100vh-4rem)] md:py-6">
        <div className="mx-auto w-full min-w-0 max-w-2xl space-y-4 overflow-x-clip px-3 sm:px-4">
          <header className="min-w-0 text-start">
            <h1 className="break-words text-lg font-bold text-foreground sm:text-xl">
              {t("network.title")}
            </h1>
          </header>
          <Suspense fallback={<NetworkSkeleton />}>
            <NetworkContent query={query} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
