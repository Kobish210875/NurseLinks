"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import type { CurrentUser } from "@/lib/auth/get-current-user";
import AboutStoryCard from "./AboutStoryCard";
import ProTipCard from "./ProTipCard";
import UserProfileCard from "./UserProfileCard";

type SidebarRightProps = {
  user: CurrentUser;
};

export default function SidebarRight({ user }: SidebarRightProps) {
  const t = useT();

  return (
    <aside className="flex flex-col gap-4" aria-label={t("feed.joinAria")}>
      <UserProfileCard user={user} />
      <ProTipCard />
      <AboutStoryCard />
    </aside>
  );
}
