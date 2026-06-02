export default function JobsBrowseSkeleton() {
  return (
    <div className="jobs-browse-grid flex min-h-0 min-w-0 flex-1 flex-col gap-4 lg:grid lg:grid-cols-2 lg:grid-rows-1 lg:items-stretch lg:gap-4 lg:overflow-hidden lg:max-h-[calc(100dvh-11rem)]">
      <div className="jobs-browse-feed order-2 flex min-w-0 flex-col max-md:overflow-visible lg:order-1 lg:min-h-0 lg:overflow-hidden">
        <div className="h-full rounded-2xl border bg-card p-4 shadow-sm">
          <div className="space-y-4 motion-safe:animate-pulse">
            <div className="h-5 w-40 rounded bg-muted" />
            <div className="h-16 rounded-xl bg-muted/70" />
            <div className="h-16 rounded-xl bg-muted/70" />
            <div className="h-16 rounded-xl bg-muted/70" />
          </div>
        </div>
      </div>
      <aside className="jobs-browse-search order-1 flex min-h-0 min-w-0 flex-col lg:order-2 lg:min-h-0">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="space-y-3 motion-safe:animate-pulse">
            <div className="h-5 w-44 rounded bg-muted" />
            <div className="h-10 rounded-lg bg-muted/70" />
            <div className="h-10 rounded-lg bg-muted/70" />
            <div className="h-10 rounded-lg bg-muted/70" />
            <div className="h-10 w-32 rounded-lg bg-muted" />
          </div>
        </div>
      </aside>
    </div>
  );
}
