"use client";

import InstitutionsPicker from "@/components/hospitals/InstitutionsPicker";
import type { InstitutionActivityMap } from "@/lib/data/institution-activity";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type MobileInstitutionsContentProps = {
  activity: InstitutionActivityMap;
};

/** Mobile-only institutions explorer — desktop users are sent back to home. */
export default function MobileInstitutionsContent({ activity }: MobileInstitutionsContentProps) {
  const router = useRouter();

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const redirectDesktop = () => {
      if (mq.matches) {
        router.replace("/home");
      }
    };
    redirectDesktop();
    mq.addEventListener("change", redirectDesktop);
    return () => mq.removeEventListener("change", redirectDesktop);
  }, [router]);

  return (
    <InstitutionsPicker
      activity={activity}
      showLegend
      className="min-h-0 shadow-sm"
    />
  );
}
