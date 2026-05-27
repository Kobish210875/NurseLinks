"use client";

import { useFormStatus } from "react-dom";
import { useT } from "@/components/i18n/LocaleProvider";

type RegisterSubmitButtonProps = {
  disabled?: boolean;
};

export default function RegisterSubmitButton({ disabled }: RegisterSubmitButtonProps) {
  const t = useT();
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className="btn-primary mt-6 w-full rounded-lg px-4 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? t("register.submitting") : t("register.submit")}
    </button>
  );
}
