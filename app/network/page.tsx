import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import NetworkPanel from "@/components/network/NetworkPanel";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getAcceptedConnections,
  getPendingInvitations,
  searchPeople,
} from "@/lib/data/connections";
import { createClient } from "@/lib/supabase/server";

type NetworkPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function NetworkPage({ searchParams }: NetworkPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const supabase = await createClient();

  const [connections, invitations, searchResults] = await Promise.all([
    getAcceptedConnections(supabase, user.id),
    getPendingInvitations(supabase, user.id),
    query.length >= 2 ? searchPeople(supabase, user.id, query) : Promise.resolve([]),
  ]);

  return (
    <>
      <Navbar authenticated />
      <main className="feed-page min-h-[calc(100vh-4rem)] py-4 md:py-6">
        <div className="mx-auto w-full max-w-2xl px-3 md:max-w-xl md:px-4 lg:max-w-lg">
          <NetworkPanel
            connections={connections}
            invitations={invitations}
            initialQuery={query}
            searchResults={searchResults}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
