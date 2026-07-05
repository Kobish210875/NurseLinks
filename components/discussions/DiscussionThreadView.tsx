"use client";

import { createDiscussionReply } from "@/app/actions/discussions";
import AnonymousFields from "@/components/discussions/AnonymousFields";
import LinkifiedText from "@/components/ui/LinkifiedText";
import { useT } from "@/components/i18n/LocaleProvider";
import type { DiscussionThreadDetail } from "@/lib/data/discussions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type DiscussionThreadViewProps = {
  thread: DiscussionThreadDetail;
};

function AuthorBadge({
  name,
  avatarUrl,
  initials,
  profileHref,
  timeLabel,
}: {
  name: string;
  avatarUrl: string | null;
  initials: string;
  profileHref: string | null;
  timeLabel: string;
}) {
  const avatar = (
    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/10 text-xs font-semibold text-primary">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );

  return (
    <div className="flex items-center gap-2">
      {profileHref ? <Link href={profileHref}>{avatar}</Link> : avatar}
      <div className="min-w-0">
        {profileHref ? (
          <Link href={profileHref} className="block truncate text-sm font-semibold text-foreground hover:text-primary">
            {name}
          </Link>
        ) : (
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        )}
        <time className="text-xs text-muted-foreground">{timeLabel}</time>
      </div>
    </div>
  );
}

export default function DiscussionThreadView({ thread }: DiscussionThreadViewProps) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonymousLabel, setAnonymousLabel] = useState("");

  function handleReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await createDiscussionReply(thread.id, formData);
      if (result?.error === "not-configured") {
        setError(t("discussions.notConfigured"));
        return;
      }
      if (result?.error === "suspended") {
        setError(t("discussions.suspended"));
        return;
      }
      if (result?.error) {
        setError(t("discussions.replyFailed"));
        return;
      }
      setBody("");
      setIsAnonymous(false);
      setAnonymousLabel("");
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <article className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <header className="mb-3 border-b border-border pb-3">
          <h1 className="mb-3 break-words text-xl font-bold text-foreground">{thread.title}</h1>
          <AuthorBadge
            name={thread.author.name}
            avatarUrl={thread.author.avatarUrl}
            initials={thread.author.initials}
            profileHref={thread.author.profileHref}
            timeLabel={thread.timeLabel}
          />
        </header>
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
          <LinkifiedText text={thread.body} />
        </div>
      </article>

      <section className="min-h-0 flex-1 space-y-3">
        <h2 className="px-1 text-sm font-semibold text-muted-foreground">
          {t("discussions.repliesHeading").replace("{count}", String(thread.replies.length))}
        </h2>

        {thread.replies.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted-foreground">
            {t("discussions.noRepliesYet")}
          </p>
        ) : (
          <ul className="space-y-3">
            {thread.replies.map((reply) => (
              <li
                key={reply.id}
                className={`rounded-2xl border bg-white p-4 shadow-sm ${
                  reply.isMine ? "border-primary/25" : "border-border"
                }`}
              >
                <div className="mb-2">
                  <AuthorBadge
                    name={reply.author.name}
                    avatarUrl={reply.author.avatarUrl}
                    initials={reply.author.initials}
                    profileHref={reply.author.profileHref}
                    timeLabel={reply.timeLabel}
                  />
                </div>
                <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                  <LinkifiedText text={reply.body} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="sticky bottom-[calc(var(--mobile-bottom-nav-height,0px)+env(safe-area-inset-bottom))] rounded-2xl border border-border bg-white p-4 shadow-lg md:static md:shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t("discussions.addReply")}</h2>
        <form onSubmit={handleReply} className="space-y-3">
          <textarea
            name="body"
            required
            rows={3}
            maxLength={4000}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={t("discussions.replyPlaceholder")}
            className="w-full resize-y rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary/40"
          />

          <AnonymousFields
            idPrefix={`reply-${thread.id}`}
            isAnonymous={isAnonymous}
            onAnonymousChange={setIsAnonymous}
            anonymousLabel={anonymousLabel}
            onAnonymousLabelChange={setAnonymousLabel}
          />

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending || body.trim().length === 0}
            className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {pending ? t("discussions.posting") : t("discussions.publishReply")}
          </button>
        </form>
      </section>
    </div>
  );
}
