import {
  getInstitutionBySlug,
  INSTITUTION_OTHER_SLUG,
  MEDICAL_INSTITUTIONS,
  type MedicalInstitution,
} from "@/lib/data/medical-institutions";

/** Hospital + city (e.g. אסותא, תל אביב). */
export function institutionCityLabel(inst: MedicalInstitution): string {
  return inst.locationShort
    ? `${inst.shortLabel}, ${inst.locationShort}`
    : inst.shortLabel;
}

export function getInstitutionLabel(
  slug: string | null | undefined,
  otherLabel: string,
  withCity = false,
): string | null {
  if (!slug?.trim()) {
    return null;
  }
  if (slug === INSTITUTION_OTHER_SLUG) {
    return otherLabel;
  }
  const inst = getInstitutionBySlug(slug);
  if (!inst) {
    return null;
  }
  return withCity ? institutionCityLabel(inst) : inst.shortLabel;
}

function findInstitutionInText(text: string): MedicalInstitution | undefined {
  const hay = text.trim();
  if (!hay) {
    return undefined;
  }
  return MEDICAL_INSTITUTIONS.find(
    (inst) =>
      hay.includes(inst.shortLabel) ||
      inst.matchTerms.some((term) => hay.includes(term)),
  );
}

function stripInstitutionFromProfession(
  profession: string,
  inst: MedicalInstitution,
): string {
  let role = profession.trim();
  const patterns = [inst.shortLabel, ...inst.matchTerms].sort(
    (a, b) => b.length - a.length,
  );

  for (const term of patterns) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    role = role
      .replace(new RegExp(`[,\\s-]+${escaped}.*$`, "u"), "")
      .replace(new RegExp(`^${escaped}[,\\s-]+`, "u"), "")
      .trim();
  }

  return role.replace(/[,\s-]+$/, "").trim();
}

function joinRoleAndWorkplace(role: string, workplace: string): string {
  const parts = [role.trim(), workplace.trim()].filter(Boolean);
  return parts.join(" - ");
}

/** תפקיד - בית חולים, עיר (e.g. אחות במיון - אסותא, תל אביב). */
export function formatProfileHeadline(
  profession: string | null | undefined,
  institutionSlug: string | null | undefined,
  otherLabel: string,
): string | null {
  const roleRaw = profession?.trim() ?? "";
  const inst = institutionSlug
    ? getInstitutionBySlug(institutionSlug)
    : undefined;

  if (inst && inst.slug !== INSTITUTION_OTHER_SLUG) {
    const role = roleRaw ? stripInstitutionFromProfession(roleRaw, inst) : "";
    return joinRoleAndWorkplace(role, institutionCityLabel(inst)) || null;
  }

  if (roleRaw) {
    const detected = findInstitutionInText(roleRaw);
    if (detected) {
      const role = stripInstitutionFromProfession(roleRaw, detected);
      return joinRoleAndWorkplace(role, institutionCityLabel(detected));
    }
    return roleRaw;
  }

  return null;
}

/** @deprecated Use formatProfileHeadline for consistent workplace display. */
export function formatProfessionalSubtitle(
  profession: string | null | undefined,
  institutionSlug: string | null | undefined,
  otherLabel: string,
): string | null {
  return formatProfileHeadline(profession, institutionSlug, otherLabel);
}
