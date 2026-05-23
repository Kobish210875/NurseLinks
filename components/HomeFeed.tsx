import FeedColumn from "@/components/feed/FeedColumn";
import SidebarLeft from "@/components/feed/SidebarLeft";
import SidebarRight from "@/components/feed/SidebarRight";
import type { CurrentUser } from "@/lib/auth/get-current-user";

type HomeFeedProps = {
  user: CurrentUser;
};

export default function HomeFeed({ user }: HomeFeedProps) {
  return (
    <div className="feed-page min-h-[calc(100vh-4rem)] overflow-x-clip py-3 md:py-6">
      <div className="mx-auto w-full min-w-0 max-w-[1128px] px-3 sm:px-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,260px)] lg:items-start lg:gap-6">
          <div className="order-1 hidden lg:block">
            <SidebarRight user={user} />
          </div>
          <div className="order-2 min-w-0">
            <FeedColumn user={user} />
          </div>
          <div className="order-3 hidden lg:block">
            <SidebarLeft />
          </div>
        </div>
      </div>
    </div>
  );
}
