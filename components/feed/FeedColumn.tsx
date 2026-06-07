import FeedComposer from "@/components/feed/FeedComposer";
import FeedPostsList from "@/components/feed/FeedPostsList";
import FeedPostsScroll from "@/components/feed/FeedPostsScroll";
import { Suspense } from "react";
import FeedAutoRefresh from "@/components/feed/FeedAutoRefresh";
import FeedHashScroll from "@/components/feed/FeedHashScroll";
import type { CurrentUser } from "@/lib/auth/get-current-user";
import { getFeedPage, getFeedVersion } from "@/lib/data/feed";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";
import { createClient } from "@/lib/supabase/server";

type FeedColumnProps = {
  user: CurrentUser;
};

export default async function FeedColumn({ user }: FeedColumnProps) {
  const locale = await getLocale();
  const t = createT(getMessages(locale));
  const supabase = await createClient();
  const [feedPage, feedVersion] = await Promise.all([
    getFeedPage(supabase, user.id, locale),
    getFeedVersion(supabase),
  ]);

  const { posts, hasMore, nextCursor } = feedPage;

  return (
    <section
      className="flex h-full min-h-0 min-w-0 flex-col gap-4 max-md:h-auto max-md:min-h-0"
      aria-label={t("feed.feedAria")}
    >
      <FeedAutoRefresh initialVersion={feedVersion} />
      <FeedHashScroll />
      <div className="feed-composer-sticky shrink-0 max-md:sticky max-md:top-[var(--mobile-header-offset)] max-md:z-30 max-md:bg-[var(--background)] max-md:pb-2 max-md:pt-0.5">
        <Suspense fallback={null}>
          <FeedComposer user={user} />
        </Suspense>
      </div>
      <FeedPostsScroll>
        <FeedPostsList
          resetKey={feedVersion}
          initialPosts={posts}
          initialHasMore={hasMore}
          initialNextCursor={nextCursor}
          currentUserId={user.id}
          isAdmin={user.isAdmin}
          emptyMessage={t("feed.emptyFeed")}
        />
      </FeedPostsScroll>
    </section>
  );
}
