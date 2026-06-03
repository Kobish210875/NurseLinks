export default function NetworkSidebarSkeleton() {
  return (
    <div className="flex flex-col gap-4 motion-safe:animate-pulse" aria-hidden="true">
      <div className="h-52 rounded-2xl border bg-card" />
      <div className="h-24 rounded-2xl border bg-card" />
      <div className="h-28 rounded-2xl border bg-card" />
    </div>
  );
}
