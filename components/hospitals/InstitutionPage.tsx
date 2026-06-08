import Link from "next/link";
import InstitutionResultsSections from "@/components/hospitals/InstitutionResultsSections";
import type { InstitutionColleague } from "@/lib/data/institution-colleagues";
import type { InstitutionOpenJob } from "@/lib/data/institution-jobs";
import type { MedicalInstitution } from "@/lib/data/medical-institutions";

type InstitutionPageProps = {
  institution: MedicalInstitution;
  colleagues: InstitutionColleague[];
  openJobs: InstitutionOpenJob[];
  defaultApplicantName: string;
  regionLabel: string;
  labels: {
    back: string;
    colleaguesTitle: string;
    colleaguesEmpty: string;
    colleaguesHint: string;
    message: string;
    jobsTitle: string;
    jobsHint: string;
    jobsEmpty: string;
    jobsOpenAll: string;
    jobsLocation: string;
    apply: string;
  };
};

export default function InstitutionPage({
  institution,
  colleagues,
  openJobs,
  defaultApplicantName,
  regionLabel,
  labels,
}: InstitutionPageProps) {
  return (
    <div className="space-y-4">
      <Link
        href="/home"
        className="mb-4 inline-block text-sm font-medium text-primary hover:underline lg:hidden"
      >
        {labels.back}
      </Link>

      <div className="feed-card p-6 text-start">
        <p className="text-xs font-medium text-accent">{regionLabel}</p>
        <h1 className="mt-1 text-xl font-bold text-foreground">{institution.fullName}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{institution.address}</p>
      </div>

      <InstitutionResultsSections
        institutionSlug={institution.slug}
        colleagues={colleagues}
        openJobs={openJobs}
        defaultApplicantName={defaultApplicantName}
        labels={labels}
      />
    </div>
  );
}
