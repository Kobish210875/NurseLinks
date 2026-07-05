import Link from "next/link";
import type { DiscussionThreadSummary } from "@/lib/data/discussions";

type DiscussionListProps = {
  threads: DiscussionThreadSummary[];
  emptyLabel: string;
  searchEmptyLabel?: string;
  repliesLabel: (count: number) => string;
  isSearchActive?: boolean;
};

export default function DiscussionList({
  threads,
  emptyLabel,
  searchEmptyLabel,
  repliesLabel,
  isSearchActive = false,
}: DiscussionListProps) {
  if (threads.length === 0) {
    return (
      <div className="border-dashed border-border bg-white px-3 py-6 text-center text-sm text-muted-foreground max-lg:rounded-lg max-lg:border">
        {isSearchActive && searchEmptyLabel ? searchEmptyLabel : emptyLabel}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border bg-white max-lg:overflow-hidden max-lg:rounded-lg max-lg:border lg:border-0">
      {threads.map((thread) => (
        <li key={thread.id}>
          <Link
            href={`/discussions/${thread.id}`}
            className="block px-3 py-2.5 transition hover:bg-muted/40"
          >
            <div className="flex min-w-0 items-baseline justify-between gap-2">
              <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                {thread.title}
              </h3>
              <time className="shrink-0 text-xs text-muted-foreground">{thread.timeLabel}</time>
            </div>
            <div className="mt-0.5 flex min-w-0 items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="truncate">{thread.author.name}</span>
              <span className="shrink-0">{repliesLabel(thread.replyCount)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
