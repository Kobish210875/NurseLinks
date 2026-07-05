export default function DiscussionsSkeleton() {
  return (
    <div className="grid animate-pulse gap-4 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:gap-6">
      <aside className="space-y-4">
        <div className="h-11 rounded-lg bg-muted" />
        <div className="h-72 rounded-2xl bg-muted" />
      </aside>
      <section className="space-y-2">
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="h-32 rounded-lg bg-muted" />
      </section>
    </div>
  );
}
