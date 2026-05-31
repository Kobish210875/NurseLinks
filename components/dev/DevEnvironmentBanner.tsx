"use client";

import { useT } from "@/components/i18n/LocaleProvider";

export default function DevEnvironmentBanner() {
  const t = useT();

  return (
    <div
      className="sticky top-0 z-[100] border-b border-amber-300 bg-amber-100 px-3 py-1.5 text-center text-xs font-semibold text-amber-950"
      role="status"
    >
      {t("dev.banner")}
    </div>
  );
}
