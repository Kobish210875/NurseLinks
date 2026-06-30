"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import {
  clampAvatarOffset,
  cropAvatarFile,
  getAvatarCenteredOffset,
  getAvatarCoverScale,
  getAvatarInitialZoom,
} from "@/lib/images/crop-avatar";
import { useMounted } from "@/lib/ui/use-mounted";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export const AVATAR_CROP_VIEWPORT = 300;

const MIN_ZOOM = 0.8;
const MAX_ZOOM = 2.75;

type AvatarCropModalProps = {
  file: File;
  previewUrl: string;
  onCancel: () => void;
  onSave: (file: File, previewUrl: string) => void;
  onCropFailed: () => void;
};

export default function AvatarCropModal({
  file,
  previewUrl,
  onCancel,
  onSave,
  onCropFailed,
}: AvatarCropModalProps) {
  const t = useT();
  const mounted = useMounted();
  const titleId = useId();
  const zoomId = useId();
  const [imageSize, setImageSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null,
  );
  const offsetRef = useRef(offset);
  const imageSizeRef = useRef(imageSize);
  const zoomRef = useRef(zoom);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    imageSizeRef.current = imageSize;
  }, [imageSize]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        onCancel();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onCancel, saving]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setImageSize({ w, h });
      const initialZoom = getAvatarInitialZoom(w, h, AVATAR_CROP_VIEWPORT, MAX_ZOOM);
      const initialScale = getAvatarCoverScale(w, h, AVATAR_CROP_VIEWPORT, initialZoom);
      setOffset(
        clampAvatarOffset(
          w,
          h,
          initialScale,
          AVATAR_CROP_VIEWPORT,
          getAvatarCenteredOffset(w, h, initialScale, AVATAR_CROP_VIEWPORT),
        ),
      );
      setZoom(initialZoom);
    };
    img.src = previewUrl;
  }, [previewUrl]);

  const scale =
    imageSize === null
      ? 1
      : getAvatarCoverScale(imageSize.w, imageSize.h, AVATAR_CROP_VIEWPORT, zoom);

  const onZoomChange = useCallback(
    (nextZoom: number) => {
      if (!imageSize) {
        setZoom(nextZoom);
        return;
      }
      const prevScale = getAvatarCoverScale(
        imageSize.w,
        imageSize.h,
        AVATAR_CROP_VIEWPORT,
        zoom,
      );
      const nextScale = getAvatarCoverScale(
        imageSize.w,
        imageSize.h,
        AVATAR_CROP_VIEWPORT,
        nextZoom,
      );
      const centerX = AVATAR_CROP_VIEWPORT / 2;
      const centerY = AVATAR_CROP_VIEWPORT / 2;
      const focalX = (centerX - offset.x) / prevScale;
      const focalY = (centerY - offset.y) / prevScale;

      setZoom(nextZoom);
      setOffset(
        clampAvatarOffset(imageSize.w, imageSize.h, nextScale, AVATAR_CROP_VIEWPORT, {
          x: centerX - focalX * nextScale,
          y: centerY - focalY * nextScale,
        }),
      );
    },
    [imageSize, offset.x, offset.y, zoom],
  );

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const size = imageSizeRef.current;
    if (!size || saving) {
      return;
    }
    event.preventDefault();
    const origin = offsetRef.current;
    const startX = event.clientX;
    const startY = event.clientY;

    dragRef.current = {
      startX,
      startY,
      originX: origin.x,
      originY: origin.y,
    };

    function onPointerMove(moveEvent: PointerEvent) {
      const activeDrag = dragRef.current;
      const activeSize = imageSizeRef.current;
      if (!activeDrag || !activeSize) {
        return;
      }
      const activeScale = getAvatarCoverScale(
        activeSize.w,
        activeSize.h,
        AVATAR_CROP_VIEWPORT,
        zoomRef.current,
      );
      setOffset(
        clampAvatarOffset(activeSize.w, activeSize.h, activeScale, AVATAR_CROP_VIEWPORT, {
          x: activeDrag.originX + (moveEvent.clientX - activeDrag.startX),
          y: activeDrag.originY + (moveEvent.clientY - activeDrag.startY),
        }),
      );
    }

    function endDrag() {
      dragRef.current = null;
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", endDrag);
      document.removeEventListener("pointercancel", endDrag);
    }

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", endDrag);
    document.addEventListener("pointercancel", endDrag);
  }

  async function handleSave() {
    if (!imageSize || saving) {
      return;
    }
    setSaving(true);
    try {
      const safeOffset = clampAvatarOffset(
        imageSize.w,
        imageSize.h,
        scale,
        AVATAR_CROP_VIEWPORT,
        offset,
      );
      const cropped = await cropAvatarFile(file, {
        viewportSize: AVATAR_CROP_VIEWPORT,
        offsetX: safeOffset.x,
        offsetY: safeOffset.y,
        scale,
      });
      const url = URL.createObjectURL(cropped);
      onSave(cropped, url);
    } catch {
      setSaving(false);
      onCropFailed();
    }
  }

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      className="avatar-crop-overlay fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onCancel();
        }
      }}
    >
      <div className="feed-card w-full max-w-sm p-5 shadow-lg">
        <h2 id={titleId} className="text-center text-base font-semibold text-foreground">
          {t("profile.cropTitle")}
        </h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">{t("profile.cropHint")}</p>

        <div
          className="relative mx-auto mt-4 cursor-grab touch-none select-none overflow-hidden rounded-xl bg-muted/40 active:cursor-grabbing"
          style={{ width: AVATAR_CROP_VIEWPORT, height: AVATAR_CROP_VIEWPORT }}
          onPointerDown={onPointerDown}
          aria-hidden="true"
        >
          {imageSize ? (
            <>
              {/* Soft fill avoids empty edges when the user zooms slightly out. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt=""
                draggable={false}
                className="pointer-events-none absolute inset-0 z-0 size-full scale-110 object-cover opacity-70 blur-lg"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt=""
                draggable={false}
                className="pointer-events-none absolute z-0 max-w-none"
                style={{
                  left: offset.x,
                  top: offset.y,
                  width: imageSize.w * scale,
                  height: imageSize.h * scale,
                }}
              />
            </>
          ) : null}

          {/* Dim everything outside the circle */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: AVATAR_CROP_VIEWPORT,
              height: AVATAR_CROP_VIEWPORT,
              boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
            }}
          />

          {/* Circle guide on top of the image */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white shadow-md ring-2 ring-primary/50"
            style={{ width: AVATAR_CROP_VIEWPORT, height: AVATAR_CROP_VIEWPORT }}
          />
        </div>

        <label className="mt-4 block text-sm font-medium text-foreground" htmlFor={zoomId}>
          {t("profile.cropZoom")}
        </label>
        <input
          id={zoomId}
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          disabled={!imageSize || saving}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="mt-1 w-full accent-primary"
        />

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-60"
          >
            {t("profile.cropCancel")}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!imageSize || saving}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? "..." : t("profile.cropSave")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
