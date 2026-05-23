"use client";

import Link from "next/link";
import { sendDirectMessage } from "@/app/actions/messages";
import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import { formatFeedTimestamp } from "@/lib/i18n/format-feed-time";
import type { DirectMessage, NetworkMember } from "@/lib/network/types";
import { formatProfileHeadline } from "@/lib/profile/display-professional";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type MessageThreadViewProps = {
  peer: NetworkMember;
  messages: DirectMessage[];
};

export default function MessageThreadView({ peer, messages }: MessageThreadViewProps) {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const canMessage = peer.connectionStatus === "connected";
  const professionalLine = formatProfileHeadline(
    peer.headline,
    peer.workplaceInstitutionSlug,
    t("profile.institutionOther"),
  );

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await sendDirectMessage(peer.id, formData);
      if (res?.error === "not-connected" || res?.error === "send-blocked") {
        setError(t("messages.notConnected"));
        return;
      }
      if (res?.error === "messaging-not-configured") {
        setError(t("messages.notConfigured"));
        return;
      }
      if (res?.error) {
        setError(t("messages.sendFailed"));
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="feed-card flex min-h-[480px] flex-col overflow-hidden">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link
          href="/messages"
          className="text-sm font-medium text-primary hover:underline"
        >
          {t("messages.back")}
        </Link>
        <span className="flex size-10 overflow-hidden rounded-full border border-border bg-primary/10">
          {peer.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={peer.avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-xs font-semibold text-primary">
              {peer.initials}
            </span>
          )}
        </span>
        <div className="min-w-0 text-start">
          <Link
            href={`/profile/${peer.id}`}
            className="font-semibold text-foreground hover:text-primary hover:underline"
          >
            {peer.fullName}
          </Link>
          {professionalLine ? (
            <p className="truncate text-xs text-muted-foreground">{professionalLine}</p>
          ) : null}
        </div>
      </header>

      {!canMessage ? (
        <p className="p-4 text-sm text-muted-foreground">{t("messages.notConnected")}</p>
      ) : (
        <>
          <ul className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <li className="text-center text-sm text-muted-foreground">
                {t("messages.threadEmpty")}
              </li>
            ) : (
              messages.map((m) => (
                <li
                  key={m.id}
                  className={`flex ${m.isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      m.isMine
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <time
                      className={`mt-1 block text-[10px] ${
                        m.isMine ? "text-primary-foreground/80" : "text-muted-foreground"
                      }`}
                      dateTime={m.createdAt}
                    >
                      {formatFeedTimestamp(m.createdAt, locale)}
                    </time>
                  </div>
                </li>
              ))
            )}
          </ul>

          <form action={submit} className="border-t border-border p-4">
            <label className="sr-only" htmlFor="message-body">
              {t("messages.inputLabel")}
            </label>
            <textarea
              id="message-body"
              name="body"
              rows={3}
              maxLength={4000}
              disabled={pending}
              placeholder={t("messages.inputPlaceholder")}
              className="w-full resize-y rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
            />
            {error ? (
              <p className="mt-2 text-xs text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
              >
                {pending ? "..." : t("messages.send")}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
