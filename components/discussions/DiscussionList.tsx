import Link from "next/link";
import type { DiscussionThreadSummary } from "@/lib/data/discussions";

type DiscussionListProps = {
  threads: DiscussionThreadSummary[];
  emptyLabel: string;
  repliesLabel: (count: number) => string;
};

export default function DiscussionList({ threads, emptyLabel, repliesLabel }: DiscussionListProps) {
  if (threads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white px-4 py-10 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {threads.map((thread) => (
        <li key={thread.id}>
          <Link
            href={`/discussions/${thread.id}`}
            className="block rounded-2xl border border-border bg-white p-4 shadow-sm transition hover:border-primary/25 hover:shadow-md"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="min-w-0 flex-1 text-base font-bold text-foreground">{thread.title}</h3>
              <time className="shrink-0 text-xs text-muted-foreground">{thread.timeLabel}</time>
            </div>
            <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {thread.bodyPreview}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{thread.author.name}</span>
              <span>{repliesLabel(thread.replyCount)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
