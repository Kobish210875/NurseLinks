import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import HomeFeed from "@/components/HomeFeed";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getInstitutionActivityForUser } from "@/lib/data/institution-activity";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const supabase = await createClient();
  const institutionActivity = await getInstitutionActivityForUser(supabase, user.id);

  return (
    <div className="home-page-root flex min-h-screen flex-col max-md:block max-md:min-h-0">
      <Navbar authenticated />
      <main className="home-main-shell min-h-0 flex-1 max-md:block max-md:flex-none">
        <HomeFeed user={user} institutionActivity={institutionActivity} />
      </main>
      <div className="lg:hidden">
        <Footer />
      </div>
    </div>
  );
}
