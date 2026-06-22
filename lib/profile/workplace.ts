import type { CvDraft } from "@/app/profile/actions";
import { currentWorkExperienceOrganizationSlug } from "@/lib/profile/work-experience";

export function workplaceFromCvDraft(cv: unknown): string | null {
  if (!cv || typeof cv !== "object") {
    return null;
  }
  const slug = (cv as Record<string, unknown>).workplace_institution_slug;
  return typeof slug === "string" && slug.trim() ? slug.trim() : null;
}

/** Current workplace from structured work experience only (isCurrent role). */
export function resolveCurrentWorkplaceSlug(cvDraft: unknown): string | null {
  if (!cvDraft || typeof cvDraft !== "object") {
    return null;
  }
  return currentWorkExperienceOrganizationSlug((cvDraft as CvDraft).workExperiences);
}

export function resolveWorkplaceSlug(
  column: string | null | undefined,
  cvDraft: unknown,
): string | null {
  const fromCurrentWork = resolveCurrentWorkplaceSlug(cvDraft);
  if (fromCurrentWork) {
    return fromCurrentWork;
  }
  // Structured work experience exists but no current role — don't use legacy slug.
  if (
    cvDraft &&
    typeof cvDraft === "object" &&
    Array.isArray((cvDraft as CvDraft).workExperiences)
  ) {
    return null;
  }
  return column?.trim() || workplaceFromCvDraft(cvDraft) || null;
}

export function mergeCvDraftWithWorkplace(
  cv: CvDraft,
  workplaceSlug: string | null,
): CvDraft {
  const next: CvDraft = { ...cv };
  if (workplaceSlug) {
    next.workplace_institution_slug = workplaceSlug;
  } else {
    delete next.workplace_institution_slug;
  }
  return next;
}

export function isMissingWorkplaceColumnError(message: string | undefined): boolean {
  if (!message) {
    return false;
  }
  const lower = message.toLowerCase();
  return (
    lower.includes("workplace_institution_slug") &&
    (lower.includes("column") || lower.includes("schema cache") || lower.includes("does not exist"))
  );
}
