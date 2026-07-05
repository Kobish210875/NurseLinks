import DiscussionsSkeleton from "@/components/discussions/DiscussionsSkeleton";

export default function DiscussionsLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-3 py-6 sm:px-4">
      <DiscussionsSkeleton />
    </div>
  );
}
