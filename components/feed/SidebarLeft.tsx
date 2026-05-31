import HospitalsSidebar from "@/components/feed/HospitalsSidebar";
import type { InstitutionActivityMap } from "@/lib/data/institution-activity";

type SidebarLeftProps = {
  institutionActivity: InstitutionActivityMap;
};

export default function SidebarLeft({ institutionActivity }: SidebarLeftProps) {
  return <HospitalsSidebar activity={institutionActivity} />;
}
