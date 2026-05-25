"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidIsraeliCity, resolveCityCanonical } from "@/lib/data/israeli-cities";
import { isAllowedAvatarFile, resolveAvatarContentType } from "@/lib/images/avatar-file";
import { isValidProfileInstitutionSlug } from "@/lib/data/medical-institutions";
import {
  isMissingWorkplaceColumnError,
  mergeCvDraftWithWorkplace,
} from "@/lib/profile/workplace";
import { updateProfile, type ProfileUpdate } from "@/lib/supabase/profiles";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "no-file" as const };
  }

  if (!isAllowedAvatarFile(file, MAX_AVATAR_BYTES)) {
    return { error: "invalid-file" as const };
  }

  const contentType = resolveAvatarContentType(file)!;
  const path = `${user.id}/avatar.jpg`;

  const fileBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, fileBuffer, { upsert: true, contentType });

  if (uploadError) {
    const code = uploadError.message.toLowerCase();
    if (code.includes("bucket") || code.includes("not found")) {
      return { error: "storage-not-configured" as const };
    }
    return { error: "upload-failed" as const };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const avatarUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: profileError } = await updateProfile(user.id, { avatar_url: avatarUrl });

  if (profileError) {
    return { error: "profile-update-failed" as const };
  }

  revalidatePath("/home");
  revalidatePath("/profile");

  return { success: true as const, avatarUrl };
}

export type CvDraft = {
  bio?: string;
  experience?: string;
  education?: string;
  certifications?: string;
  workplace_institution_slug?: string;
};

export async function saveProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const profession = getRequiredString(formData, "profession");
  const institutionSlug = getRequiredString(formData, "workplaceInstitution");
  const licenseNumber = getRequiredString(formData, "licenseNumber");
  const cityInput = getRequiredString(formData, "city");
  const bio = getRequiredString(formData, "bio");
  const experience = getRequiredString(formData, "experience");
  const education = getRequiredString(formData, "education");
  const certifications = getRequiredString(formData, "certifications");

  let city: string | null = null;
  if (cityInput) {
    const cityHe = resolveCityCanonical(cityInput);
    if (!cityHe || !isValidIsraeliCity(cityHe)) {
      redirect("/profile?error=invalid-city");
    }
    city = cityHe;
  }

  let workplaceInstitutionSlug: string | null = null;
  if (institutionSlug) {
    if (!isValidProfileInstitutionSlug(institutionSlug)) {
      redirect("/profile?error=invalid-institution");
    }
    workplaceInstitutionSlug = institutionSlug;
  }

  const cvDraft = mergeCvDraftWithWorkplace(
    { bio, experience, education, certifications },
    workplaceInstitutionSlug,
  );

  const baseUpdate: ProfileUpdate = {
    headline: profession || null,
    license_number: licenseNumber || null,
    city,
    cv_draft: cvDraft as ProfileUpdate["cv_draft"],
  };

  let { error: profileError } = await updateProfile(user.id, {
    ...baseUpdate,
    workplace_institution_slug: workplaceInstitutionSlug,
  });

  if (profileError && isMissingWorkplaceColumnError(profileError.message)) {
    ({ error: profileError } = await updateProfile(user.id, baseUpdate));
  }

  if (profileError) {
    redirect("/profile?error=save-failed");
  }

  await supabase.auth.updateUser({
    data: { cv_draft: cvDraft },
  });

  revalidatePath("/home");
  revalidatePath("/profile");
  revalidatePath(`/profile/${user.id}`);
  if (workplaceInstitutionSlug && workplaceInstitutionSlug !== "other") {
    revalidatePath(`/hospitals/${workplaceInstitutionSlug}`);
  }
  redirect("/profile?saved=1");
}

export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const now = new Date().toISOString();
  const deletedProfile: ProfileUpdate = {
    full_name: "משתמש שנמחק",
    headline: null,
    workplace_institution_slug: null,
    license_number: null,
    city: null,
    avatar_url: null,
    cv_draft: {},
    deleted_at: now,
    updated_at: now,
  };

  const [connectionsRes, followsRes] = await Promise.all([
    supabase
      .from("connections")
      .delete()
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
    supabase
      .from("follows")
      .delete()
      .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`),
  ]);

  if (connectionsRes.error || followsRes.error) {
    redirect("/profile?error=delete-not-configured");
  }

  const { error: profileError } = await updateProfile(user.id, deletedProfile);
  if (profileError) {
    const message = profileError.message.toLowerCase();
    if (message.includes("deleted_at")) {
      redirect("/profile?error=delete-not-configured");
    }
    redirect("/profile?error=delete-failed");
  }

  await Promise.all([
    supabase.from("user_specialties").delete().eq("user_id", user.id),
    supabase.from("user_workplaces").delete().eq("user_id", user.id),
    supabase.from("job_list_views").delete().eq("user_id", user.id),
    supabase.storage.from("avatars").remove([`${user.id}/avatar.jpg`]),
  ]);

  await supabase.auth.signOut({ scope: "local" });

  revalidatePath("/home");
  revalidatePath("/network");
  revalidatePath("/messages");
  revalidatePath("/", "layout");
  redirect("/");
}
