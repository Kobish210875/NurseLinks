export type AppEnvironment = "development" | "production" | "preview";

/** Which backend this build talks to — set NEXT_PUBLIC_APP_ENV in .env.local / Vercel. */
export function getAppEnvironment(): AppEnvironment {
  const configured = process.env.NEXT_PUBLIC_APP_ENV?.trim().toLowerCase();
  if (configured === "production") {
    return "production";
  }
  if (configured === "preview") {
    return "preview";
  }
  if (configured === "development" || configured === "dev") {
    return "development";
  }
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

export function isProductionApp(): boolean {
  return getAppEnvironment() === "production";
}
