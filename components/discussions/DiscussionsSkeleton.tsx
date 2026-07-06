export default function DiscussionsSkeleton() {
  return (
    <div className="grid min-h-0 flex-1 animate-pulse gap-4 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:items-stretch lg:gap-6">
      <aside className="space-y-4">
        <div className="hidden h-10 rounded bg-muted lg:block" />
        <div className="h-11 rounded-lg bg-muted" />
        <div className="h-72 rounded-2xl bg-muted" />
      </aside>
      <section className="min-h-0 flex-1">
        <div className="h-full min-h-[12rem] rounded-lg border border-border bg-muted/40 lg:max-h-[calc(100dvh-4.5rem)] lg:min-h-0" />
      </section>
    </div>
  );
}
