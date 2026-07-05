"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";

type DiscussionSearchBarProps = {
  defaultQuery?: string;
};

export default function DiscussionSearchBar({ defaultQuery = "" }: DiscussionSearchBarProps) {
  const t = useT();
  const router = useRouter();
  const inputId = useId();
  const [query, setQuery] = useState(defaultQuery);
  const isSearchActive = defaultQuery.trim().length > 0;

  useEffect(() => {
    setQuery(defaultQuery);
  }, [defaultQuery]);

  function navigateToSearch(nextQuery: string) {
    const trimmed = nextQuery.trim();
    router.push(trimmed ? `/discussions?q=${encodeURIComponent(trimmed)}` : "/discussions");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigateToSearch(query);
  }

  function handleClear() {
    setQuery("");
    router.push("/discussions");
  }

  return (
    <div className="space-y-2">
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
        {query.trim().length > 0 ? (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
          >
            {t("discussions.clearSearchShort")}
          </button>
        ) : null}
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          {t("discussions.searchSubmit")}
        </button>
      </form>
      {isSearchActive ? (
        <Link
          href="/discussions"
          className="inline-block text-sm font-medium text-primary hover:text-primary/80"
        >
          {t("discussions.clearSearch")}
        </Link>
      ) : null}
    </div>
  );
}
