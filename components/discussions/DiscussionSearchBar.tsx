"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

type DiscussionSearchBarProps = {
  defaultQuery?: string;
};

export default function DiscussionSearchBar({ defaultQuery = "" }: DiscussionSearchBarProps) {
  const t = useT();
  const router = useRouter();
  const inputId = useId();
  const [query, setQuery] = useState(defaultQuery);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/discussions?q=${encodeURIComponent(trimmed)}` : "/discussions");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <label htmlFor={inputId} className="sr-only">
        {t("discussions.searchLabel")}
      </label>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("discussions.searchPlaceholder")}
        className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
      />
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        {t("discussions.searchSubmit")}
      </button>
    </form>
  );
}
