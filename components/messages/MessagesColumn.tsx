import MessagesPostsScroll from "@/components/messages/MessagesPostsScroll";
import MessagesThreadList from "@/components/messages/MessagesThreadList";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";
import type { MessageThread } from "@/lib/network/types";

type MessagesColumnProps = {
  threads: MessageThread[];
};

/** Same layout/classes as {@link FeedColumn} — title replaces composer, threads replace posts. */
export default async function MessagesColumn({ threads }: MessagesColumnProps) {
  const locale = await getLocale();
  const t = createT(getMessages(locale));

  return (
    <section
      className="flex h-full min-h-0 min-w-0 flex-col gap-4"
      aria-label={t("messages.title")}
    >
      <div className="shrink-0">
        <h1 className="text-lg font-bold text-foreground md:text-xl">{t("messages.title")}</h1>
      </div>
      {threads.length === 0 ? (
        <p className="feed-card px-4 py-6 text-center text-sm text-muted-foreground md:px-6">
          {t("messages.empty")}
        </p>
      ) : (
        <MessagesPostsScroll>
          <MessagesThreadList threads={threads} />
        </MessagesPostsScroll>
      )}
    </section>
  );
}
