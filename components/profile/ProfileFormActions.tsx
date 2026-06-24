"use client";

import ProfileSaveButton from "@/components/profile/ProfileSaveButton";
import { useT } from "@/components/i18n/LocaleProvider";
import { useFormStatus } from "react-dom";

type ProfileFormActionsProps = {
  isDirty: boolean;
  onCancel: () => void;
};

export default function ProfileFormActions({ isDirty, onCancel }: ProfileFormActionsProps) {
  const t = useT();
  const { pending } = useFormStatus();

  return (
    <div className="flex gap-3">
      <ProfileSaveButton isDirty={isDirty} />
      {isDirty ? (
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="flex-1 rounded-lg border border-border bg-white py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("profile.cancel")}
        </button>
      ) : null}
    </div>
  );
}
