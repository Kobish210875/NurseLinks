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
    <aside className="home-feed-sidebar-right" aria-label={t("feed.joinAria")}>
      <UserProfileCard user={user} />
      <MessagingSidebarPanel />
    </aside>
  );
}
