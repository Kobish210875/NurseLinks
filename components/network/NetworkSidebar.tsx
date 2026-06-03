import { redirect } from "next/navigation";
import SidebarRight from "@/components/feed/SidebarRight";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/** WEB right column — profile + messages (pro tip lives in the left column on home). */
export default async function NetworkSidebar() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  return (
    <div className="home-feed-sidebar-pin home-feed-sidebar-pin--stack">
      <SidebarRight user={user} />
    </div>
  );
}
