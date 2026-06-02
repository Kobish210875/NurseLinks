import { Suspense } from "react";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import HomeFeed from "@/components/HomeFeed";
import HomeFeedSkeleton from "@/components/home/HomeFeedSkeleton";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getInstitutionActivityForUser } from "@/lib/data/institution-activity";
import { createClient } from "@/lib/supabase/server";

/**
 * All auth + data fetching lives here, inside the Suspense boundary.
 * HomeFeedSkeleton is visible on the client the instant the server
 * starts processing the request — before a single Supabase call starts.
 */
async function HomePageContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }
  const supabase = await createClient();
  const institutionActivity = await getInstitutionActivityForUser(supabase, user.id);
  return <HomeFeed user={user} institutionActivity={institutionActivity} />;
}

/**
 * Sync shell — returns immediately with the skeleton visible.
 * No top-level await means the server sends the page structure
 * (Navbar + HomeFeedSkeleton) as the very first RSC chunk.
 */
export default function HomePage() {
  return (
    <div className="home-page-root flex min-h-screen flex-col max-md:block max-md:min-h-0">
      <Navbar authenticated />
      <main className="home-main-shell min-h-0 flex-1 max-md:block max-md:flex-none">
        <Suspense fallback={<HomeFeedSkeleton />}>
          <HomePageContent />
        </Suspense>
      </main>
      <div className="lg:hidden">
        <Footer />
      </div>
    </div>
  );
}
