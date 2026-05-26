"use client";

import { useTransition } from "react";
import { adminSoftDeleteUser } from "@/app/admin/users/actions";
import { useT } from "@/components/i18n/LocaleProvider";

type AdminDeleteUserButtonProps = {
  userId: string;
  userName: string;
};

export default function AdminDeleteUserButton({
  userId,
  userName,
}: AdminDeleteUserButtonProps) {
  const t = useT();
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        if (!window.confirm(t("admin.deleteUserConfirm").replace("{name}", userName))) {
          return;
        }

        startTransition(() => {
          void adminSoftDeleteUser(formData);
        });
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
      >
        {pending ? t("admin.deletingUser") : t("admin.deleteUser")}
      </button>
    </form>
  );
}
