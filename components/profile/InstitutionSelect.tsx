"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import { getInstitutionBySlug, INSTITUTION_OTHER_SLUG } from "@/lib/data/medical-institutions";
import {
  getInstitutionOptionBySlug,
  getProfileInstitutionOptions,
} from "@/lib/data/profile-institutions";
import { institutionCityLabel } from "@/lib/profile/display-professional";
import { useEffect, useId, useRef, useState } from "react";

const triggerClassName =
  "institution-select-trigger flex w-full max-w-full items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 py-2.5 text-base outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15 md:text-sm";

type InstitutionSelectProps = {
  defaultSlug?: string | null;
  name?: string;
  labelKey?: string;
  placeholderKey?: string;
  showOther?: boolean;
  /** Show hospital with city (e.g. אסותא, תל אביב). */
  showCity?: boolean;
  disabled?: boolean;
  /** Unique id for the listbox trigger (avoids duplicate ids when multiple selects mount). */
  triggerId?: string;
  onChange?: () => void;
  onSlugChange?: (slug: string) => void;
};

export default function InstitutionSelect({
  defaultSlug,
  name = "workplaceInstitution",
  labelKey = "profile.medicalInstitution",
  placeholderKey = "profile.institutionPlaceholder",
  showOther = true,
  showCity = false,
  disabled = false,
  triggerId: triggerIdProp,
  onChange,
  onSlugChange,
}: InstitutionSelectProps) {
  const t = useT();
  const listId = useId();
  const defaultTriggerId = useId();
  const triggerId = triggerIdProp ?? defaultTriggerId;
  const containerRef = useRef<HTMLDivElement>(null);
  const options = getProfileInstitutionOptions();
  const [slug, setSlug] = useState(defaultSlug ?? "");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setSlug(defaultSlug ?? "");
  }, [defaultSlug]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const selected = slug ? getInstitutionOptionBySlug(slug) : null;
  const selectedInst = slug ? getInstitutionBySlug(slug) : undefined;
  const triggerLabel =
    slug === INSTITUTION_OTHER_SLUG
      ? t("profile.institutionOther")
      : showCity && selectedInst
        ? institutionCityLabel(selectedInst)
        : (selected?.shortLabel ?? null);

  return (
    <div ref={containerRef} className="relative grid gap-1.5">
      <label id={`${listId}-label`} className="text-sm font-medium text-foreground">
        {t(labelKey)}
      </label>

      <input type="hidden" name={name} value={slug} />

      <button
        type="button"
        id={triggerId}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={`${listId}-label`}
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        className={`${triggerClassName} text-start disabled:opacity-60 ${triggerLabel ? "text-foreground" : "text-muted-foreground"}`}
      >
        <span className="min-w-0 truncate">
          {triggerLabel ?? t(placeholderKey)}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`shrink-0 text-muted-foreground transition ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={`${listId}-label`}
          className="absolute start-0 end-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-white py-1 shadow-lg"
        >
          {options.map((inst) => (
            <li key={inst.slug} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={slug === inst.slug}
                onClick={() => {
                  setSlug(inst.slug);
                  setIsOpen(false);
                  onSlugChange?.(inst.slug);
                  onChange?.();
                }}
                className={`w-full px-3 py-2 text-start text-sm transition hover:bg-muted/60 ${
                  slug === inst.slug ? "bg-primary/10 font-medium text-primary" : "text-foreground"
                }`}
              >
                {showCity ? institutionCityLabel(inst) : inst.shortLabel}
              </button>
            </li>
          ))}
          {showOther ? (
            <li role="presentation" className="border-t border-border">
              <button
                type="button"
                role="option"
                aria-selected={slug === INSTITUTION_OTHER_SLUG}
                disabled={disabled}
                onClick={() => {
                  setSlug(INSTITUTION_OTHER_SLUG);
                  setIsOpen(false);
                  onSlugChange?.(INSTITUTION_OTHER_SLUG);
                  onChange?.();
                }}
                className={`w-full px-3 py-2 text-start text-sm transition hover:bg-muted/60 ${
                  slug === INSTITUTION_OTHER_SLUG
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-foreground"
                }`}
              >
                {t("profile.institutionOther")}
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
