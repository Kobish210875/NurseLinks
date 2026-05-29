"use client";

import { reportContent } from "@/app/actions/moderation";
import { useT } from "@/components/i18n/LocaleProvider";
import type { ModerationContentType } from "@/lib/moderation/types";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";

type ReportContentButtonProps = {
  contentType: ModerationContentType;
  contentId: string;
  subjectUserId: string;
  currentUserId: string;
  className?: string;
};

export default function ReportContentButton({
  contentType,
  contentId,
  subjectUserId,
  currentUserId,
  className = "",
}: ReportContentButtonProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, pending]);

  if (subjectUserId === currentUserId) {
    return null;
  }

  function submit() {
    setFeedback(null);
    const formData = new FormData();
    formData.set("contentType", contentType);
    formData.set("contentId", contentId);
    formData.set("reportNote", note);

    startTransition(async () => {
      const res = await reportContent(formData);
      if (res?.error === "duplicate") {
        setFeedback(t("moderation.reportDuplicate"));
        return;
      }
      if (res?.error === "not-configured") {
        setFeedback(t("moderation.notConfigured"));
        return;
      }
      if (res?.error) {
        setFeedback(t("moderation.reportFailed"));
        return;
      }
      setFeedback(t("moderation.reportSent"));
      setNote("");
      window.setTimeout(() => setOpen(false), 900);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFeedback(null);
          setOpen(true);
        }}
        className={
          className ||
          "shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
        }
      >
        {t("moderation.report")}
      </button>

      {open && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4 max-sm:items-end max-sm:p-0"
              role="presentation"
              onClick={(e) => {
                if (e.target === e.currentTarget && !pending) {
                  setOpen(false);
                }
              }}
            >
              <div
                className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl max-sm:rounded-b-none max-sm:rounded-t-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="report-content-title"
              >
                <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                  <h2 id="report-content-title" className="text-base font-semibold text-foreground">
                    {t("moderation.reportTitle")}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={pending}
                    className="rounded-full px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
                  >
                    {t("profile.cancel")}
                  </button>
                </header>
                <div className="space-y-3 px-4 py-4 text-start">
                  <p className="text-sm text-muted-foreground">{t("moderation.reportHint")}</p>
                  <label className="block text-xs font-medium text-foreground" htmlFor="report-note">
                    {t("moderation.reportNoteLabel")}
                  </label>
                  <textarea
                    id="report-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    maxLength={500}
                    disabled={pending}
                    placeholder={t("moderation.reportNotePlaceholder")}
                    className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                  />
                  {feedback ? (
                    <p
                      className={`text-sm ${feedback === t("moderation.reportSent") ? "text-primary" : "text-red-600"}`}
                      role="status"
                    >
                      {feedback}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={submit}
                    className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    {pending ? "..." : t("moderation.reportSubmit")}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
