"use client";

import {
  deleteDiscussionReply,
  deleteDiscussionThread,
} from "@/app/actions/discussions";
import { useT } from "@/components/i18n/LocaleProvider";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type DiscussionDeleteButtonProps = {
  kind: "thread" | "reply";
  id: string;
  threadId: string;
  compact?: boolean;
};

export default function DiscussionDeleteButton({
  kind,
  id,
  threadId,
  compact = false,
}: DiscussionDeleteButtonProps) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const confirmMessage =
      kind === "thread" ? t("discussions.deleteThreadConfirm") : t("discussions.deleteReplyConfirm");
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result =
        kind === "thread"
          ? await deleteDiscussionThread(threadId)
          : await deleteDiscussionReply(threadId, id);

      if (result?.error === "forbidden") {
        setError(t("discussions.deleteForbidden"));
        return;
      }
      if (result?.error) {
        setError(t("discussions.deleteFailed"));
        return;
      }

      if (kind === "thread") {
        router.push("/discussions");
        router.refresh();
        return;
      }

      router.refresh();
    });
  }

  return (
    <span className={compact ? "inline-flex shrink-0" : "inline-flex"}>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={
          compact
            ? "rounded px-1.5 py-0.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            : "rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
        }
        aria-label={t("post.adminDelete")}
      >
        {pending ? "…" : t("post.adminDelete")}
      </button>
      {error ? (
        <span className="sr-only" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}
