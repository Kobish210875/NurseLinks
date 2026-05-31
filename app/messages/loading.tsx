import PageLoadingShell from "@/components/ui/PageLoadingShell";

export default function MessagesLoading() {
  return (
    <div className="home-page-root flex min-h-screen flex-col max-md:block max-md:min-h-0">
      <main className="home-main-shell min-h-0 flex-1 max-md:block max-md:flex-none">
        <PageLoadingShell />
      </main>
    </div>
  );
}
