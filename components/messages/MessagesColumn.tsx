import MessagesPostsScroll from "@/components/messages/MessagesPostsScroll";
import MessagesThreadList from "@/components/messages/MessagesThreadList";
import NewMessagePicker, { type NewMessageFriend } from "@/components/messages/NewMessagePicker";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";
import type { MessageThread } from "@/lib/network/types";

type MessagesColumnProps = {
  threads: MessageThread[];
  connections: NewMessageFriend[];
};

/** Same layout/classes as {@link FeedColumn} — title replaces composer, threads replace posts. */
export default async function MessagesColumn({ threads, connections }: MessagesColumnProps) {
  const locale = await getLocale();
  const t = createT(getMessages(locale));

  return (
    <section
      className="flex h-full min-h-0 min-w-0 flex-col gap-4"
      aria-label={t("messages.title")}
    >
      <div className="flex shrink-0 items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-foreground md:text-xl">{t("messages.title")}</h1>
        <NewMessagePicker connections={connections} />
      </div>
      {threads.length === 0 ? (
        <div className="feed-card space-y-3 px-4 py-6 text-center md:px-6">
          <p className="text-sm text-muted-foreground">{t("messages.empty")}</p>
        </div>
      ) : (
        <MessagesPostsScroll>
          <MessagesThreadList threads={threads} />
        </MessagesPostsScroll>
      )}
    </section>
  );
}
