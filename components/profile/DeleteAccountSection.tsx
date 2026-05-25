"use client";

import { deleteAccount } from "@/app/profile/actions";
import { useT } from "@/components/i18n/LocaleProvider";
import { useFormStatus } from "react-dom";

function DeleteButton() {
  const t = useT();
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
    >
      {pending ? "..." : t("profile.deleteAccountButton")}
    </button>
  );
}

export default function DeleteAccountSection() {
  const t = useT();

  return (
    <section className="feed-card mx-auto max-w-xl space-y-3 border-red-100 p-6 text-start">
      <div>
        <h2 className="text-sm font-semibold text-red-700">{t("profile.deleteAccountTitle")}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {t("profile.deleteAccountDescription")}
        </p>
      </div>
      <form
        action={deleteAccount}
        onSubmit={(event) => {
          if (!window.confirm(t("profile.deleteAccountConfirm"))) {
            event.preventDefault();
          }
        }}
      >
        <DeleteButton />
      </form>
    </section>
  );
}
