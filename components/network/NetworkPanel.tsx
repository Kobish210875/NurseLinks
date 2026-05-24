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

function MemberList({
  members,
  variant,
  emptyText,
}: {
  members: NetworkMember[];
  variant: "connection" | "search" | "invitation";
  emptyText: string;
}) {
  if (members.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-sm text-muted-foreground">{emptyText}</p>
    );
  }

  return (
    <ul className="space-y-2" aria-live="polite">
      {members.map((member) => (
        <MemberRow key={member.id} member={member} variant={variant} />
      ))}
    </ul>
  );
}

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

  const tabClass = (active: boolean) =>
    `min-w-0 rounded-lg px-2 py-2 text-center text-xs font-semibold leading-snug transition sm:px-3 sm:py-2.5 sm:text-sm ${
      active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    }`;

  return (
    <div className="space-y-4">
      <section className="feed-card min-w-0 space-y-3 p-3 sm:p-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{t("network.searchTitle")}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("network.searchHint")}</p>
        </div>
        <label className="sr-only" htmlFor="network-search">
          {t("network.searchLabel")}
        </label>
        <input
          id="network-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("network.searchPlaceholder")}
          className="network-search-input w-full max-w-full rounded-lg border border-border bg-white px-3 py-2 text-base outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 md:text-sm"
        />
      </section>

      {showSearch ? (
        <section className="feed-card min-w-0 p-3 sm:p-4">
          <h2 className="mb-2 text-start text-sm font-semibold text-foreground">
            {t("network.searchResults")}
          </h2>
          <div className="network-members-scroll max-h-[min(16rem,calc(100vh-14rem))] overflow-y-auto overscroll-contain pe-0.5">
            <MemberList
              members={searchResults}
              variant="search"
              emptyText={t("network.searchEmpty")}
            />
          </div>
        </section>
      ) : null}

      <nav
        className="feed-card grid min-w-0 grid-cols-2 gap-1 p-1"
        role="tablist"
        aria-label={t("network.title")}
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "connections"}
          onClick={() => setTab("connections")}
          className={tabClass(tab === "connections")}
        >
          {t("network.tabConnections")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "invitations"}
          onClick={() => setTab("invitations")}
          className={`${tabClass(tab === "invitations")} inline-flex items-center justify-center gap-1`}
        >
          <span className="truncate">{t("network.tabInvitations")}</span>
          {invitations.length > 0 ? (
            <NavUnreadDot
              ariaLabel={t("nav.pendingInvitations").replace(
                "{count}",
                String(invitations.length),
              )}
            />
          ) : null}
        </button>
      </nav>

      <section className="feed-card min-w-0 p-3 sm:p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-start text-sm font-semibold text-foreground">
            {tab === "invitations" ? t("network.tabInvitations") : t("network.tabConnections")}
          </h2>
          <span className="text-xs text-muted-foreground">
            {tab === "invitations"
              ? t("network.pendingCount").replace("{count}", String(invitations.length))
              : t("network.count").replace("{count}", String(connections.length))}
          </span>
        </div>
        <div className="network-members-scroll max-h-[min(22rem,calc(100vh-18rem))] overflow-y-auto overscroll-contain pe-0.5">
          {tab === "invitations" ? (
            <MemberList
              members={invitations}
              variant="invitation"
              emptyText={t("network.noInvitations")}
            />
          ) : (
            <MemberList
              members={filteredConnections}
              variant="connection"
              emptyText={t("network.noConnections")}
            />
          )}
        </div>
      </section>
    </div>
  );
}
