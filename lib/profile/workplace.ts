import type { CvDraft } from "@/app/profile/actions";

export function workplaceFromCvDraft(cv: unknown): string | null {
  if (!cv || typeof cv !== "object") {
    return null;
  }
  const slug = (cv as Record<string, unknown>).workplace_institution_slug;
  return typeof slug === "string" && slug.trim() ? slug.trim() : null;
}

export function resolveWorkplaceSlug(
  column: string | null | undefined,
  cvDraft: unknown,
): string | null {
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
