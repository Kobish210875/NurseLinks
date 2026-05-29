const CV_LINE_RE = /^CV:\s*(https?:\/\/\S+)\s*$/im;

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
    return "cv";
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
