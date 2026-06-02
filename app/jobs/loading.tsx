import Footer from "@/components/Footer";
import JobsBrowseSkeleton from "@/components/jobs/JobsBrowseSkeleton";
import Navbar from "@/components/Navbar";

export default function JobsLoading() {
  return (
    <div className="home-page-root flex min-h-screen flex-col max-md:block max-md:min-h-0">
      <Navbar authenticated />
      <main className="home-main-shell feed-page min-h-0 w-full min-w-0 max-w-[100vw] overflow-hidden py-4 max-md:block max-md:flex-none max-md:overflow-x-clip max-md:pb-[calc(var(--mobile-bottom-nav-offset)+1.75rem)] md:py-6">
        <div className="mx-auto flex h-full w-full min-w-0 max-w-2xl flex-col space-y-4 overflow-hidden px-3 sm:px-4 max-md:block max-md:h-auto max-md:overflow-x-clip max-md:pb-[calc(var(--mobile-bottom-nav-offset)+1.5rem)] lg:max-w-5xl">
          <header className="shrink-0 min-w-0 text-start">
            <div className="h-7 w-32 rounded bg-muted motion-safe:animate-pulse" />
          </header>
          <div className="h-11 rounded-2xl border bg-card motion-safe:animate-pulse" />
          <JobsBrowseSkeleton />
          <div className="mobile-feed-bottom-spacer md:hidden" aria-hidden="true" />
        </div>
      </main>
      <div className="lg:hidden">
        <Footer />
      </div>
    </div>
  );
}
