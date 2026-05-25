const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg", "image/pjpeg"]);

export function resolveAvatarContentType(file: File): string | null {
  const mime = file.type.toLowerCase();
  if (mime === "image/jpg" || mime === "image/pjpeg") {
    return "image/jpeg";
  }
  if (ALLOWED_MIME.has(mime)) {
    return mime === "image/webp" ? "image/webp" : mime === "image/png" ? "image/png" : "image/jpeg";
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return null;
}

export function isAllowedAvatarFile(file: File, maxBytes: number) {
  const contentType = resolveAvatarContentType(file);
  if (!contentType) {
    return false;
  }
  return file.size > 0 && file.size <= maxBytes;
}

export function isSupportedAvatarFile(file: File) {
  return file.size > 0 && resolveAvatarContentType(file) !== null;
}
