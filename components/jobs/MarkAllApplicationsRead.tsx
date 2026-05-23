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
    <div className="flex justify-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="text-xs font-medium text-primary transition hover:underline disabled:opacity-60"
      >
        {pending ? "..." : t("jobs.markAllApplicationsRead")}
      </button>
    </div>
  );
}
