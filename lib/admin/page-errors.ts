export function resolveAdminUsersErrorMessage(
  t: (key: string) => string,
  urlError?: string | null,
  loadError?: string | null,
): string | null {
  const code = urlError?.trim() || loadError?.trim() || null;
  if (!code) {
    return null;
  }

  if (code === "missing-service-role") {
    return t("admin.missingServiceRole");
  }
  if (code === "cannot-delete-self") {
    return t("admin.cannotDeleteSelf");
  }
  if (code === "cannot-delete-admin") {
    return t("admin.cannotDeleteAdmin");
  }
  if (code === "delete-failed" || code === "missing-user") {
    return t("admin.deleteFailed");
  }
  if (code === "load-failed") {
    return t("admin.usersLoadFailed");
  }

  return t("admin.usersLoadFailed");
}
