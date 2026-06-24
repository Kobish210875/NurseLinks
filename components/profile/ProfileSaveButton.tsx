"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import { useFormStatus } from "react-dom";

type ProfileSaveButtonProps = {
  isDirty: boolean;
};

export default function ProfileSaveButton({ isDirty }: ProfileSaveButtonProps) {
  const t = useT();
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={!isDirty || pending}
      aria-busy={pending}
      className={`rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 ${
        pending ? "cursor-wait" : ""
      } ${isDirty ? "flex-1" : "w-full"}`}
    >
      {pending ? t("profile.saving") : isDirty ? t("profile.save") : t("profile.update")}
    </button>
  );
}
