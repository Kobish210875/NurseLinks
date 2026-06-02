export default function ProfilePageSkeleton() {
  return (
    <main className="mx-auto max-w-[1128px] space-y-6 px-4 py-8">
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="space-y-4 motion-safe:animate-pulse">
          <div className="h-6 w-36 rounded bg-muted" />
          <div className="h-10 rounded-lg bg-muted/70" />
          <div className="h-10 rounded-lg bg-muted/70" />
          <div className="h-10 rounded-lg bg-muted/70" />
          <div className="h-10 w-32 rounded-lg bg-muted" />
        </div>
      </div>
      <div className="rounded-2xl border bg-card p-5 shadow-sm motion-safe:animate-pulse">
        <div className="h-5 w-40 rounded bg-muted" />
      </div>
      <div className="rounded-2xl border bg-card p-5 shadow-sm motion-safe:animate-pulse">
        <div className="h-5 w-44 rounded bg-muted" />
      </div>
    </main>
  );
}
