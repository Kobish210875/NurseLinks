"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import type { PeopleSearchHit } from "@/lib/data/people-search";
import { formatProfileHeadline } from "@/lib/profile/display-professional";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const DEBOUNCE_MS = 200;
const MOBILE_MAX_WIDTH = 767;
const MIN_SEARCH_CHARS = 2;

type NavPeopleSearchProps = {
  /** Slightly smaller field for the mobile header bar. */
  compact?: boolean;
};

export default function NavPeopleSearch({ compact = false }: NavPeopleSearchProps) {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PeopleSearchHit[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches,
  );

  const isRtl = locale === "he";

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const fetchResults = useCallback(async (q: string, signal: AbortSignal) => {
    const trimmed = q.trim();
    if (!trimmed || trimmed.length < MIN_SEARCH_CHARS) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/people/search?q=${encodeURIComponent(trimmed)}`, {
        signal,
        cache: "no-store",
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
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function goToProfile(id: string) {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    inputRef.current?.blur();
    router.push(`/profile/${id}`);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const trimmed = query.trim();
    if (!isOpen || results.length === 0) {
      if (event.key === "Enter" && trimmed.length >= MIN_SEARCH_CHARS) {
        router.push(`/network?q=${encodeURIComponent(trimmed)}`);
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
      inputRef.current?.blur();
    }
  }

  const trimmedQuery = query.trim();
  const showList = isOpen && trimmedQuery.length >= 1;
  const queryTooShort = trimmedQuery.length > 0 && trimmedQuery.length < MIN_SEARCH_CHARS;

  const listContent = (
    <>
      {queryTooShort ? (
        <li className="px-3 py-2 text-sm text-muted-foreground">{t("nav.searchMinChars")}</li>
      ) : null}
      {!queryTooShort && loading && results.length === 0 ? (
        <li className="px-3 py-2 text-sm text-muted-foreground">{t("nav.searchLoading")}</li>
      ) : null}
      {!queryTooShort && !loading && results.length === 0 ? (
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
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => goToProfile(person.id)}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-start transition hover:bg-muted/60 md:gap-3 ${
                index === activeIndex ? "bg-primary/10" : ""
              }`}
            >
              <span className="flex size-8 shrink-0 overflow-hidden rounded-full border border-border bg-primary/10 md:size-9">
                {person.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={person.avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center text-[10px] font-semibold text-primary md:text-xs">
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
            onClick={() => {
              setIsOpen(false);
              inputRef.current?.blur();
            }}
          >
            {t("nav.searchSeeAll")}
          </Link>
        </li>
      ) : null}
    </>
  );

  // 16px on mobile prevents iOS Safari from zooming the page on input focus.
  const inputTextSize = "text-base md:text-sm";
  const rtlIconClass = compact ? "right-2.5" : "start-3";
  const rtlInputClass = compact
    ? `py-2 pr-9 pl-2.5 ${inputTextSize} text-right placeholder:text-right`
    : `py-2 ps-10 pe-3 ${inputTextSize} text-start placeholder:text-start`;
  const ltrInputClass = compact
    ? `py-2 pe-9 ps-2.5 ${inputTextSize} text-start placeholder:text-start`
    : `py-2 pe-10 ps-3 ${inputTextSize} text-start placeholder:text-start`;

  return (
    <div
      ref={containerRef}
      dir={isRtl ? "rtl" : "ltr"}
      className={`relative z-[1] min-w-0 w-full ${compact ? "" : "flex-1"}`}
    >
      <label className="sr-only" htmlFor="nav-search">
        {t("nav.search")}
      </label>
      <svg
        className={`pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-muted-foreground ${
          isRtl ? rtlIconClass : compact ? "end-2.5 md:end-3" : "end-3"
        }`}
        xmlns="http://www.w3.org/2000/svg"
        width={compact ? 14 : 16}
        height={compact ? 14 : 16}
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
        ref={inputRef}
        id="nav-search"
        type="search"
        enterKeyHint="search"
        value={query}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        dir={isRtl ? "rtl" : "ltr"}
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
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        className={`w-full max-w-full appearance-none rounded-md border border-border bg-white text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15 ${
          isRtl ? rtlInputClass : ltrInputClass
        }`}
      />

      {showList && isMobile ? (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 top-14 z-[90] bg-black/20 md:hidden"
            onClick={() => {
              setIsOpen(false);
              setActiveIndex(-1);
            }}
          />
          <ul
            id={listId}
            role="listbox"
            className="fixed inset-x-3 top-14 z-[95] max-h-[min(50vh,20rem)] overflow-y-auto rounded-lg border border-border bg-white py-1 text-start shadow-lg md:hidden"
            dir={isRtl ? "rtl" : "ltr"}
          >
            {listContent}
          </ul>
        </>
      ) : null}

      {showList && !isMobile ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute start-0 end-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-border bg-white py-1 text-start shadow-lg"
          dir={isRtl ? "rtl" : "ltr"}
        >
          {listContent}
        </ul>
      ) : null}
    </div>
  );
}
