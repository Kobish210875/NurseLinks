import Footer from "@/components/Footer";
import HomeFeedSkeleton from "@/components/home/HomeFeedSkeleton";
import Navbar from "@/components/Navbar";

export default function HomeLoading() {
  return (
    <div className="home-page-root flex min-h-screen flex-col max-md:block max-md:min-h-0">
      <Navbar authenticated />
      <main className="home-main-shell min-h-0 flex-1 max-md:block max-md:flex-none">
        <HomeFeedSkeleton />
      </main>
      <div className="lg:hidden">
        <Footer />
      </div>
    </div>
  );
}
