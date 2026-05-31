/** Instant skeleton while a server page loads (shown via loading.tsx). */
export default function PageLoadingShell() {
  return (
    <div className="feed-page mx-auto w-full max-w-[1128px] animate-pulse px-3 py-4 sm:px-4 md:py-6">
      <div className="feed-card mb-4 h-24" />
      <div className="space-y-4">
        <div className="feed-card h-40" />
        <div className="feed-card h-40" />
        <div className="feed-card h-32" />
      </div>
    </div>
  );
}
