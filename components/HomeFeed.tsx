import FeedColumn from "@/components/feed/FeedColumn";
import SidebarLeft from "@/components/feed/SidebarLeft";
import SidebarRight from "@/components/feed/SidebarRight";
import type { CurrentUser } from "@/lib/auth/get-current-user";

type HomeFeedProps = {
  user: CurrentUser;
};

export default function HomeFeed({ user }: HomeFeedProps) {
  return (
    <div className="feed-page home-feed-shell min-h-[calc(100vh-4rem)] overflow-x-clip py-3 md:py-6 lg:py-4">
      <div className="mx-auto flex h-full w-full min-w-0 max-w-[1128px] flex-col px-3 sm:px-4">
        <div className="home-feed-grid grid min-h-0 flex-1 grid-cols-1 gap-4 lg:h-full lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,260px)] lg:items-start lg:gap-6 lg:overflow-hidden">
          <div className="home-feed-sidebar order-1 hidden lg:block lg:h-full lg:overflow-hidden">
            <SidebarRight user={user} />
          </div>
          <div className="order-2 flex min-h-0 min-w-0 flex-col lg:h-full">
            <FeedColumn user={user} />
          </div>
          <div className="home-feed-sidebar order-3 hidden lg:block lg:h-full lg:overflow-hidden">
            <SidebarLeft />
          </div>
        </div>
      </div>
    </div>
  );
}
