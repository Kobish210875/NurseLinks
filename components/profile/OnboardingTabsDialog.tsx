"use client";

import Link from "next/link";
import { useT } from "@/components/i18n/LocaleProvider";
import { useId } from "react";

type OnboardingTabsDialogProps = {
  open: boolean;
  onClose: () => void;
};

const sections = [
  { titleKey: "onboarding.homeTitle", bodyKey: "onboarding.homeBody" },
  { titleKey: "onboarding.networkTitle", bodyKey: "onboarding.networkBody" },
  { titleKey: "onboarding.institutionsTitle", bodyKey: "onboarding.institutionsBody" },
  { titleKey: "onboarding.jobsTitle", bodyKey: "onboarding.jobsBody" },
  { titleKey: "onboarding.messagesTitle", bodyKey: "onboarding.messagesBody" },
] as const;

export default function OnboardingTabsDialog({ open, onClose }: OnboardingTabsDialogProps) {
  const t = useT();
  const titleId = useId();

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-white p-6 text-start shadow-xl">
        <h2 id={titleId} className="text-xl font-bold text-foreground">
          {t("onboarding.title")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("onboarding.subtitle")}</p>

        <ul className="mt-5 space-y-4">
          {sections.map((section) => (
            <li key={section.titleKey} className="rounded-xl border border-border bg-muted/30 px-4 py-3">
              <p className="text-sm font-bold text-primary">{t(section.titleKey)}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(section.bodyKey)}</p>
            </li>
          ))}
        </ul>

        <Link
          href="/home"
          onClick={onClose}
          className="btn-primary mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold text-primary-foreground"
        >
          {t("onboarding.cta")}
        </Link>
      </div>
    </div>
  );
}
