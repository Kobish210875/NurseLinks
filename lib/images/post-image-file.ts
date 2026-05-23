const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg", "image/pjpeg"]);

export const POST_IMAGE_MAX_INPUT_BYTES = 10 * 1024 * 1024;
export const POST_IMAGE_MAX_UPLOAD_BYTES = 900 * 1024;

export function resolvePostImageContentType(file: File): string | null {
  const mime = file.type.toLowerCase();
  if (mime === "image/jpg" || mime === "image/pjpeg") {
    return "image/jpeg";
  }
  if (ALLOWED_MIME.has(mime)) {
    return "image/jpeg";
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp") {
    return "image/jpeg";
  }
  return null;
}

export function isAllowedPostImageFile(file: File, maxBytes: number) {
  if (!resolvePostImageContentType(file)) {
    return false;
  }
  return file.size > 0 && file.size <= maxBytes;
}
