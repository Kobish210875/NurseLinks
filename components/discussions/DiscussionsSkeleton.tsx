export default function DiscussionsSkeleton() {
  return (
    <>
      <div className="flex animate-pulse flex-col gap-3 lg:hidden">
        <div className="h-11 rounded-lg bg-muted" />
        <div className="h-16 rounded-lg bg-muted" />
        <div className="h-40 rounded-lg bg-muted" />
      </div>

      <aside className="order-1 hidden space-y-4 lg:col-start-1 lg:row-start-1 lg:block">
        <div className="h-11 rounded-lg bg-muted" />
        <div className="h-72 rounded-2xl bg-muted" />
      </aside>
      <section className="order-2 hidden lg:col-span-2 lg:col-start-2 lg:row-start-1 lg:block">
        <div className="h-[min(28rem,calc(100dvh-12rem))] min-h-[12rem] animate-pulse rounded-lg border border-border bg-muted/40 lg:h-full lg:min-h-0" />
      </section>
    </>
  );
}
