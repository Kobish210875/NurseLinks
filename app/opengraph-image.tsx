import { ogImageContentType, ogImageSize, renderNurseLinksShareImage } from "@/lib/og/brand-image";

export const alt = "NurseLinks";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return renderNurseLinksShareImage(ogImageSize.width);
}
