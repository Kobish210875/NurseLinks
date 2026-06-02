import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import NetworkSkeleton from "@/components/network/NetworkSkeleton";

export default function NetworkLoading() {
  return (
    <>
      <Navbar authenticated />
      <main className="feed-page min-h-0 w-full min-w-0 max-w-[100vw] overflow-x-clip py-4 md:min-h-[calc(100vh-4rem)] md:py-6">
        <div className="mx-auto w-full min-w-0 max-w-2xl space-y-4 overflow-x-clip px-3 sm:px-4">
          <header className="min-w-0 text-start">
            <div className="h-7 w-36 rounded bg-muted motion-safe:animate-pulse" />
          </header>
          <NetworkSkeleton />
        </div>
      </main>
      <Footer />
    </>
  );
}
