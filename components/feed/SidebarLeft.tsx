"use client";

import AboutStoryCard from "@/components/feed/AboutStoryCard";
import ProTipCard from "@/components/feed/ProTipCard";
import InstitutionsPicker from "@/components/hospitals/InstitutionsPicker";
import { useT } from "@/components/i18n/LocaleProvider";
import {
  CONNECTIONS_CHANGED_EVENT,
  INSTITUTION_ACTIVITY_CHANGED_EVENT,
} from "@/lib/client/sync-events";
import type { InstitutionActivityMap } from "@/lib/data/institution-activity";
import { useCallback, useEffect, useState } from "react";

type SidebarLeftProps = {
  institutionActivity: InstitutionActivityMap;
};

export default function SidebarLeft({ institutionActivity }: SidebarLeftProps) {
  const t = useT();
  const [activity, setActivity] = useState(institutionActivity);

  useEffect(() => {
    setActivity(institutionActivity);
  }, [institutionActivity]);

  const refreshActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/institutions/activity", { cache: "no-store" });
      if (!res.ok) {
        return;
      }
      const data = (await res.json()) as { activity: InstitutionActivityMap };
      setActivity(data.activity);
    } catch {
      // Keep current activity on transient failures.
    }
  }, []);

  useEffect(() => {
    void refreshActivity();
  }, [refreshActivity]);

  useEffect(() => {
    function onRefresh() {
      void refreshActivity();
    }
    window.addEventListener(CONNECTIONS_CHANGED_EVENT, onRefresh);
    window.addEventListener(INSTITUTION_ACTIVITY_CHANGED_EVENT, onRefresh);
    return () => {
      window.removeEventListener(CONNECTIONS_CHANGED_EVENT, onRefresh);
      window.removeEventListener(INSTITUTION_ACTIVITY_CHANGED_EVENT, onRefresh);
    };
  }, [refreshActivity]);

  return (
    <aside className="contents" aria-label={t("feed.navAria")}>
      <div className="home-feed-sidebar-left-scroll min-h-0 flex-1 overflow-hidden">
        <InstitutionsPicker
          activity={activity}
          showLegend
          className="home-feed-sidebar-institutions h-full min-h-0 overflow-hidden"
        />
      </div>
      <AboutStoryCard className="home-feed-sidebar-about shrink-0" />
      <ProTipCard className="home-feed-sidebar-tip shrink-0" />
    </aside>
  );
}
