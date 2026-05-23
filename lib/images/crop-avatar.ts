const OUTPUT_SIZE = 512;
const JPEG_QUALITY = 0.88;

export type AvatarCropParams = {
  /** Circle diameter in the crop UI (px). */
  viewportSize: number;
  /** Top-left of scaled image within the viewport (px). */
  offsetX: number;
  offsetY: number;
  /** Display scale: natural pixels → viewport pixels. */
  scale: number;
};

/** Export a square JPEG avatar from drag/zoom crop settings. */
export async function cropAvatarFile(file: File, crop: AvatarCropParams): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const { viewportSize, offsetX, offsetY, scale } = crop;

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("canvas-unavailable");
  }

  const sx = Math.max(0, -offsetX / scale);
  const sy = Math.max(0, -offsetY / scale);
  const sw = Math.min(bitmap.width - sx, viewportSize / scale);
  const sh = Math.min(bitmap.height - sy, viewportSize / scale);

  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
  });

  if (!blob) {
    throw new Error("crop-failed");
  }

  return new File([blob], "avatar.jpg", { type: "image/jpeg", lastModified: Date.now() });
}

export function getAvatarCoverScale(
  imageWidth: number,
  imageHeight: number,
  viewportSize: number,
  zoom: number,
) {
  return Math.max(viewportSize / imageWidth, viewportSize / imageHeight) * zoom;
}

export function getAvatarCenteredOffset(
  imageWidth: number,
  imageHeight: number,
  scale: number,
  viewportSize: number,
) {
  return {
    x: (viewportSize - imageWidth * scale) / 2,
    y: (viewportSize - imageHeight * scale) / 2,
  };
}
