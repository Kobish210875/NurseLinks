"use client";

import Link from "next/link";
import { useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import {
  INSTITUTION_REGIONS,
  getInstitutionsByRegionSorted,
  type InstitutionRegion,
} from "@/lib/data/medical-institutions";

export default function HospitalsSidebar() {
  const t = useT();
  const [region, setRegion] = useState<InstitutionRegion>("center");
  const institutions = getInstitutionsByRegionSorted(region);
  const activeRegion = INSTITUTION_REGIONS.find((r) => r.id === region);

  return (
    <div className="feed-card flex min-h-[28rem] flex-col p-4 text-start lg:max-h-[calc(100dvh-5rem)] lg:min-h-0">
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
              className={`rounded-lg border px-2 py-2 text-[11px] font-semibold leading-tight transition-all ${
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
        <p className="mb-2 text-[11px] font-medium text-muted-foreground" id="hospitals-region-label">
          {activeRegion ? t(activeRegion.labelKey) : ""}
          <span className="mx-1 text-border">·</span>
          <span className="font-normal">
            {t("hospitals.institutionsCount").replace("{count}", String(institutions.length))}
          </span>
        </p>

        <ul
          id="hospitals-institution-list"
          role="tabpanel"
          aria-labelledby="hospitals-region-label"
          className="flex min-h-0 flex-1 flex-wrap content-start gap-2 overflow-y-auto pe-0.5"
        >
          {institutions.map((inst) => (
            <li key={inst.slug}>
              <Link
                href={`/hospitals/${inst.slug}`}
                className="inline-block rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:text-primary"
              >
                {inst.shortLabel}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
