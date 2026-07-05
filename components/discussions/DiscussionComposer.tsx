"use client";

import { createDiscussionThread } from "@/app/actions/discussions";
import AnonymousFields from "@/components/discussions/AnonymousFields";
import { useT } from "@/components/i18n/LocaleProvider";
import { useState, useTransition } from "react";

export default function DiscussionComposer() {
  const t = useT();
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

  return (
    <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-bold text-foreground">{t("discussions.startThread")}</h2>
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
