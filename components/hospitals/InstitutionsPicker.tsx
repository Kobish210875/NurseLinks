"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import {
  institutionHasActivity,
  type InstitutionActivityFlags,
  type InstitutionActivityMap,
} from "@/lib/data/institution-activity";
import { isProductionApp } from "@/lib/env/app-environment";
import {
  INSTITUTION_REGIONS,
  getInstitutionBySlug,
  getInstitutionsByRegionSorted,
  type InstitutionRegion,
} from "@/lib/data/medical-institutions";

type InstitutionsPickerProps = {
  activity: InstitutionActivityMap;
  activeSlug?: string;
  showLegend?: boolean;
  className?: string;
};

const splitActivityDots = !isProductionApp();

function InstitutionJobDot({ title }: { title: string }) {
  return (
    <span
      className="size-2 shrink-0 rounded-full bg-sky-400 ring-1 ring-sky-400/30"
      title={title}
      aria-label={title}
    />
  );
}

function InstitutionFriendDot({ title }: { title: string }) {
  return (
    <span
      className="size-2 shrink-0 rounded-full bg-pink-400 ring-1 ring-pink-400/30"
      title={title}
      aria-label={title}
    />
  );
}

function InstitutionActivityDot({ title }: { title: string }) {
  return (
    <span
      className="size-2 shrink-0 rounded-full bg-sky-400 ring-1 ring-sky-400/30"
      title={title}
      aria-label={title}
    />
  );
}

function InstitutionActivityIndicators({
  flags,
  jobTitle,
  friendTitle,
  combinedTitle,
}: {
  flags: InstitutionActivityFlags | undefined;
  jobTitle: string;
  friendTitle: string;
  combinedTitle: string;
}) {
  if (!flags) {
    return null;
  }

  if (splitActivityDots) {
    if (!flags.hasOpenJob && !flags.hasColleague) {
      return null;
    }

    return (
      <span className="inline-flex shrink-0 items-center gap-0.5">
        {flags.hasOpenJob ? <InstitutionJobDot title={jobTitle} /> : null}
        {flags.hasColleague ? <InstitutionFriendDot title={friendTitle} /> : null}
      </span>
    );
  }

  if (!institutionHasActivity(flags)) {
    return null;
  }

  return <InstitutionActivityDot title={combinedTitle} />;
}

export default function InstitutionsPicker({
  activity,
  activeSlug,
  showLegend = false,
  className = "",
}: InstitutionsPickerProps) {
  const t = useT();
  const regionLabelId = useId();
  const institutionListId = useId();
  const activeInstitution = activeSlug ? getInstitutionBySlug(activeSlug) : undefined;
  const [region, setRegion] = useState<InstitutionRegion>(
    activeInstitution?.region ?? "center",
  );

  useEffect(() => {
    if (activeInstitution) {
      setRegion(activeInstitution.region);
    }
  }, [activeInstitution]);

  const institutions = getInstitutionsByRegionSorted(region);
  const activeRegion = INSTITUTION_REGIONS.find((r) => r.id === region);

  return (
    <div
      className={`feed-card flex min-h-0 flex-col overflow-hidden p-4 text-start ${className}`}
    >
      <h2 className="mb-3 text-sm font-semibold text-foreground">{t("hospitals.sidebarTitle")}</h2>

      <div
        className="grid grid-cols-2 gap-2"
        role="tablist"
        aria-label={t("hospitals.regionsAria")}
      >
        {INSTITUTION_REGIONS.map((r) => {
          const selected = region === r.id;
          return (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="hospitals-institution-list"
              onClick={() => setRegion(r.id)}
              className={`rounded-lg border px-2 py-2 text-[11px] font-semibold leading-tight transition-colors ${
                selected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-primary/15 bg-primary/5 text-primary hover:border-primary/30 hover:bg-primary/10"
              }`}
            >
              {t(r.labelKey)}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col border-t border-border pt-3">
        <p className="mb-2 text-[11px] font-medium text-muted-foreground" id={regionLabelId}>
          {activeRegion ? t(activeRegion.labelKey) : ""}
          <span className="mx-1 text-border">·</span>
          <span className="font-normal">
            {t("hospitals.institutionsCount").replace("{count}", String(institutions.length))}
          </span>
        </p>

        <ul
          id={institutionListId}
          role="tabpanel"
          aria-labelledby={regionLabelId}
          className="flex min-h-0 flex-1 flex-wrap content-start gap-1.5 overflow-y-auto overscroll-contain pe-0.5"
        >
          {institutions.map((inst) => {
            const flags = activity[inst.slug];
            const isActive = activeSlug === inst.slug;

            return (
              <li key={inst.slug}>
                <Link
                  href={`/hospitals/${inst.slug}`}
                  prefetch={false}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-tight shadow-sm transition-colors ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-white text-muted-foreground hover:border-primary/30 hover:text-primary"
                  }`}
                >
                  <InstitutionActivityIndicators
                    flags={flags}
                    jobTitle={t("hospitals.activityDotJob")}
                    friendTitle={t("hospitals.activityDotFriend")}
                    combinedTitle={t("hospitals.activityDotLabel")}
                  />
                  <span className="whitespace-normal">{inst.shortLabel}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {showLegend ? (
          splitActivityDots ? (
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <InstitutionJobDot title={t("hospitals.activityLegendJob")} />
                <span>{t("hospitals.activityLegendJob")}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <InstitutionFriendDot title={t("hospitals.activityLegendFriend")} />
                <span>{t("hospitals.activityLegendFriend")}</span>
              </span>
            </p>
          ) : (
            <p className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
              <span
                className="size-2 shrink-0 rounded-full bg-sky-400 ring-1 ring-sky-400/30"
                aria-hidden="true"
              />
              <span>{t("hospitals.activityLegend")}</span>
            </p>
          )
        ) : null}
      </div>
    </div>
  );
}
