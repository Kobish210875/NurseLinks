"use client";

import { createPost } from "@/app/actions/feed";
import { useT } from "@/components/i18n/LocaleProvider";
import type { CurrentUser } from "@/lib/auth/get-current-user";
import {
  isAllowedPostImageFile,
  POST_IMAGE_MAX_INPUT_BYTES,
  POST_IMAGE_MAX_UPLOAD_BYTES,
} from "@/lib/images/post-image-file";
import { resizePostImageFile } from "@/lib/images/resize-post-image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

function GalleryIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.25" fill="currentColor" stroke="none" />
      <path d="m21 15-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}

type PostComposerPanelProps = {
  user: CurrentUser;
  onClose: () => void;
  fullScreen?: boolean;
};

export default function PostComposerPanel({
  user,
  onClose,
  fullScreen = false,
}: PostComposerPanelProps) {
  const t = useT();
  const router = useRouter();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  useEffect(() => {
    if (!fullScreen) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      textareaRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [fullScreen]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function resetForm() {
    setBody("");
    setImageFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleClose() {
    if (saving) {
      return;
    }
    resetForm();
    onClose();
  }

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!isAllowedPostImageFile(file, POST_IMAGE_MAX_INPUT_BYTES)) {
      setError(t("feed.postImageInvalid"));
      return;
    }

    try {
      const resized = await resizePostImageFile(file);
      if (!isAllowedPostImageFile(resized, POST_IMAGE_MAX_UPLOAD_BYTES)) {
        setError(t("feed.postImageTooLarge"));
        return;
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setImageFile(resized);
      setPreviewUrl(URL.createObjectURL(resized));
    } catch {
      setError(t("feed.postImageProcessFailed"));
    }
  }

  function removeImage() {
    setImageFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handlePublish() {
    const trimmed = body.trim();
    if (!trimmed) {
      setError(t("errors.post-empty"));
      return;
    }

    setSaving(true);
    setError(null);

    const formData = new FormData();
    formData.set("body", trimmed);
    if (imageFile) {
      formData.set("image", imageFile);
    }

    try {
      const result = await createPost(formData);
      if (result?.error === "invalid-body") {
        setError(t("errors.post-empty"));
        return;
      }
      if (result?.error === "invalid-image") {
        setError(t("feed.postImageInvalid"));
        return;
      }
      if (result?.error === "storage-not-configured") {
        setError(t("feed.postImageStorageMissing"));
        return;
      }
      if (result?.error) {
        setError(t("errors.post-failed"));
        return;
      }
      resetForm();
      onClose();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const canPublish = body.trim().length > 0 && !saving;

  const fileInput = (
    <input
      ref={fileInputRef}
      id={fileInputId}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="sr-only"
      disabled={saving}
      onChange={handleImageChange}
    />
  );

  const imageActionButtonClass =
    "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

  function renderImageActions(compact = false) {
    if (!previewUrl) {
      return (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={saving}
          className={`${imageActionButtonClass} border-border bg-white text-foreground hover:border-primary/40 hover:bg-primary/5 ${
            compact ? "shrink-0" : ""
          }`}
        >
          <GalleryIcon className="size-5 text-primary" />
          <span>{t("feed.postImageAdd")}</span>
        </button>
      );
    }

    return (
      <div className={`flex flex-wrap items-center gap-2 ${compact ? "min-w-0" : ""}`}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={saving}
          className={`${imageActionButtonClass} border-primary/30 bg-primary/5 text-primary hover:border-primary/50`}
        >
          <GalleryIcon className="size-5 text-primary" />
          <span>{t("feed.postImageChange")}</span>
        </button>
        <button
          type="button"
          onClick={removeImage}
          disabled={saving}
          className={`${imageActionButtonClass} border-border bg-white text-muted-foreground hover:border-red-200 hover:bg-red-50 hover:text-red-700`}
        >
          <span>{t("feed.postImageRemove")}</span>
        </button>
      </div>
    );
  }

  const userAvatar = (
    <span className="relative flex size-11 shrink-0 overflow-hidden rounded-full border border-border bg-primary/10">
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center text-xs font-semibold text-primary">
          {user.initials}
        </span>
      )}
    </span>
  );

  if (fullScreen) {
    return (
      <div
        className="flex h-full min-h-0 flex-1 flex-col bg-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-composer-title"
      >
        <header className="composer-mobile-header flex shrink-0 items-center gap-2 border-b border-border px-2 py-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted disabled:opacity-60"
            aria-label={t("profile.cancel")}
          >
            <CloseIcon />
          </button>
          <h2
            id="post-composer-title"
            className="min-w-0 flex-1 truncate text-center text-base font-semibold text-foreground"
          >
            {t("feed.composerTitle")}
          </h2>
          <span className="size-11 shrink-0" aria-hidden="true" />
        </header>

        <div className="flex shrink-0 items-center gap-3 border-b border-border/70 px-4 py-3">
          {userAvatar}
          <p className="min-w-0 truncate text-base font-semibold text-foreground">{user.fullName}</p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <label className="sr-only" htmlFor="post-composer-body">
            {t("feed.composerLabel")}
          </label>
          <textarea
            ref={textareaRef}
            id="post-composer-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={4000}
            disabled={saving}
            placeholder={t("feed.composerModalPlaceholder")}
            className="min-h-0 w-full flex-1 resize-none border-0 bg-transparent px-4 py-3 text-start text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
          />

          {previewUrl ? (
            <div className="shrink-0 overflow-y-auto overscroll-contain px-4 pb-2">
              <div className="overflow-hidden rounded-xl border border-border bg-muted/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="" className="max-h-[40vh] w-full object-contain" />
              </div>
            </div>
          ) : null}

          {error ? (
            <p
              className="mx-4 mb-2 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>

        <footer className="composer-mobile-footer shrink-0 border-t border-border bg-white px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              {fileInput}
              {renderImageActions(true)}
            </div>
            <button
              type="button"
              onClick={handlePublish}
              disabled={!canPublish}
              className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "…" : t("feed.composerSubmit")}
            </button>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div
      className="flex max-h-[min(85vh,28rem)] flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-composer-title"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex min-w-0 items-center gap-2">
          {userAvatar}
          <p id="post-composer-title" className="truncate text-sm font-semibold text-foreground">
            {user.fullName}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          disabled={saving}
          className="rounded-lg px-2 py-1 text-muted-foreground transition hover:bg-muted disabled:opacity-60"
          aria-label={t("profile.cancel")}
        >
          ✕
        </button>
      </header>

      <div className="flex-1 overflow-y-auto py-3">
        <label className="sr-only" htmlFor="post-composer-body">
          {t("feed.composerLabel")}
        </label>
        <textarea
          ref={textareaRef}
          id="post-composer-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={2}
          maxLength={4000}
          disabled={saving}
          autoFocus
          placeholder={t("feed.composerModalPlaceholder")}
          className="min-h-[3.25rem] max-h-[6rem] w-full resize-none rounded-xl border border-border bg-muted/20 px-3 py-2 text-start text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:opacity-60 md:text-sm"
        />

        {previewUrl ? (
          <div className="mt-3 overflow-hidden rounded-lg border border-border bg-muted/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="" className="max-h-48 w-full object-contain" />
          </div>
        ) : null}

        <div className="mt-2">
          {fileInput}
          {renderImageActions()}
        </div>

        {error ? (
          <p className="mt-2 text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <footer className="flex justify-end border-t border-border pt-3">
        <button
          type="button"
          onClick={handlePublish}
          disabled={!canPublish}
          className="min-w-[7rem] rounded-full bg-primary px-8 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "…" : t("feed.composerSubmit")}
        </button>
      </footer>
    </div>
  );
}
