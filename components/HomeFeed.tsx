import FeedColumn from "@/components/feed/FeedColumn";
import SidebarLeft from "@/components/feed/SidebarLeft";
import SidebarRight from "@/components/feed/SidebarRight";
import type { CurrentUser } from "@/lib/auth/get-current-user";
import type { InstitutionActivityMap } from "@/lib/data/institution-activity";

type HomeFeedProps = {
  user: CurrentUser;
  institutionActivity: InstitutionActivityMap;
};

export default function HomeFeed({ user, institutionActivity }: HomeFeedProps) {
  return (
    <div className="feed-page home-feed-shell h-full min-h-0 overflow-x-clip py-3 max-md:h-auto max-md:overflow-visible md:min-h-[calc(100vh-4rem)] md:py-6 lg:overflow-hidden lg:py-2">
      <div className="mx-auto flex h-full w-full min-w-0 max-w-[1240px] flex-col px-3 sm:px-4 max-md:h-auto">
        <div className="home-feed-grid grid h-full min-h-0 flex-1 grid-cols-1 gap-4 max-md:h-auto max-md:min-h-0 max-md:flex-none lg:grid-cols-[280px_minmax(0,1fr)_260px] lg:items-stretch lg:gap-6">
          <div className="home-feed-sidebar order-1 hidden h-full min-h-0 lg:block">
            <div className="home-feed-sidebar-pin home-feed-sidebar-pin--stack">
              <SidebarRight user={user} />
            </div>
          </div>
          <div className="home-feed-center order-2 flex h-full min-h-0 min-w-0 flex-col max-md:h-auto">
            <FeedColumn user={user} />
          </div>
          <div className="home-feed-sidebar home-feed-sidebar-left-column order-3 hidden h-full min-h-0 lg:flex lg:flex-col lg:gap-3">
            <SidebarLeft institutionActivity={institutionActivity} />
          </div>
        </div>
      </div>
    </div>
  );
}
