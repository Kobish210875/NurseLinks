"use client";

import { createDiscussionThread } from "@/app/actions/discussions";
import AnonymousFields from "@/components/discussions/AnonymousFields";
import { useT } from "@/components/i18n/LocaleProvider";
import { useState, useTransition } from "react";

type DiscussionComposerProps = {
  collapsible?: boolean;
};

export default function DiscussionComposer({ collapsible = false }: DiscussionComposerProps) {
  const t = useT();
  const [expanded, setExpanded] = useState(!collapsible);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonymousLabel, setAnonymousLabel] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await createDiscussionThread(formData);
      if (result?.error === "not-configured") {
        setError(t("discussions.notConfigured"));
        return;
      }
      if (result?.error === "suspended") {
        setError(t("discussions.suspended"));
        return;
      }
      if (result?.error) {
        setError(t("discussions.createFailed"));
      }
    });
  }

  if (collapsible && !expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full rounded-lg border border-border bg-white px-3 py-3 text-start shadow-sm transition hover:border-primary/30 hover:bg-muted/20"
        aria-expanded={false}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-foreground">{t("discussions.startThread")}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-muted-foreground"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("discussions.composerTeaser")}</p>
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-4 shadow-sm lg:rounded-2xl">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-foreground">{t("discussions.startThread")}</h2>
        {collapsible ? (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
            aria-expanded={true}
          >
            {t("discussions.collapseComposer")}
          </button>
        ) : null}
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="discussion-title" className="mb-1 block text-sm font-medium text-foreground">
            {t("discussions.titleLabel")}
          </label>
          <input
            id="discussion-title"
            name="title"
            type="text"
            required
            maxLength={200}
            placeholder={t("discussions.titlePlaceholder")}
            className="w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary/40"
          />
        </div>

        <div>
          <label htmlFor="discussion-body" className="mb-1 block text-sm font-medium text-foreground">
            {t("discussions.bodyLabel")}
          </label>
          <textarea
            id="discussion-body"
            name="body"
            required
            rows={4}
            maxLength={4000}
            placeholder={t("discussions.bodyPlaceholder")}
            className="w-full resize-y rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary/40"
          />
        </div>

        <AnonymousFields
          idPrefix="new-thread"
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
          disabled={pending}
          className="btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {pending ? t("discussions.posting") : t("discussions.publishThread")}
        </button>
      </form>
    </section>
  );
}
