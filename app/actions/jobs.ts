"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getInstitutionBySlug,
  INSTITUTION_OTHER_HOSPITAL_LABEL,
  INSTITUTION_OTHER_SLUG,
  isValidProfileInstitutionSlug,
} from "@/lib/data/medical-institutions";
import { institutionCityLabel } from "@/lib/profile/display-professional";
import {
  markAllJobApplicationsRead,
  markJobApplicationsRead,
  markJobsListSeen,
} from "@/lib/data/jobs";
import { isHebrewDisplayName } from "@/lib/validation/hebrew-name";
import { isValidIsraeliMobile, normalizeIsraeliMobile } from "@/lib/validation/phone";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

const MAX_TITLE = 200;
const MAX_BODY = 4000;
const MAX_HOSPITAL = 200;

type JobInsert = Database["public"]["Tables"]["jobs"]["Insert"];

function getString(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function revalidateJobs() {
  revalidatePath("/jobs");
  revalidatePath("/jobs/new");
  revalidatePath("/home");
  revalidatePath("/", "layout");
}

export async function markJobsSeen() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" as const };
  }

  await markJobsListSeen(supabase, user.id);
  revalidateJobs();
  return { success: true as const };
}

export async function markJobApplicationsSeen(jobId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" as const };
  }

  const ok = await markJobApplicationsRead(supabase, user.id, jobId);
  if (!ok) {
    return { error: "update-failed" as const };
  }

  revalidateJobs();
  return { success: true as const };
}

export async function markAllJobApplicationsSeen() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthorized" as const };
  }

  await markAllJobApplicationsRead(supabase, user.id);
  revalidateJobs();
  return { success: true as const };
}

export async function createJob(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const title = getString(formData, "title");
  const body = getString(formData, "body");
  const institutionSlug = getString(formData, "workplaceInstitution");

  if (!title || title.length > MAX_TITLE || !body || body.length > MAX_BODY) {
    return { error: "invalid-body" as const };
  }

  if (!institutionSlug || !isValidProfileInstitutionSlug(institutionSlug)) {
    return { error: "invalid-institution" as const };
  }

  let hospital: string;
  let city: string | null;

  if (institutionSlug === INSTITUTION_OTHER_SLUG) {
    hospital = INSTITUTION_OTHER_HOSPITAL_LABEL;
    city = null;
  } else {
    const inst = getInstitutionBySlug(institutionSlug);
    if (!inst) {
      return { error: "invalid-institution" as const };
    }
    hospital = institutionCityLabel(inst);
    city = inst.locationShort || null;
  }

  if (hospital.length > MAX_HOSPITAL) {
    return { error: "invalid-body" as const };
  }

  const row: JobInsert = {
    author_id: user.id,
    title,
    body,
    hospital,
    city,
    institution_slug: institutionSlug,
    status: "active",
  };

  let { error } = await supabase.from("jobs").insert(row as never);

  if (error?.message?.toLowerCase().includes("institution_slug")) {
    const { institution_slug: _slug, ...withoutSlug } = row as JobInsert & {
      institution_slug?: string;
    };
    ({ error } = await supabase.from("jobs").insert(withoutSlug as never));
  }

  if (error) {
    return { error: "insert-failed" as const };
  }

  revalidateJobs();
  return { success: true as const };
}

export async function markJobFilled(jobId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", jobId)
    .eq("author_id", user.id)
    .eq("status", "active");

  if (error) {
    return { error: "delete-failed" as const };
  }

  revalidateJobs();
  return { success: true as const };
}

const MAX_APPLICANT_NAME = 120;
const MAX_APPLICANT_NOTE = 500;

export async function submitJobApplication(jobId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const fullName = getString(formData, "fullName");
  const phoneRaw = getString(formData, "phone");
  const note = getString(formData, "note") || null;

  if (
    !fullName ||
    fullName.length > MAX_APPLICANT_NAME ||
    !phoneRaw ||
    (note && note.length > MAX_APPLICANT_NOTE)
  ) {
    return { error: "invalid-fields" as const };
  }

  if (!isHebrewDisplayName(fullName, MAX_APPLICANT_NAME)) {
    return { error: "invalid-name" as const };
  }

  if (!isValidIsraeliMobile(phoneRaw)) {
    return { error: "invalid-phone" as const };
  }

  const phone = normalizeIsraeliMobile(phoneRaw);

  const { data: job } = await supabase
    .from("jobs")
    .select("id, author_id, status")
    .eq("id", jobId)
    .maybeSingle<{ id: string; author_id: string; status: string }>();

  if (!job || job.status !== "active") {
    return { error: "job-unavailable" as const };
  }

  if (job.author_id === user.id) {
    return { error: "own-job" as const };
  }

  const { error } = await supabase.from("job_applications").insert({
    job_id: jobId,
    applicant_id: user.id,
    full_name: fullName,
    phone,
    note,
  } as never);

  if (error) {
    if (error.code === "23505") {
      return { error: "already-applied" as const };
    }
    if (error.message?.toLowerCase().includes("job_applications")) {
      return { error: "not-configured" as const };
    }
    return { error: "insert-failed" as const };
  }

  revalidateJobs();
  return { success: true as const };
}
