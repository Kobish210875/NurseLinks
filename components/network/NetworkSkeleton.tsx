export default function NetworkSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {/* Search card */}
      <div className="feed-card space-y-3 p-3 sm:p-4">
        <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="h-3 w-48 animate-pulse rounded bg-muted/60" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Tab bar */}
      <div className="feed-card grid grid-cols-2 gap-1 p-1">
        <div className="h-9 animate-pulse rounded-lg bg-primary/20" />
        <div className="h-9 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Members list */}
      <div className="feed-card p-3 sm:p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="h-3 w-12 animate-pulse rounded bg-muted/60" />
        </div>
        <ul className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <li key={i} className="flex items-center gap-3">
              <div className="size-11 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-44 animate-pulse rounded bg-muted/60" />
              </div>
              <div className="h-7 w-16 shrink-0 animate-pulse rounded-full bg-muted" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
