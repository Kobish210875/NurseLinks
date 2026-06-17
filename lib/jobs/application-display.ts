const CV_LINE_RE = /^CV:\s*(https?:\/\/\S+)\s*$/im;

export const CV_BUCKET = "job-applications";
export const CV_SIGNED_URL_TTL_SECONDS = 600;

const CV_BUCKET_URL_MARKER = "/job-applications/";

/**
 * Resolves the bucket-relative object path for a stored CV reference.
 * Accepts either a bare object path (new rows: `<jobId>/<uid>/<file>`) or a
 * legacy full public URL (older rows / `CV: <url>` note fallback).
 * Returns null when no path can be derived.
 */
export function resolveCvObjectPath(stored: string | null | undefined): string | null {
  const value = stored?.trim();
  if (!value) {
    return null;
  }

  const markerIdx = value.indexOf(CV_BUCKET_URL_MARKER);
  if (markerIdx !== -1) {
    const raw = value.slice(markerIdx + CV_BUCKET_URL_MARKER.length).split("?")[0];
    try {
      return decodeURIComponent(raw) || null;
    } catch {
      return raw || null;
    }
  }

  if (/^https?:\/\//i.test(value)) {
    return null;
  }

  return value;
}

export type RawJobApplicationRow = {
  id: string;
  job_id: string;
  applicant_id: string;
  full_name: string;
  phone: string;
  note: string | null;
  created_at: string;
  owner_read_at?: string | null;
  cv_url?: string | null;
  cv_file_name?: string | null;
};

export type ParsedJobApplication = {
  id: string;
  jobId: string;
  applicantId: string;
  fullName: string;
  phone: string;
  note: string | null;
  createdAt: string;
  ownerReadAt: string | null;
  cvUrl: string | null;
  cvFileName: string | null;
};

function fileNameFromUrl(url: string): string {
  try {
    const segment = new URL(url).pathname.split("/").pop() ?? "cv";
    const decoded = decodeURIComponent(segment);
    return decoded || "cv";
  } catch {
    const segment = url.split("?")[0].split("/").pop() ?? "cv";
    try {
      return decodeURIComponent(segment) || "cv";
    } catch {
      return segment || "cv";
    }
  }
}

export function parseJobApplicationRow(row: RawJobApplicationRow): ParsedJobApplication {
  let cvUrl = row.cv_url?.trim() || null;
  let cvFileName = row.cv_file_name?.trim() || null;
  let note = row.note?.trim() || null;

  if (!cvUrl && note) {
    const match = note.match(CV_LINE_RE);
    if (match?.[1]) {
      cvUrl = match[1].trim();
      note =
        note
          .split("\n")
          .filter((line) => !CV_LINE_RE.test(line.trim()))
          .join("\n")
          .trim() || null;
    }
  }

  if (cvUrl && !cvFileName) {
    cvFileName = fileNameFromUrl(cvUrl);
  }

  return {
    id: row.id,
    jobId: row.job_id,
    applicantId: row.applicant_id,
    fullName: row.full_name,
    phone: row.phone,
    note,
    createdAt: row.created_at,
    ownerReadAt: row.owner_read_at ?? null,
    cvUrl,
    cvFileName,
  };
}
