"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import type { CurrentUser } from "@/lib/auth/get-current-user";
import MessagingSidebarPanel from "@/components/messages/MessagingSidebarPanel";
import UserProfileCard from "./UserProfileCard";

type SidebarRightProps = {
  user: CurrentUser;
};

export default function SidebarRight({ user }: SidebarRightProps) {
  const t = useT();

  return (
    <aside className="flex h-full min-h-0 flex-col gap-4 overflow-hidden" aria-label={t("feed.joinAria")}>
      <UserProfileCard user={user} className="shrink-0" />
      <MessagingSidebarPanel />
    </aside>
  );
}
