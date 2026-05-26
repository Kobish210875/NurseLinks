"use client";

import Link from "next/link";
import { useT } from "@/components/i18n/LocaleProvider";

type RegistrationSuccessDialogProps = {
  open: boolean;
};

export default function RegistrationSuccessDialog({ open }: RegistrationSuccessDialogProps) {
  const t = useT();

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="registration-success-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 text-center shadow-xl">
        <h2 id="registration-success-title" className="text-xl font-bold text-foreground">
          {t("register.successTitle")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t("register.success")}
        </p>
        <Link
          href="/login"
          className="btn-primary mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold text-primary-foreground"
        >
          {t("register.successCta")}
        </Link>
      </div>
    </div>
  );
}
