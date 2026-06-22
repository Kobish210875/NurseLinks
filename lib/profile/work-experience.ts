import { getInstitutionBySlug } from "@/lib/data/medical-institutions";
import { isValidProfileInstitutionSlug } from "@/lib/data/medical-institutions";

export type WorkExperienceEntry = {
  id: string;
  jobTitle: string;
  organizationSlug: string;
  isCurrent: boolean;
  startMonth: number;
  startYear: number;
  endMonth: number | null;
  endYear: number | null;
};

export const HEBREW_MONTHS = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
] as const;

export const MAX_WORK_EXPERIENCES = 20;

function clampMonth(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 12) {
    return null;
  }
  return n;
}

function clampYear(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(n) || n < 1950 || n > currentYear + 1) {
    return null;
  }
  return n;
}

function sanitizeEntry(raw: unknown): WorkExperienceEntry | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const jobTitle = typeof o.jobTitle === "string" ? o.jobTitle.trim().slice(0, 120) : "";
  const organizationSlug =
    typeof o.organizationSlug === "string" ? o.organizationSlug.trim() : "";
  if (!jobTitle || !organizationSlug || !isValidProfileInstitutionSlug(organizationSlug)) {
    return null;
  }

  const startMonth = clampMonth(o.startMonth);
  const startYear = clampYear(o.startYear);
  if (!startMonth || !startYear) {
    return null;
  }

  const isCurrent = o.isCurrent === true;
  let endMonth: number | null = null;
  let endYear: number | null = null;
  if (!isCurrent) {
    endMonth = clampMonth(o.endMonth);
    endYear = clampYear(o.endYear);
    if (!endMonth || !endYear) {
      return null;
    }
    const startIndex = startYear * 12 + startMonth;
    const endIndex = endYear * 12 + endMonth;
    if (endIndex < startIndex) {
      return null;
    }
  }

  const id =
    typeof o.id === "string" && o.id.trim()
      ? o.id.trim().slice(0, 64)
      : crypto.randomUUID();

  return {
    id,
    jobTitle,
    organizationSlug,
    isCurrent,
    startMonth,
    startYear,
    endMonth,
    endYear,
  };
}

export function parseWorkExperiencesJson(raw: string): WorkExperienceEntry[] {
  if (!raw.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map(sanitizeEntry)
      .filter((e): e is WorkExperienceEntry => e !== null)
      .slice(0, MAX_WORK_EXPERIENCES);
  } catch {
    return [];
  }
}

export function normalizeWorkExperiences(raw: unknown): WorkExperienceEntry[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map(sanitizeEntry)
    .filter((e): e is WorkExperienceEntry => e !== null)
    .slice(0, MAX_WORK_EXPERIENCES);
}

export function formatMonthYear(month: number, year: number, locale: string): string {
  if (locale === "he") {
    return `${HEBREW_MONTHS[month - 1]} ${year}`;
  }
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" }).format(date);
}

export function formatExperienceDuration(
  startMonth: number,
  startYear: number,
  endMonth: number | null,
  endYear: number | null,
  isCurrent: boolean,
  locale: string,
): string {
  const now = new Date();
  const endM = isCurrent ? now.getMonth() + 1 : endMonth!;
  const endY = isCurrent ? now.getFullYear() : endYear!;
  let months = (endY - startYear) * 12 + (endM - startMonth) + 1;
  if (months < 1) {
    months = 1;
  }
  const years = Math.floor(months / 12);
  const remMonths = months % 12;

  if (locale === "he") {
    if (years > 0 && remMonths > 0) {
      return `${years} שנ׳ ${remMonths} ח׳`;
    }
    if (years > 0) {
      return years === 1 ? "שנה" : `${years} שנ׳`;
    }
    return remMonths === 1 ? "חודש" : `${remMonths} ח׳`;
  }

  if (years > 0 && remMonths > 0) {
    return `${years} yr${years === 1 ? "" : "s"} ${remMonths} mo`;
  }
  if (years > 0) {
    return `${years} yr${years === 1 ? "" : "s"}`;
  }
  return `${remMonths} mo`;
}

export function formatExperienceDateLine(
  entry: WorkExperienceEntry,
  locale: string,
): string {
  const start = formatMonthYear(entry.startMonth, entry.startYear, locale);
  const end = entry.isCurrent
    ? locale === "he"
      ? "היום"
      : "Present"
    : formatMonthYear(entry.endMonth!, entry.endYear!, locale);
  const duration = formatExperienceDuration(
    entry.startMonth,
    entry.startYear,
    entry.endMonth,
    entry.endYear,
    entry.isCurrent,
    locale,
  );
  return `${start} - ${end} · ${duration}`;
}

export function getOrganizationLabel(
  slug: string,
  institutionOtherLabel: string,
): string {
  if (slug === "other") {
    return institutionOtherLabel;
  }
  const inst = getInstitutionBySlug(slug);
  return inst?.shortLabel ?? slug;
}

export function deriveWorkplaceInstitutionSlug(
  entries: WorkExperienceEntry[],
): string | null {
  const current = entries.find((entry) => entry.isCurrent);
  return current?.organizationSlug.trim() || null;
}

/** Slug of the organization for the user's current role only (not past jobs). */
export function currentWorkExperienceOrganizationSlug(
  workExperiences: unknown,
): string | null {
  const entries = normalizeWorkExperiences(workExperiences);
  const current = entries.find((entry) => entry.isCurrent);
  return current?.organizationSlug.trim() || null;
}

export function createEmptyWorkExperience(): WorkExperienceEntry {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    jobTitle: "",
    organizationSlug: "",
    isCurrent: false,
    startMonth: now.getMonth() + 1,
    startYear: now.getFullYear(),
    endMonth: null,
    endYear: null,
  };
}
