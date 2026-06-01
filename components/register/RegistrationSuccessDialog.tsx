"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import { useId } from "react";

type RegistrationSuccessDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function RegistrationSuccessDialog({ open, onClose }: RegistrationSuccessDialogProps) {
  const t = useT();
  const titleId = useId();

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 text-center shadow-xl">
        <h2 id={titleId} className="text-xl font-bold text-foreground">
          {t("register.successTitle")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t("register.success")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {t("register.successAfterVerify")}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="btn-primary mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold text-primary-foreground"
        >
          {t("register.successCta")}
        </button>
      </div>
    </div>
  );
}
