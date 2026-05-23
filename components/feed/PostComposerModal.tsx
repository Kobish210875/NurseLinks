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

type PostComposerPanelProps = {
  user: CurrentUser;
  onClose: () => void;
};

export default function PostComposerPanel({ user, onClose }: PostComposerPanelProps) {
  const t = useT();
  const router = useRouter();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  return (
    <div
      className="flex max-h-[min(85vh,34rem)] flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-composer-title"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative flex size-10 shrink-0 overflow-hidden rounded-full border border-border bg-primary/10">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-xs font-semibold text-primary">
                {user.initials}
              </span>
            )}
          </span>
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
          id="post-composer-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={5}
          maxLength={4000}
          disabled={saving}
          autoFocus
          placeholder={t("feed.composerModalPlaceholder")}
          className="min-h-[7rem] w-full resize-none rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-start text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
        />

        {previewUrl ? (
          <div className="relative mt-3 overflow-hidden rounded-lg border border-border bg-muted/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="" className="max-h-56 w-full object-contain" />
            <button
              type="button"
              onClick={removeImage}
              disabled={saving}
              className="absolute start-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-xs text-white transition hover:bg-black/70"
            >
              {t("feed.postImageRemove")}
            </button>
          </div>
        ) : null}

        <div className="mt-3 border-t border-border pt-3">
          <input
            ref={fileInputRef}
            id={fileInputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={saving}
            onChange={handleImageChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary/30 hover:text-primary disabled:opacity-60"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              aria-hidden="true"
            >
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
            {t("feed.postImageAdd")}
          </button>
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
