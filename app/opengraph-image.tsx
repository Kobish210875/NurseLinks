import { renderNurseLinksBrandImage, ogImageContentType, ogImageSize } from "@/lib/og/brand-image";

export const alt = "NurseLinks — רשת מקצועית לצוותי סיעוד";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default async function Image() {
  return renderNurseLinksBrandImage({
    ...ogImageSize,
    titleSize: 88,
    subtitleSize: 34,
    iconSize: 220,
    padding: 72,
    subtitle:
      "קהילה מקצועית לצוותי סיעוד — קשר עם קולגות, ידע, משרות וקריירה",
  });
}
