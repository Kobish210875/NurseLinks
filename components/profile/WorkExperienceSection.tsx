"use client";

import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import InstitutionSelect from "@/components/profile/InstitutionSelect";
import {
  createEmptyWorkExperience,
  formatExperienceDateLine,
  getOrganizationLabel,
  HEBREW_MONTHS,
  MAX_WORK_EXPERIENCES,
  type WorkExperienceEntry,
} from "@/lib/profile/work-experience";
import { useEffect, useId, useState } from "react";

const fieldClassName =
  "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15";

type WorkExperienceSectionProps = {
  defaultEntries?: WorkExperienceEntry[];
  onChange?: () => void;
};

function yearOptions() {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current + 1; y >= 1970; y -= 1) {
    years.push(y);
  }
  return years;
}

export default function WorkExperienceSection({
  defaultEntries = [],
  onChange,
}: WorkExperienceSectionProps) {
  const t = useT();
  const { locale } = useLocale();
  const formId = useId();
  const [entries, setEntries] = useState<WorkExperienceEntry[]>(defaultEntries);
  const [draft, setDraft] = useState<WorkExperienceEntry | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setEntries(defaultEntries);
  }, [defaultEntries]);

  const years = yearOptions();

  function notifyChange(next: WorkExperienceEntry[]) {
    setEntries(next);
    onChange?.();
  }

  function startAdd() {
    setEditingId(null);
    setDraft(createEmptyWorkExperience());
  }

  function startEdit(entry: WorkExperienceEntry) {
    setDraft({ ...entry });
    setEditingId(entry.id);
  }

  function cancelDraft() {
    setDraft(null);
    setEditingId(null);
  }

  function updateDraft(patch: Partial<WorkExperienceEntry>) {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function saveDraft() {
    if (!draft?.jobTitle.trim() || !draft.organizationSlug) {
      return;
    }
    if (editingId) {
      notifyChange(entries.map((e) => (e.id === editingId ? draft : e)));
    } else if (entries.length < MAX_WORK_EXPERIENCES) {
      notifyChange([draft, ...entries]);
    }
    cancelDraft();
  }

  function removeEntry(id: string) {
    notifyChange(entries.filter((e) => e.id !== id));
    if (editingId === id) {
      cancelDraft();
    }
  }

  return (
    <div className="space-y-4" dir="rtl">
      <input type="hidden" name="workExperiences" value={JSON.stringify(entries)} />

      {entries.length > 0 ? (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 text-start">
                  <p className="font-semibold text-foreground">{entry.jobTitle}</p>
                  <p className="mt-0.5 text-sm text-foreground">
                    {getOrganizationLabel(entry.organizationSlug, t("profile.institutionOther"))}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatExperienceDateLine(entry, locale)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(entry)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {t("profile.workExp.edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    {t("profile.workExp.remove")}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("profile.workExp.empty")}</p>
      )}

      {draft ? (
        <div className="space-y-4 rounded-lg border border-primary/25 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-foreground">
            {editingId ? t("profile.workExp.editRole") : t("profile.workExp.addRole")}
          </p>

          <div className="grid gap-1.5">
            <label htmlFor={`${formId}-title`} className="text-sm font-medium text-foreground">
              {t("profile.workExp.jobTitle")} *
            </label>
            <input
              id={`${formId}-title`}
              type="text"
              maxLength={120}
              value={draft.jobTitle}
              onChange={(e) => updateDraft({ jobTitle: e.target.value })}
              className={fieldClassName}
              placeholder={t("profile.workExp.jobTitlePlaceholder")}
            />
          </div>

          <InstitutionSelect
            defaultSlug={draft.organizationSlug || null}
            name={`_workExpOrg_${draft.id}`}
            labelKey="profile.workExp.organization"
            onChange={() => undefined}
            onSlugChange={(slug) => updateDraft({ organizationSlug: slug })}
          />

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={draft.isCurrent}
              onChange={(e) =>
                updateDraft({
                  isCurrent: e.target.checked,
                  endMonth: e.target.checked ? null : draft.endMonth ?? draft.startMonth,
                  endYear: e.target.checked ? null : draft.endYear ?? draft.startYear,
                })
              }
              className="size-4 rounded border-border text-primary focus:ring-primary/30"
            />
            {t("profile.workExp.currentRole")}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <span className="text-sm font-medium text-foreground">
                {t("profile.workExp.startDate")} *
              </span>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={draft.startMonth}
                  onChange={(e) => updateDraft({ startMonth: Number(e.target.value) })}
                  className={fieldClassName}
                  dir="rtl"
                >
                  {HEBREW_MONTHS.map((label, index) => (
                    <option key={label} value={index + 1}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  value={draft.startYear}
                  onChange={(e) => updateDraft({ startYear: Number(e.target.value) })}
                  className={fieldClassName}
                  dir="rtl"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!draft.isCurrent ? (
              <div className="grid gap-1.5">
                <span className="text-sm font-medium text-foreground">
                  {t("profile.workExp.endDate")} *
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={draft.endMonth ?? ""}
                    onChange={(e) => updateDraft({ endMonth: Number(e.target.value) })}
                    className={fieldClassName}
                    dir="rtl"
                  >
                    <option value="">{t("profile.workExp.selectPlaceholder")}</option>
                    {HEBREW_MONTHS.map((label, index) => (
                      <option key={label} value={index + 1}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={draft.endYear ?? ""}
                    onChange={(e) => updateDraft({ endYear: Number(e.target.value) })}
                    className={fieldClassName}
                    dir="rtl"
                  >
                    <option value="">{t("profile.workExp.selectPlaceholder")}</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveDraft}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              {t("profile.workExp.saveRole")}
            </button>
            <button
              type="button"
              onClick={cancelDraft}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground"
            >
              {t("profile.cancel")}
            </button>
          </div>
        </div>
      ) : entries.length < MAX_WORK_EXPERIENCES ? (
        <button
          type="button"
          onClick={startAdd}
          className="rounded-lg border border-dashed border-primary/40 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5"
        >
          + {t("profile.workExp.addRole")}
        </button>
      ) : null}
    </div>
  );
}
