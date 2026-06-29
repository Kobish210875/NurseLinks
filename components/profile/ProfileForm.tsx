"use client";

import { saveProfile } from "@/app/profile/actions";
import { useT } from "@/components/i18n/LocaleProvider";
import type { CurrentUser } from "@/lib/auth/get-current-user";
import {
  PROFILE_CV_TEXT_MAX_LENGTH,
  PROFILE_HEADLINE_MAX_LENGTH,
  truncateHeadline,
} from "@/lib/profile/field-limits";
import { useEffect, useId, useRef, useState } from "react";
import NursingEducationSelect from "./NursingEducationSelect";
import ProfileAvatar from "./ProfileAvatar";
import WorkExperienceSection from "./WorkExperienceSection";
import ProfileFormActions from "./ProfileFormActions";
import OnboardingTabsDialog from "./OnboardingTabsDialog";
import { normalizeWorkExperiences } from "@/lib/profile/work-experience";
import { notifyInstitutionActivityChanged } from "@/lib/client/sync-events";

const fieldClassName =
  "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15";

type ProfileFormProps = {
  user: CurrentUser;
  saved?: boolean;
  onboarding?: boolean;
  error?: string | null;
};

export default function ProfileForm({ user, saved, onboarding, error }: ProfileFormProps) {
  const t = useT();
  const professionId = useId();
  const certificationsId = useId();
  const { cvDraft } = user;
  const workExperiences = normalizeWorkExperiences(cvDraft.workExperiences);
  const educationLevel = cvDraft.educationLevel ?? "";
  const [formKey, setFormKey] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const savedHandledRef = useRef(false);
  const onboardingHandledRef = useRef(false);

  useEffect(() => {
    if (!saved || savedHandledRef.current) {
      return;
    }
    savedHandledRef.current = true;
    setIsDirty(false);
    setFormKey((k) => k + 1);
    notifyInstitutionActivityChanged();
    window.history.replaceState(null, "", "/profile");

    const scrollToPageTop = () => {
      document.getElementById("profile-page-top")?.scrollIntoView({ block: "start", behavior: "instant" });
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    requestAnimationFrame(() => {
      scrollToPageTop();
      window.setTimeout(scrollToPageTop, 0);
      window.setTimeout(scrollToPageTop, 100);
    });
  }, [saved]);

  useEffect(() => {
    if (!onboarding || onboardingHandledRef.current) {
      return;
    }
    onboardingHandledRef.current = true;
    setOnboardingOpen(true);
    window.history.replaceState(null, "", "/profile");
  }, [onboarding]);

  function markDirty() {
    setIsDirty(true);
  }

  function handleCancel() {
    setFormKey((k) => k + 1);
    setIsDirty(false);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="feed-card p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <ProfileAvatar
            avatarUrl={user.avatarUrl}
            initials={user.initials}
            name={user.fullName}
            editable
            sizeClassName="size-32 text-3xl"
          />
          <div className="text-center sm:text-start">
            <h1 className="text-xl font-bold text-foreground">{user.fullName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("profile.subtitle")}</p>
          </div>
        </div>
      </div>

      <form key={formKey} action={saveProfile} className="space-y-6" onChange={markDirty}>
      {saved ? (
        <p className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground">
          {t("profile.saved")}
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="feed-card space-y-5 p-6">
        <h2 className="text-sm font-semibold text-foreground">{t("profile.sectionPersonal")}</h2>

        <div className="grid gap-1.5">
          <label htmlFor={professionId} className="text-sm font-medium text-foreground">
            {t("profile.profession")}
          </label>
          <input
            id={professionId}
            name="profession"
            type="text"
            maxLength={PROFILE_HEADLINE_MAX_LENGTH}
            defaultValue={truncateHeadline(user.headline ?? "")}
            className={fieldClassName}
            placeholder={t("profile.professionPlaceholder")}
          />
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-foreground">{t("profile.education")}</label>
          <NursingEducationSelect
            defaultValue={educationLevel}
            placeholder={t("profile.educationPlaceholder")}
            onChange={markDirty}
          />
        </div>

        <div className="grid gap-1.5">
          <span className="text-sm font-medium text-foreground">{t("profile.experience")}</span>
          <WorkExperienceSection defaultEntries={workExperiences} onChange={markDirty} />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor={certificationsId} className="text-sm font-medium text-foreground">
            {t("profile.certifications")}
          </label>
          <textarea
            id={certificationsId}
            name="certifications"
            rows={4}
            maxLength={PROFILE_CV_TEXT_MAX_LENGTH}
            defaultValue={cvDraft.certifications ?? ""}
            className={`${fieldClassName} break-words`}
          />
        </div>
      </div>

      <ProfileFormActions isDirty={isDirty} onCancel={handleCancel} />
      </form>

      <OnboardingTabsDialog open={onboardingOpen} onClose={() => setOnboardingOpen(false)} />
    </div>
  );
}
