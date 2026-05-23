import {
  INSTITUTION_OTHER_SLUG,
  MEDICAL_INSTITUTIONS,
  type MedicalInstitution,
} from "@/lib/data/medical-institutions";

/** Institutions for profile picker: א–ת, then "other". */
export function getProfileInstitutionOptions(): MedicalInstitution[] {
  return [...MEDICAL_INSTITUTIONS].sort((a, b) =>
    a.shortLabel.localeCompare(b.shortLabel, "he"),
  );
}

export function getInstitutionOptionBySlug(slug: string) {
  if (slug === INSTITUTION_OTHER_SLUG) {
    return { slug: INSTITUTION_OTHER_SLUG, shortLabel: null as string | null };
  }
  const inst = MEDICAL_INSTITUTIONS.find((i) => i.slug === slug);
  return inst ? { slug: inst.slug, shortLabel: inst.shortLabel } : null;
}
