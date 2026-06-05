"use client";

import Link from "next/link";
import { useT } from "@/components/i18n/LocaleProvider";

export default function ProfileChangePasswordSection() {
  const t = useT();

  return (
    <section className="feed-card mx-auto max-w-xl space-y-4 p-6 text-start">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{t("profile.changePasswordTitle")}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {t("profile.changePasswordDescription")}
        </p>
      </div>

      <Link
        href="/forgot-password"
        className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        {t("profile.changePasswordLink")}
      </Link>
    </section>
  );
}
