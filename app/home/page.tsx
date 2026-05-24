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
    <>
      <Navbar authenticated />
      <main className="home-main-shell lg:h-[calc(100vh-3.5rem)] lg:overflow-hidden">
        <HomeFeed user={user} />
      </main>
      <div className="lg:hidden">
        <Footer />
      </div>
    </>
  );
}
