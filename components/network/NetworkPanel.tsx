"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import NavUnreadDot from "@/components/nav/NavUnreadDot";
import type { NetworkMember } from "@/lib/network/types";
import MemberRow from "./MemberRow";

type NetworkPanelProps = {
  connections: NetworkMember[];
  invitations: NetworkMember[];
  initialQuery?: string;
  searchResults: NetworkMember[];
};

export default function NetworkPanel({
  connections,
  invitations,
  initialQuery = "",
  searchResults,
}: NetworkPanelProps) {
  const t = useT();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    const trimmed = query.trim();
    const timeout = window.setTimeout(() => {
      if (trimmed.length >= 2) {
        router.replace(`/network?q=${encodeURIComponent(trimmed)}`);
      } else if (initialQuery) {
        router.replace("/network");
      }
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [query, initialQuery, router]);
  const [tab, setTab] = useState<"connections" | "invitations">(
    invitations.length > 0 ? "invitations" : "connections",
  );

  const filteredConnections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return connections;
    }
    return connections.filter((m) => m.fullName.toLowerCase().includes(q));
  }, [connections, query]);

  const showSearch = query.trim().length >= 2;

  return (
    <div className="network-page-card feed-card overflow-hidden">
      <header className="network-page-hero border-b border-border/60 px-5 py-6 text-start md:px-8 md:py-7 lg:px-10 lg:py-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {t("network.title")}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          {t("network.subtitle")}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 md:mt-5">
          <span className="network-stat-pill">
            {t("network.count").replace("{count}", String(connections.length))}
          </span>
          {invitations.length > 0 ? (
            <span className="network-stat-pill network-stat-pill--accent">
              {t("network.pendingCount").replace("{count}", String(invitations.length))}
            </span>
          ) : null}
        </div>
      </header>

      <div className="px-5 py-5 md:px-8 md:py-6 lg:px-10 lg:py-7">
        <label className="sr-only" htmlFor="network-search">
          {t("network.searchLabel")}
        </label>
        <div className="relative mb-5 md:mb-6">
          <svg
            className="pointer-events-none absolute top-1/2 end-3 size-4 -translate-y-1/2 text-muted-foreground md:end-4 md:size-5"
            xmlns="http://www.w3.org/2000/svg"
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
            id="network-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("network.searchPlaceholder")}
            className="w-full rounded-xl border border-border bg-white py-2.5 pe-11 ps-3.5 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15 md:py-3 md:text-base md:pe-12"
          />
        </div>

        {showSearch ? (
          <section className="mb-5 text-start md:mb-6">
            <h2 className="mb-2 text-sm font-semibold text-foreground md:text-base">
              {t("network.searchResults")}
            </h2>
            {searchResults.length === 0 ? (
              <p className="rounded-xl bg-muted/25 px-4 py-8 text-center text-sm text-muted-foreground">
                {t("network.searchEmpty")}
              </p>
            ) : (
              <ul className="network-member-list flex flex-col gap-1.5">
                {searchResults.map((member) => (
                  <MemberRow key={member.id} member={member} variant="search" />
                ))}
              </ul>
            )}
          </section>
        ) : null}

        <div
          className="mb-4 flex gap-0 border-b border-border md:mb-5"
          role="tablist"
          aria-label={t("network.title")}
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "connections"}
            onClick={() => setTab("connections")}
            className={`network-tab -mb-px px-4 py-2 text-sm font-medium transition md:px-5 md:text-base ${
              tab === "connections"
                ? "network-tab--active text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("network.tabConnections")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "invitations"}
            onClick={() => setTab("invitations")}
            className={`network-tab -mb-px flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition md:px-5 md:text-base ${
              tab === "invitations"
                ? "network-tab--active text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("network.tabInvitations")}
            {invitations.length > 0 ? (
              <NavUnreadDot
                ariaLabel={t("nav.pendingInvitations").replace(
                  "{count}",
                  String(invitations.length),
                )}
              />
            ) : null}
          </button>
        </div>

        <div className="network-list-panel rounded-2xl bg-muted/20 p-2 md:p-3">
          {tab === "invitations" ? (
            invitations.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-muted-foreground md:py-12">
                {t("network.noInvitations")}
              </p>
            ) : (
              <ul className="network-member-list flex flex-col gap-1.5">
                {invitations.map((member) => (
                  <MemberRow key={member.id} member={member} variant="invitation" />
                ))}
              </ul>
            )
          ) : filteredConnections.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground md:py-12">
              {t("network.noConnections")}
            </p>
          ) : (
            <ul className="network-member-list flex flex-col gap-1.5">
              {filteredConnections.map((member) => (
                <MemberRow key={member.id} member={member} variant="connection" />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
