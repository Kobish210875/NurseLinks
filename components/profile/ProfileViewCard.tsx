"use client";

import Link from "next/link";
import { sendConnectionRequest } from "@/app/actions/connections";
import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { getCityDisplayName } from "@/lib/data/israeli-cities";
import type { ProfileView } from "@/lib/data/profile-view";
import { formatFeedTimestamp } from "@/lib/i18n/format-feed-time";
import { formatProfileHeadline } from "@/lib/profile/display-professional";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type ProfileViewCardProps = {
  profile: ProfileView;
  isOwnProfile: boolean;
};

export default function ProfileViewCard({ profile, isOwnProfile }: ProfileViewCardProps) {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const [pendingConnect, startConnect] = useTransition();
  const cityLabel = profile.city ? getCityDisplayName(profile.city, locale) : null;
  const professionalLine = formatProfileHeadline(
    profile.headline,
    profile.workplaceInstitutionSlug,
    t("profile.institutionOther"),
  );
  const { cvDraft } = profile;

  const cvSections = [
    ["bio", "profile.bio", cvDraft.bio],
    ["experience", "profile.experience", cvDraft.experience],
    ["education", "profile.education", cvDraft.education],
    ["certifications", "profile.certifications", cvDraft.certifications],
  ] as const;

  const hasCv = cvSections.some(([, , value]) => value?.trim());
  const hasCvBlock = hasCv || Boolean(cityLabel);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="feed-card p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <ProfileAvatar
            avatarUrl={profile.avatarUrl}
            initials={profile.initials}
            name={profile.fullName}
            editable={isOwnProfile}
            sizeClassName="size-32 text-3xl"
          />
          <div className="min-w-0 flex-1 text-center sm:text-start">
            <h1 className="text-xl font-bold text-foreground">{profile.fullName}</h1>
            {professionalLine ? (
              <p className="mt-1 text-sm text-muted-foreground">{professionalLine}</p>
            ) : null}
            {profile.licenseNumber ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("profile.licenseNumber")}: {profile.licenseNumber}
              </p>
            ) : null}
            {!isOwnProfile && profile.connectionStatus === "connected" && profile.connectedAt ? (
              <p className="mt-2 text-xs text-muted-foreground">
                <time dateTime={profile.connectedAt}>
                  {t("network.connectedOn")}{" "}
                  {formatFeedTimestamp(profile.connectedAt, locale)}
                </time>
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
          {isOwnProfile ? (
            <Link
              href="/profile"
              className="rounded-full border border-primary px-4 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/5"
            >
              {t("profile.editProfile")}
            </Link>
          ) : null}
          {!isOwnProfile && profile.connectionStatus === "connected" ? (
            <Link
              href={`/messages/${profile.id}`}
              className="rounded-full border border-primary bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              {t("network.message")}
            </Link>
          ) : null}
          {!isOwnProfile && profile.connectionStatus === "none" ? (
            <button
              type="button"
              disabled={pendingConnect}
              onClick={() =>
                startConnect(async () => {
                  const result = await sendConnectionRequest(profile.id);
                  if (!result || typeof result !== "object" || !("error" in result)) {
                    router.refresh();
                  }
                })
              }
              className="rounded-full border border-primary px-4 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/5"
            >
              {pendingConnect ? "..." : t("network.connect")}
            </button>
          ) : null}
          {!isOwnProfile && profile.connectionStatus === "pending_out" ? (
            <Link
              href={`/network?q=${encodeURIComponent(profile.fullName)}`}
              className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted/60"
            >
              {t("network.pending")}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="feed-card space-y-5 p-6">
        <h2 className="text-sm font-semibold text-foreground">{t("profile.sectionCv")}</h2>

        {!hasCvBlock ? (
          <p className="text-sm text-muted-foreground">
            {isOwnProfile ? t("profile.cvEmptyOwn") : t("profile.cvEmptyOther")}
          </p>
        ) : (
          <>
            {cityLabel ? (
              <section className="text-start">
                <h3 className="text-sm font-medium text-foreground">{t("profile.residenceCity")}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{cityLabel}</p>
              </section>
            ) : null}
            {cvSections.map(([key, labelKey, value]) =>
              value?.trim() ? (
                <section key={key} className="text-start">
                  <h3 className="text-sm font-medium text-foreground">{t(labelKey)}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {value}
                  </p>
                </section>
              ) : null,
            )}
          </>
        )}
      </div>
    </div>
  );
}
