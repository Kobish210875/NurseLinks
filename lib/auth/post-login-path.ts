export function getPostLoginPath(headline: string | null | undefined) {
  return headline?.trim() ? "/home" : "/profile";
}
