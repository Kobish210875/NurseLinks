import type { ReactNode } from "react";
import Link from "next/link";
import NurseLinkWordmark from "@/components/NurseLinkWordmark";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";

function FeatureIcon({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/15"
      aria-hidden="true"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
        aria-label={label}
        role="img"
      >
        {children}
      </svg>
    </span>
  );
}

export default async function Hero() {
  const locale = await getLocale();
  const t = createT(getMessages(locale));

  const features = [
    {
      text: t("hero.feature1"),
      label: t("hero.feature1"),
      icon: (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      ),
    },
    {
      text: t("hero.feature2"),
      label: t("hero.feature2"),
      icon: (
        <>
          <path d="M12 7v14" />
          <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
        </>
      ),
    },
    {
      text: t("hero.feature3"),
      label: t("hero.feature3"),
      icon: (
        <>
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" />
        </>
      ),
    },
    {
      text: t("hero.feature4"),
      label: t("hero.feature4"),
      icon: (
        <>
          <path d="M12 12h.01" />
          <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          <path d="M22 13a18.15 18.15 0 0 1-20 0" />
          <rect width="20" height="14" x="2" y="6" rx="2" />
        </>
      ),
    },
  ];

  const stats = [
    { value: "+10K", label: t("hero.stat1"), icon: features[0].icon },
    { value: "+500", label: t("hero.stat2"), icon: features[3].icon },
    {
      value: "+120",
      label: t("hero.stat3"),
      icon: (
        <>
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
          <path d="M10 6h4" />
          <path d="M10 10h4" />
          <path d="M10 14h4" />
          <path d="M10 18h4" />
        </>
      ),
    },
  ];

  return (
    <section className="hero-mesh relative overflow-hidden pb-24 pt-16 md:pb-32 md:pt-24">
      <div
        className="hero-grid pointer-events-none absolute inset-0 opacity-80"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-24 start-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/90 px-4 py-2 text-sm font-medium text-secondary-foreground shadow-sm backdrop-blur-sm">
            <span className="size-2 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" aria-hidden="true" />
            {t("hero.badge")}
          </span>

          <h1
            className="mb-6 text-5xl font-bold leading-none tracking-tight md:text-7xl lg:text-8xl"
            style={{ textWrap: "balance" }}
            aria-label="NurseLinks"
          >
            <span className="text-gradient-brand">
              <NurseLinkWordmark className="justify-center" textClassName="text-inherit" />
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg font-medium text-foreground md:text-xl">
            {t("hero.subtitle")}
          </p>

          <div className="card-elevated mx-auto mb-10 max-w-lg rounded-2xl p-6 text-start md:p-8">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">
              {t("hero.cardTitle")}
            </p>
            <ul className="space-y-3" role="list">
              {features.map((feature) => (
                <li key={feature.text}>
                  <span className="flex items-center justify-between gap-4 rounded-xl bg-muted/60 px-4 py-3 transition-colors hover:bg-muted">
                    <span className="font-medium text-foreground">{feature.text}</span>
                    <FeatureIcon label={feature.label}>{feature.icon}</FeatureIcon>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-border pt-5 text-center text-muted-foreground">
              {t("hero.cardFooter")}
            </p>
          </div>

          <div className="mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="btn-primary w-full rounded-xl px-8 py-3.5 text-base font-semibold text-primary-foreground sm:w-auto"
            >
              {t("hero.ctaRegister")}
            </Link>
            <Link
              href="#about"
              className="w-full rounded-xl border border-border bg-white px-8 py-3.5 text-base font-semibold text-foreground shadow-sm transition hover:border-primary/30 hover:shadow-md sm:w-auto"
            >
              {t("hero.ctaLearn")}
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="stat-card flex flex-col items-center gap-3 rounded-2xl p-6"
              >
                <span className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                    aria-hidden="true"
                  >
                    {stat.icon}
                  </svg>
                </span>
                <span className="text-3xl font-bold tabular-nums text-gradient-brand">
                  {stat.value}
                </span>
                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
