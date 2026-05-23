const BUCKET = "post-images";

export function postImageStoragePath(authorId: string, postId: string) {
  return `${authorId}/${postId}.jpg`;
}

export function postImagePublicUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) {
    return null;
  }
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}

export function postImagePathFromPublicUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) {
    return null;
  }
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) {
    return null;
  }
  return url.slice(idx + marker.length).split("?")[0] ?? null;
}

export { BUCKET as POST_IMAGES_BUCKET };
