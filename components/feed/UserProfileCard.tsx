"use client";

import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { useT } from "@/components/i18n/LocaleProvider";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import type { CurrentUser } from "@/lib/auth/get-current-user";
import { formatProfileHeadline } from "@/lib/profile/display-professional";

type UserProfileCardProps = {
  user: CurrentUser;
};

function getProfileCompletionPercent(user: CurrentUser) {
  const fields = [
    user.headline,
    user.workplaceInstitutionSlug,
    user.licenseNumber,
    user.city,
    user.cvDraft.bio,
    user.cvDraft.experience,
    user.cvDraft.education,
    user.cvDraft.certifications,
  ];
  const filled = fields.filter((value) => value?.trim()).length;
  return Math.round((filled / fields.length) * 100);
}

export default function UserProfileCard({ user }: UserProfileCardProps) {
  const t = useT();
  const professionalLine = formatProfileHeadline(
    user.headline,
    user.workplaceInstitutionSlug,
    t("profile.institutionOther"),
  );
  const completionPercent = getProfileCompletionPercent(user);

  return (
    <div className="feed-card overflow-hidden">
      <div
        className="h-16 bg-gradient-to-r from-primary-dark/80 via-primary/60 to-accent/40"
        aria-hidden="true"
      />
      <div className="px-4 pb-4">
        <div className="-mt-9 mb-3">
          <ProfileAvatar
            avatarUrl={user.avatarUrl}
            initials={user.initials}
            name={user.fullName}
            editable
            profileHref="/profile"
          />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-foreground">{user.fullName}</h2>
          {professionalLine ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{professionalLine}</p>
          ) : (
            <p className="mt-0.5 text-sm text-primary">{t("profile.completeCv")}</p>
          )}
        </div>
        <Link
          href="/profile"
          className="mt-1.5 block text-center text-sm font-semibold text-foreground transition hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {t("profile.myProfile")} <span aria-hidden="true">-</span>{" "}
          <span dir="ltr">{completionPercent}%</span>
        </Link>
        <form action={signOut} className="mt-4">
          <button
            type="submit"
            className="w-full rounded-lg border border-border py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {t("profile.signOut")}
          </button>
        </form>
      </div>
    </div>
  );
}
