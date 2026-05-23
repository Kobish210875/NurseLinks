"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import HospitalsSidebar from "@/components/feed/HospitalsSidebar";

export default function SidebarLeft() {
  const t = useT();

  return (
    <aside
      className="hidden flex-col gap-4 lg:flex lg:min-h-[calc(100vh-7rem)]"
      aria-label={t("feed.navAria")}
    >
      <HospitalsSidebar />
    </aside>
  );
}
