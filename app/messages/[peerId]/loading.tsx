import PageLoadingShell from "@/components/ui/PageLoadingShell";

export default function MessageThreadLoading() {
  return (
    <main className="feed-page min-h-0 py-4 md:py-6">
      <div className="mx-auto max-w-2xl px-3 sm:px-4">
        <PageLoadingShell />
      </div>
    </main>
  );
}
