import { ImageResponse } from "next/og";

export const ogImageSize = { width: 600, height: 600 };
export const ogImageContentType = "image/png";

async function loadRubikBold() {
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Rubik:wght@700&display=swap",
    { next: { revalidate: 60 * 60 * 24 } },
  ).then((res) => res.text());

  const match = css.match(/src: url\((.+)\) format\('(?:opentype|truetype)'\)/);
  if (!match?.[1]) {
    throw new Error("Rubik bold font URL not found");
  }

  return fetch(match[1]).then((res) => res.arrayBuffer());
}

function StethoscopeIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  );
}

/** Compact share preview: site name + stethoscope only. */
export async function renderNurseLinksShareImage(size = 600) {
  const rubikBold = await loadRubikBold();
  const titleSize = Math.round(size * 0.11);
  const iconSize = Math.round(size * 0.12);
  const gap = Math.round(size * 0.035);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2b6cb0",
          color: "#ffffff",
          fontFamily: "Rubik",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap,
          }}
        >
          <div
            style={{
              fontSize: titleSize,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            NurseLinks
          </div>
          <StethoscopeIcon size={iconSize} />
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
      fonts: [{ name: "Rubik", data: rubikBold, weight: 700, style: "normal" }],
    },
  );
}

export async function renderNurseLinksAppIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2b6cb0",
        }}
      >
        <StethoscopeIcon size={Math.round(size * 0.58)} />
      </div>
    ),
    { width: size, height: size },
  );
}
