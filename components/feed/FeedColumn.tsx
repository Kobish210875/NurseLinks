import FeedComposer from "@/components/feed/FeedComposer";
import FeedAutoRefresh from "@/components/feed/FeedAutoRefresh";
import PostCard from "@/components/feed/PostCard";
import type { CurrentUser } from "@/lib/auth/get-current-user";
import { getFeedPosts, getFeedVersion } from "@/lib/data/feed";
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
  const [posts, feedVersion] = await Promise.all([
    getFeedPosts(supabase, user.id, locale),
    getFeedVersion(supabase),
  ]);

  const [firstPost, ...restPosts] = posts;

  return (
    <section className="flex min-w-0 flex-col gap-4" aria-label={t("feed.feedAria")}>
      <FeedAutoRefresh initialVersion={feedVersion} />
      <div className="flex min-h-[28rem] flex-col gap-4 lg:min-h-[32rem]">
        <FeedComposer user={user} />
        {firstPost ? (
          <PostCard post={firstPost} currentUserId={user.id} />
        ) : (
          <div className="feed-card flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
            {t("feed.emptyFeed")}
          </div>
        )}
      </div>
      {restPosts.map((post) => (
        <PostCard key={post.id} post={post} currentUserId={user.id} />
      ))}
    </section>
  );
}
