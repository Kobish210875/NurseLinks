export default function DiscussionsSkeleton() {
  return (
    <>
      <aside className="order-1 space-y-4 lg:col-start-1 lg:row-start-1">
        <div className="h-11 rounded-lg bg-muted" />
        <div className="h-72 rounded-2xl bg-muted" />
      </aside>
      <section className="order-2 lg:col-span-2 lg:col-start-2 lg:row-start-1">
        <div className="h-[min(28rem,calc(100dvh-12rem))] min-h-[12rem] animate-pulse rounded-lg border border-border bg-muted/40 lg:h-full lg:min-h-0" />
      </section>
    </>
  );
}
