import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import NetworkSidebarSkeleton from "@/components/network/NetworkSidebarSkeleton";
import NetworkSkeleton from "@/components/network/NetworkSkeleton";

export default function NetworkLoading() {
  return (
    <>
      <Navbar authenticated />
      <main className="feed-page home-feed-shell min-h-0 w-full min-w-0 max-w-[100vw] overflow-x-clip py-3 md:min-h-[calc(100vh-4rem)] md:py-6 lg:py-4">
        <div className="mx-auto flex w-full min-w-0 max-w-[1240px] flex-col px-3 sm:px-4">
          <header className="mb-4 shrink-0 min-w-0 text-start">
            <div className="h-7 w-36 rounded bg-muted motion-safe:animate-pulse" />
          </header>
          <div className="home-feed-grid grid w-full grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)_260px] lg:items-start lg:gap-6">
            <div className="home-feed-sidebar order-1 hidden lg:block">
              <NetworkSidebarSkeleton />
            </div>
            <div className="home-feed-center order-2 min-w-0 lg:col-span-2">
              <NetworkSkeleton />
            </div>
          </div>
        </div>
      </main>
      <div className="lg:hidden">
        <Footer />
      </div>
    </>
  );
}
