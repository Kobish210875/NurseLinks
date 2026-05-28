import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import NetworkPanel from "@/components/network/NetworkPanel";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getNetworkPageData } from "@/lib/data/connections";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";
import { createClient } from "@/lib/supabase/server";

type NetworkPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function NetworkPage({ searchParams }: NetworkPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const locale = await getLocale();
  const t = createT(getMessages(locale));
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const supabase = await createClient();

  const { connections, invitations, searchResults, recommendations } = await getNetworkPageData(
    supabase,
    user.id,
    query,
  );

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
          <NetworkPanel
            connections={connections}
            invitations={invitations}
            initialQuery={query}
            recommendations={recommendations}
            searchResults={searchResults}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
