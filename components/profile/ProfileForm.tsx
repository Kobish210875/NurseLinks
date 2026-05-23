"use client";

import { saveProfile } from "@/app/profile/actions";
import CityCombobox from "@/components/register/CityCombobox";
import { useT } from "@/components/i18n/LocaleProvider";
import type { CurrentUser } from "@/lib/auth/get-current-user";
import { useEffect, useState } from "react";
import InstitutionSelect from "./InstitutionSelect";
import ProfileAvatar from "./ProfileAvatar";

const fieldClassName =
  "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15";

type ProfileFormProps = {
  user: CurrentUser;
  saved?: boolean;
  error?: string | null;
};

export default function ProfileForm({ user, saved, error }: ProfileFormProps) {
  const t = useT();
  const { cvDraft } = user;
  const [formKey, setFormKey] = useState(0);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (saved) {
      setIsDirty(false);
      setFormKey((k) => k + 1);
    }
  }, [saved]);

  function markDirty() {
    setIsDirty(true);
  }

  function handleCancel() {
    setFormKey((k) => k + 1);
    setIsDirty(false);
  }

  return (
    <form
      key={formKey}
      action={saveProfile}
      className="mx-auto max-w-xl space-y-6"
      onChange={markDirty}
    >
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

      {saved ? (
        <p className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground">
          {t("profile.saved")}
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="feed-card space-y-5 p-6">
        <h2 className="text-sm font-semibold text-foreground">{t("profile.sectionBasic")}</h2>

        <div className="grid gap-1.5">
          <label htmlFor="profession" className="text-sm font-medium text-foreground">
            {t("profile.profession")}
          </label>
          <input
            id="profession"
            name="profession"
            type="text"
            defaultValue={user.headline ?? ""}
            className={fieldClassName}
            placeholder={t("profile.professionPlaceholder")}
          />
        </div>

        <InstitutionSelect
          defaultSlug={user.workplaceInstitutionSlug}
          onChange={markDirty}
        />

        <div className="grid gap-1.5">
          <label htmlFor="licenseNumber" className="text-sm font-medium text-foreground">
            {t("profile.licenseNumber")}
          </label>
          <input
            id="licenseNumber"
            name="licenseNumber"
            type="text"
            defaultValue={user.licenseNumber ?? ""}
            className={fieldClassName}
          />
        </div>

        <CityCombobox
          defaultCityHe={user.city ?? ""}
          required={false}
          onChange={markDirty}
        />
      </div>

      <div className="feed-card space-y-5 p-6">
        <h2 className="text-sm font-semibold text-foreground">{t("profile.sectionCv")}</h2>

        {(
          [
            ["bio", "profile.bio", cvDraft.bio],
            ["experience", "profile.experience", cvDraft.experience],
            ["education", "profile.education", cvDraft.education],
            ["certifications", "profile.certifications", cvDraft.certifications],
          ] as const
        ).map(([name, labelKey, defaultValue]) => (
          <div key={name} className="grid gap-1.5">
            <label htmlFor={name} className="text-sm font-medium text-foreground">
              {t(labelKey)}
            </label>
            <textarea
              id={name}
              name={name}
              rows={4}
              defaultValue={defaultValue ?? ""}
              className={fieldClassName}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!isDirty}
          className={`rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 ${
            isDirty ? "flex-1" : "w-full"
          }`}
        >
          {isDirty ? t("profile.save") : t("profile.update")}
        </button>
        {isDirty ? (
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 rounded-lg border border-border bg-white py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {t("profile.cancel")}
          </button>
        ) : null}
      </div>
    </form>
  );
}
