/** Production Supabase project ref (Frankfurt). Never use in .env.local. */
export const PRODUCTION_SUPABASE_PROJECT_REF = "ljfycjqawngzzrahyxsl";

export function supabaseRefFromUrl(url: string | undefined): string | null {
  if (!url) {
    return null;
  }
  const match = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match?.[1] ?? null;
}
