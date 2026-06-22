"use client";

import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import { getInstitutionBySlug } from "@/lib/data/medical-institutions";
import {
  formatExperienceDateLine,
  getOrganizationLabel,
  type WorkExperienceEntry,
} from "@/lib/profile/work-experience";

type WorkExperienceDisplayProps = {
  entries: WorkExperienceEntry[];
};

function OrgBadge({ slug }: { slug: string }) {
  const inst = getInstitutionBySlug(slug);
  const label = inst?.shortLabel?.slice(0, 2) ?? "NL";

  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border bg-white text-xs font-bold text-primary">
      {label}
    </span>
  );
}

export default function WorkExperienceDisplay({ entries }: WorkExperienceDisplayProps) {
  const t = useT();
  const { locale } = useLocale();

  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="text-start">
      <h3 className="text-sm font-medium text-foreground">{t("profile.experience")}</h3>
      <ul className="mt-3 space-y-4">
        {entries.map((entry) => {
          const orgLabel = getOrganizationLabel(entry.organizationSlug, t("profile.institutionOther"));
          const dateLine = formatExperienceDateLine(entry, locale);

          return (
            <li key={entry.id} className="flex gap-3 border-b border-border pb-4 last:border-0 last:pb-0">
              <OrgBadge slug={entry.organizationSlug} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{entry.jobTitle}</p>
                <p className="mt-0.5 text-sm text-foreground">{orgLabel}</p>
                <p className="mt-1 text-sm text-muted-foreground">{dateLine}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
