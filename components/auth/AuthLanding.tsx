"use client";

import Link from "next/link";
import { useT } from "@/components/i18n/LocaleProvider";
import NurseLinkWordmark from "@/components/NurseLinkWordmark";

export default function AuthLanding() {
  const t = useT();

  const highlights = [
    t("feed.highlight1"),
    t("feed.highlight2"),
    t("feed.highlight3"),
  ];

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <div className="feed-card overflow-hidden">
        <div
          className="h-14 bg-gradient-to-r from-primary/20 via-accent/15 to-transparent"
          aria-hidden="true"
        />
        <div className="px-4 pb-4 text-center">
          <div className="-mt-8 mx-auto mb-3 flex size-16 items-center justify-center rounded-full border-4 border-card bg-primary/10 text-xl font-bold text-primary">
            NL
          </div>
          <p className="mb-1 flex justify-center text-lg font-bold text-primary">
            <NurseLinkWordmark textClassName="text-primary" />
          </p>
          <p className="mb-4 text-sm text-muted-foreground">{t("feed.networkTagline")}</p>
          <Link
            href="/register"
            className="btn-primary mb-2 block w-full rounded-lg py-2.5 text-sm font-semibold text-primary-foreground"
          >
            {t("feed.joinFree")}
          </Link>
          <Link
            href="/login"
            className="block w-full rounded-lg border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            {t("nav.login")}
          </Link>
        </div>
      </div>

      <div className="feed-card p-4 text-start">
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t("feed.whyJoin")}</h2>
        <ul className="space-y-2">
          {highlights.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
