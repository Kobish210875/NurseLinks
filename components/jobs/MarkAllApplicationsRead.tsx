"use client";

import { markAllJobApplicationsSeen } from "@/app/actions/jobs";
import { useT } from "@/components/i18n/LocaleProvider";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type MarkAllApplicationsReadProps = {
  visible: boolean;
};

export default function MarkAllApplicationsRead({ visible }: MarkAllApplicationsReadProps) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!visible) {
    return null;
  }

  function handleClick() {
    startTransition(async () => {
      await markAllJobApplicationsSeen();
      router.refresh();
    });
  }

  return (
    <div className="flex min-w-0 justify-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="max-w-full text-start text-xs font-medium leading-snug text-primary transition hover:underline disabled:opacity-60"
      >
        {pending ? "..." : t("jobs.markAllApplicationsRead")}
      </button>
    </div>
  );
}
