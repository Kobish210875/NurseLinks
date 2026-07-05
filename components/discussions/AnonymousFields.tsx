"use client";

import { useT } from "@/components/i18n/LocaleProvider";

type AnonymousFieldsProps = {
  idPrefix: string;
  isAnonymous: boolean;
  onAnonymousChange: (value: boolean) => void;
  anonymousLabel: string;
  onAnonymousLabelChange: (value: string) => void;
};

export default function AnonymousFields({
  idPrefix,
  isAnonymous,
  onAnonymousChange,
  anonymousLabel,
  onAnonymousLabelChange,
}: AnonymousFieldsProps) {
  const t = useT();
  const checkboxId = `${idPrefix}-anonymous`;

  return (
    <div className="space-y-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
      <label htmlFor={checkboxId} className="flex cursor-pointer items-start gap-2 text-sm">
        <input
          id={checkboxId}
          name="isAnonymous"
          type="checkbox"
          checked={isAnonymous}
          onChange={(event) => onAnonymousChange(event.target.checked)}
          className="mt-0.5 size-4 rounded border-border text-primary"
        />
        <span>
          <span className="font-medium text-foreground">{t("discussions.postAnonymously")}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {t("discussions.postAnonymouslyHint")}
          </span>
        </span>
      </label>

      {isAnonymous ? (
        <div>
          <label htmlFor={`${idPrefix}-anon-label`} className="mb-1 block text-xs text-muted-foreground">
            {t("discussions.anonymousLabelOptional")}
          </label>
          <input
            id={`${idPrefix}-anon-label`}
            name="anonymousLabel"
            type="text"
            value={anonymousLabel}
            onChange={(event) => onAnonymousLabelChange(event.target.value)}
            maxLength={80}
            placeholder={t("discussions.anonymousLabelPlaceholder")}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary/40"
          />
        </div>
      ) : null}
    </div>
  );
}
