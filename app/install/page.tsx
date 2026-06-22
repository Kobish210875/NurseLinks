import type { Metadata } from "next";
import Link from "next/link";
import CopyLinkButton from "@/components/install/CopyLinkButton";
import NurseLinkWordmark from "@/components/NurseLinkWordmark";
import { createInstallGuideQrDataUrl } from "@/lib/install/qr-code";
import { getSiteUrl } from "@/lib/site-url";
import { createT, getMessages } from "@/lib/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = createT(getMessages("he"));
  const siteUrl = getSiteUrl();

  return {
    title: t("installGuide.metaTitle"),
    description: t("installGuide.metaDescription"),
    openGraph: {
      type: "website",
      locale: "he_IL",
      url: `${siteUrl}/install`,
      siteName: "NurseLinks",
      title: t("installGuide.metaTitle"),
      description: t("installGuide.metaDescription"),
    },
  };
}

function StepCard({ number, title, body }: { number: number; title: string; body: string }) {
  return (
    <li className="feed-card flex gap-4 p-4 text-start">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground"
        aria-hidden="true"
      >
        {number}
      </span>
      <div className="min-w-0 space-y-1">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}

export default async function InstallGuidePage() {
  const t = createT(getMessages("he"));
  const siteUrl = getSiteUrl();
  const guideUrl = `${siteUrl}/install`;
  const qrDataUrl = await createInstallGuideQrDataUrl(guideUrl);

  const steps = [
    { title: t("installGuide.step1Title"), body: t("installGuide.step1Body") },
    { title: t("installGuide.step2Title"), body: t("installGuide.step2Body") },
    { title: t("installGuide.step3Title"), body: t("installGuide.step3Body") },
    { title: t("installGuide.step4Title"), body: t("installGuide.step4Body") },
  ];

  return (
    <div className="feed-page min-h-screen" dir="rtl" lang="he">
      <header className="border-b border-border bg-nav-bg px-4 py-3">
        <NurseLinkWordmark textClassName="text-primary" />
      </header>

      <main className="mx-auto max-w-lg space-y-5 px-4 py-8">
        <section className="space-y-2 text-center">
          <p className="text-sm font-medium text-primary">{t("installGuide.badge")}</p>
          <h1 className="text-2xl font-bold leading-snug text-foreground">{t("installGuide.title")}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("installGuide.intro")}</p>
        </section>

        <section className="feed-card flex flex-col items-center gap-3 p-5 text-center">
          <h2 className="text-base font-bold text-foreground">{t("installGuide.qrTitle")}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("installGuide.qrBody")}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt={t("installGuide.qrAlt")}
            width={280}
            height={280}
            className="rounded-xl border border-border bg-white p-2"
          />
          <p className="break-all text-xs text-muted-foreground">{guideUrl}</p>
        </section>

        <ol className="space-y-3" aria-label={t("installGuide.stepsAria")}>
          {steps.map((step, index) => (
            <StepCard key={step.title} number={index + 1} title={step.title} body={step.body} />
          ))}
        </ol>

        <section className="feed-card space-y-3 border-primary/20 bg-primary/5 p-4 text-start">
          <p className="text-sm font-semibold text-foreground">{t("installGuide.safariNoteTitle")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("installGuide.safariNoteBody")}</p>
        </section>

        <section className="space-y-3">
          <Link
            href="/"
            className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3.5 text-base font-bold text-primary-foreground transition hover:bg-primary/90"
          >
            {t("installGuide.openSite")}
          </Link>
          <CopyLinkButton
            url={guideUrl}
            copyLabel={t("installGuide.copyLink")}
            copiedLabel={t("installGuide.copiedLink")}
          />
        </section>

        <p className="text-center text-xs leading-relaxed text-muted-foreground">{t("installGuide.footer")}</p>
      </main>
    </div>
  );
}
