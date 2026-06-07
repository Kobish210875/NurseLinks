import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function InstitutionsLoading() {
  return (
    <>
      <Navbar authenticated />
      <div className="home-page-root flex min-h-screen flex-col max-md:block max-md:min-h-0 md:hidden">
        <main className="home-main-shell feed-page min-h-0 flex-1 max-md:block max-md:flex-none">
          <div className="mx-auto w-full min-w-0 max-w-[1240px] px-3 py-3 sm:px-4">
            <div className="feed-card h-[min(70vh,32rem)] motion-safe:animate-pulse" aria-hidden="true" />
            <div className="mobile-feed-bottom-spacer" aria-hidden="true" />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
