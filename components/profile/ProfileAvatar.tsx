"use client";

import { uploadAvatar } from "@/app/profile/actions";
import AvatarCropModal from "@/components/profile/AvatarCropModal";
import { useT } from "@/components/i18n/LocaleProvider";
import { isAllowedAvatarFile } from "@/lib/images/avatar-file";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

export type AvatarUploadError =
  | "no-file"
  | "invalid-file"
  | "upload-failed"
  | "profile-update-failed"
  | "storage-not-configured"
  | "resize-failed";

type ProfileAvatarProps = {
  avatarUrl: string | null;
  initials: string;
  name: string;
  editable?: boolean;
  sizeClassName?: string;
};

export default function ProfileAvatar({
  avatarUrl,
  initials,
  name,
  editable = false,
  sizeClassName = "size-28 text-2xl",
}: ProfileAvatarProps) {
  const t = useT();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<AvatarUploadError | null>(null);
  const [cropSession, setCropSession] = useState<{ file: File; previewUrl: string } | null>(null);

  const shownUrl = displayUrl ?? avatarUrl;

  useEffect(() => {
    if (!pending) {
      setDisplayUrl(null);
    }
  }, [avatarUrl, pending]);

  useEffect(() => {
    return () => {
      if (cropSession?.previewUrl) {
        URL.revokeObjectURL(cropSession.previewUrl);
      }
    };
  }, [cropSession?.previewUrl]);

  function errorMessage(code: AvatarUploadError) {
    switch (code) {
      case "invalid-file":
        return t("profile.photoInvalidFile");
      case "storage-not-configured":
        return t("profile.photoStorageMissing");
      case "resize-failed":
        return t("profile.photoUploadFailed");
      default:
        return t("profile.photoUploadFailed");
    }
  }

  function closeCropSession() {
    if (cropSession?.previewUrl) {
      URL.revokeObjectURL(cropSession.previewUrl);
    }
    setCropSession(null);
  }

  function uploadCroppedFile(file: File, previewUrl: string) {
    closeCropSession();
    setUploadError(null);
    setDisplayUrl(previewUrl);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("avatar", file);

        const result = await uploadAvatar(formData);

        if (!result || "error" in result) {
          URL.revokeObjectURL(previewUrl);
          setDisplayUrl(avatarUrl);
          setUploadError(result?.error ?? "upload-failed");
          return;
        }

        URL.revokeObjectURL(previewUrl);
        setDisplayUrl(result.avatarUrl);
        router.refresh();
      } catch {
        URL.revokeObjectURL(previewUrl);
        setDisplayUrl(avatarUrl);
        setUploadError("resize-failed");
      }
    });
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setUploadError(null);

    if (!isAllowedAvatarFile(file, 2 * 1024 * 1024)) {
      setUploadError("invalid-file");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setCropSession({ file, previewUrl });
  }

  return (
    <>
      <div className="grid gap-1">
        <div className="relative inline-block w-fit shrink-0">
          <div
            className={`relative flex items-center justify-center overflow-hidden rounded-full border-4 border-card bg-primary/15 font-bold text-primary ${sizeClassName} ${
              pending ? "opacity-80" : ""
            }`}
            role="img"
            aria-label={name}
          >
            {shownUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shownUrl}
                alt=""
                className="absolute inset-0 z-10 size-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="relative z-0">{initials}</span>
            )}
          </div>

          {editable ? (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={pending}
                className="absolute bottom-0 end-0 z-20 flex size-8 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
                aria-label={t("profile.changePhoto")}
              >
                {pending ? (
                  <span className="text-[10px] font-bold" aria-hidden="true">
                    …
                  </span>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                )}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg,.jpg,.jpeg,.png,.webp"
                className="sr-only"
                onChange={onFileChange}
              />
            </>
          ) : null}
        </div>

        {uploadError ? (
          <p className="max-w-[14rem] text-xs text-red-600" role="alert">
            {errorMessage(uploadError)}
          </p>
        ) : null}
      </div>

      {cropSession ? (
        <AvatarCropModal
          file={cropSession.file}
          previewUrl={cropSession.previewUrl}
          onCancel={closeCropSession}
          onSave={uploadCroppedFile}
          onCropFailed={() => {
            closeCropSession();
            setUploadError("resize-failed");
          }}
        />
      ) : null}
    </>
  );
}
