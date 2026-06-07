"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import {
  institutionHasActivity,
  type InstitutionActivityMap,
} from "@/lib/data/institution-activity";
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

function InstitutionActivityDot({ title }: { title: string }) {
  return (
    <span
      className="size-2 shrink-0 rounded-full bg-sky-400 ring-1 ring-sky-400/30"
      title={title}
      aria-label={title}
    />
  );
}

type InstitutionLabelTier = "short" | "medium" | "long";

/** Pastel tiers by label length — short/medium/long pills read as intentional, not random. */
function institutionLabelTier(label: string): InstitutionLabelTier {
  const len = label.length;
  if (len <= 6) {
    return "short";
  }
  if (len <= 13) {
    return "medium";
  }
  return "long";
}

function institutionBubbleClasses(tier: InstitutionLabelTier, isActive: boolean, hasActivity: boolean) {
  if (isActive) {
    return "border-primary bg-primary/10 text-primary";
  }

  const activityRing = hasActivity ? "ring-1 ring-sky-300/40" : "";

  switch (tier) {
    case "short":
      return `border-teal-200/90 bg-teal-50/95 text-teal-900 hover:border-teal-300 hover:bg-teal-50 ${activityRing}`;
    case "medium":
      return `border-primary/20 bg-primary/[0.06] text-foreground hover:border-primary/35 hover:bg-primary/10 ${activityRing}`;
    case "long":
      return `border-amber-200/80 bg-amber-50/90 text-foreground hover:border-amber-300/90 hover:bg-amber-50 ${activityRing}`;
  }
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
          className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2 overflow-y-auto overscroll-contain pe-0.5"
        >
          {institutions.map((inst) => {
            const flags = activity[inst.slug];
            const showDot = institutionHasActivity(flags);
            const isActive = activeSlug === inst.slug;

            return (
              <li key={inst.slug} className="min-w-0">
                <Link
                  href={`/hospitals/${inst.slug}`}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex w-full min-h-[2rem] items-center justify-center gap-1.5 rounded-full border px-2.5 py-1.5 text-center text-xs font-medium leading-snug shadow-sm transition-colors ${institutionBubbleClasses(
                    institutionLabelTier(inst.shortLabel),
                    isActive,
                    showDot,
                  )}`}
                >
                  {showDot ? (
                    <InstitutionActivityDot title={t("hospitals.activityDotLabel")} />
                  ) : null}
                  <span className="min-w-0 break-words">{inst.shortLabel}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {showLegend ? (
          <p className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
            <span
              className="size-2 shrink-0 rounded-full bg-sky-400 ring-1 ring-sky-400/30"
              aria-hidden="true"
            />
            <span>{t("hospitals.activityLegend")}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
