import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import HomeFeed from "@/components/HomeFeed";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="home-page-root flex min-h-screen flex-col">
      <Navbar authenticated />
      <main className="home-main-shell min-h-0 flex-1">
        <HomeFeed user={user} />
      </main>
      <div className="lg:hidden">
        <Footer />
      </div>
    </div>
  );
}
