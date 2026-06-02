export default function HomeFeedSkeleton() {
  return (
    <div className="space-y-4 motion-safe:animate-pulse">
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="h-12 rounded-xl bg-muted/70" />
      </div>
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="space-y-3">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-16 rounded-xl bg-muted/70" />
          <div className="h-16 rounded-xl bg-muted/70" />
        </div>
      </div>
    </div>
  );
}
