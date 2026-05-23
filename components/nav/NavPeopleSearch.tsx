"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/components/i18n/LocaleProvider";
import type { PeopleSearchHit } from "@/lib/data/people-search";
import { formatProfileHeadline } from "@/lib/profile/display-professional";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const DEBOUNCE_MS = 200;

export default function NavPeopleSearch() {
  const t = useT();
  const router = useRouter();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PeopleSearchHit[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const fetchResults = useCallback(async (q: string, signal: AbortSignal) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/people/search?q=${encodeURIComponent(trimmed)}`, {
        signal,
      });
      if (!res.ok) {
        setResults([]);
        return;
      }
      const data = (await res.json()) as { results: PeopleSearchHit[] };
      setResults(data.results ?? []);
    } catch {
      if (!signal.aborted) {
        setResults([]);
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetchResults(query, controller.signal);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, fetchResults]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function goToProfile(id: string) {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/profile/${id}`);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || results.length === 0) {
      if (event.key === "Enter" && query.trim().length >= 1) {
        router.push(`/network?q=${encodeURIComponent(query.trim())}`);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    }
    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      goToProfile(results[activeIndex].id);
    }
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  const showList = isOpen && query.trim().length >= 1;

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1">
      <label className="sr-only" htmlFor="nav-search">
        {t("nav.search")}
      </label>
      <svg
        className="pointer-events-none absolute top-1/2 end-3 z-10 -translate-y-1/2 text-muted-foreground"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        id="nav-search"
        type="search"
        value={query}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder={t("nav.searchPlaceholder")}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          if (query.trim()) {
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        className="w-full rounded-md border border-border bg-white py-2 pe-10 ps-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
      />

      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute start-0 end-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-border bg-white py-1 shadow-lg"
        >
          {loading && results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">{t("nav.searchLoading")}</li>
          ) : null}
          {!loading && results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">{t("nav.searchEmpty")}</li>
          ) : null}
          {results.map((person, index) => {
            const subtitle = formatProfileHeadline(
              person.headline,
              person.workplaceInstitutionSlug,
              t("profile.institutionOther"),
            );
            return (
              <li key={person.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => goToProfile(person.id)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-start transition hover:bg-muted/60 ${
                    index === activeIndex ? "bg-primary/10" : ""
                  }`}
                >
                  <span className="flex size-9 shrink-0 overflow-hidden rounded-full border border-border bg-primary/10">
                    {person.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={person.avatarUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="flex size-full items-center justify-center text-xs font-semibold text-primary">
                        {person.initials}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {person.fullName}
                    </span>
                    {subtitle ? (
                      <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
          {results.length > 0 ? (
            <li className="border-t border-border px-3 py-2">
              <Link
                href={`/network?q=${encodeURIComponent(query.trim())}`}
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => setIsOpen(false)}
              >
                {t("nav.searchSeeAll")}
              </Link>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
