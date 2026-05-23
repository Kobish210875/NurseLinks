const MAX_DIMENSION = 512;
const JPEG_QUALITY = 0.88;

/** Resize & crop to square avatar JPEG for storage (client-side). */
export async function resizeAvatarFile(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const size = Math.min(bitmap.width, bitmap.height, MAX_DIMENSION);
  const sx = (bitmap.width - size) / 2;
  const sy = (bitmap.height - size) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = MAX_DIMENSION;
  canvas.height = MAX_DIMENSION;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("canvas-unavailable");
  }

  ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, MAX_DIMENSION, MAX_DIMENSION);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
  });

  if (!blob) {
    throw new Error("resize-failed");
  }

  return new File([blob], "avatar.jpg", { type: "image/jpeg", lastModified: Date.now() });
}
