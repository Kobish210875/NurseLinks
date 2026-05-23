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
    <div className="feed-card p-3 md:p-6">
      <header className="mb-3 text-start md:mb-4">
        <h1 className="text-lg font-bold text-foreground md:text-xl">{t("network.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("network.count").replace("{count}", String(connections.length))}
        </p>
      </header>

      <label className="sr-only" htmlFor="network-search">
        {t("network.searchLabel")}
      </label>
      <div className="relative mb-3 md:mb-4">
        <svg
          className="pointer-events-none absolute top-1/2 end-3 size-4 -translate-y-1/2 text-muted-foreground"
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
          className="w-full rounded-lg border border-border bg-white py-2.5 pe-10 ps-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
        />
      </div>

      {showSearch ? (
        <section className="mb-4 text-start md:mb-6">
          <h2 className="mb-2 text-sm font-semibold text-foreground">{t("network.searchResults")}</h2>
          {searchResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("network.searchEmpty")}</p>
          ) : (
            <ul>
              {searchResults.map((member) => (
                <MemberRow key={member.id} member={member} variant="search" />
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <div className="mb-4 flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("connections")}
          className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
            tab === "connections"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("network.tabConnections")}
        </button>
        <button
          type="button"
          onClick={() => setTab("invitations")}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition ${
            tab === "invitations"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
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

      {tab === "invitations" ? (
        invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("network.noInvitations")}</p>
        ) : (
          <ul>
            {invitations.map((member) => (
              <MemberRow key={member.id} member={member} variant="invitation" />
            ))}
          </ul>
        )
      ) : filteredConnections.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("network.noConnections")}</p>
      ) : (
        <ul>
          {filteredConnections.map((member) => (
            <MemberRow key={member.id} member={member} variant="connection" />
          ))}
        </ul>
      )}
    </div>
  );
}
