"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import HospitalsSidebar from "@/components/feed/HospitalsSidebar";

export default function SidebarLeft() {
  const t = useT();

  return (
    <aside className="flex flex-col gap-4" aria-label={t("feed.navAria")}>
      <HospitalsSidebar />
    </aside>
  );
}
