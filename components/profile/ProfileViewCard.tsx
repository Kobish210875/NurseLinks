"use client";

import Link from "next/link";
import { removeConnection, sendConnectionRequest, cancelConnectionRequest } from "@/app/actions/connections";
import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { getCityDisplayName } from "@/lib/data/israeli-cities";
import type { ProfileView } from "@/lib/data/profile-view";
import type { ConnectionStatus } from "@/lib/network/types";
import { formatFeedTimestamp } from "@/lib/i18n/format-feed-time";
import { formatProfileHeadline } from "@/lib/profile/display-professional";
import { useEffect, useState, useTransition } from "react";

type ProfileViewCardProps = {
  profile: ProfileView;
  isOwnProfile: boolean;
};

export default function ProfileViewCard({ profile, isOwnProfile }: ProfileViewCardProps) {
  const t = useT();
  const { locale } = useLocale();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    profile.connectionStatus,
  );
  const [pendingConnect, startConnect] = useTransition();
  const [pendingRemove, startRemove] = useTransition();
  const [pendingCancel, startCancel] = useTransition();

  useEffect(() => {
    setConnectionStatus(profile.connectionStatus);
  }, [profile.connectionStatus, profile.id]);
  const cityLabel = profile.city ? getCityDisplayName(profile.city, locale) : null;
  const professionalLine = formatProfileHeadline(
    profile.headline,
    profile.workplaceInstitutionSlug,
    t("profile.institutionOther"),
  );
  const { cvDraft } = profile;

  const cvSections = [
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
              <p className="mt-1 break-words text-sm text-muted-foreground">{professionalLine}</p>
            ) : null}
            {!isOwnProfile && connectionStatus === "connected" && profile.connectedAt ? (
              <p className="mt-2 text-xs text-muted-foreground">
                <time dateTime={profile.connectedAt}>
                  {t("network.connectedOn")}{" "}
                  {formatFeedTimestamp(profile.connectedAt, locale)}
                </time>
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-end">
          {isOwnProfile ? (
            <Link
              href="/profile"
              className="rounded-full border border-primary px-4 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/5"
            >
              {t("profile.editProfile")}
            </Link>
          ) : null}
          {!isOwnProfile ? (
            <Link
              href={`/messages/${profile.id}`}
              className="rounded-full border border-primary bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              {t("network.message")}
            </Link>
          ) : null}
          {!isOwnProfile && connectionStatus === "connected" ? (
            <button
              type="button"
              disabled={pendingRemove}
              onClick={() => {
                if (!window.confirm(t("network.removeFriendConfirm"))) {
                  return;
                }
                startRemove(async () => {
                  const result = await removeConnection(profile.id);
                  if (!result || typeof result !== "object" || !("error" in result)) {
                    setConnectionStatus("none");
                  }
                });
              }}
              className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
            >
              {pendingRemove ? "..." : t("network.removeFriend")}
            </button>
          ) : null}
          {!isOwnProfile && connectionStatus === "none" ? (
            <button
              type="button"
              disabled={pendingConnect}
              onClick={() =>
                startConnect(async () => {
                  const result = await sendConnectionRequest(profile.id);
                  if (!result || typeof result !== "object" || !("error" in result)) {
                    setConnectionStatus(
                      result && typeof result === "object" && "accepted" in result && result.accepted
                        ? "connected"
                        : "pending_out",
                    );
                  }
                })
              }
              className="rounded-full border border-primary px-4 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/5"
            >
              {pendingConnect ? "..." : t("network.connect")}
            </button>
          ) : null}
          {!isOwnProfile && connectionStatus === "pending_out" ? (
            <button
              type="button"
              disabled={pendingCancel}
              onClick={() =>
                startCancel(async () => {
                  const result = await cancelConnectionRequest(profile.id);
                  if (!result || typeof result !== "object" || !("error" in result)) {
                    setConnectionStatus("none");
                  }
                })
              }
              className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
            >
              {pendingCancel ? "..." : t("network.cancelRequest")}
            </button>
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
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
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
