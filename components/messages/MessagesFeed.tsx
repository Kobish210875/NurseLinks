import MessagesAutoRefresh from "@/components/messages/MessagesAutoRefresh";
import MessagesColumn from "@/components/messages/MessagesColumn";
import type { NewMessageFriend } from "@/components/messages/NewMessagePicker";
import type { MessageThread } from "@/lib/network/types";

type MessagesFeedProps = {
  threads: MessageThread[];
  connections: NewMessageFriend[];
  messagesVersion: string;
};

/** Same shell/grid as {@link HomeFeed}. */
export default function MessagesFeed({ threads, connections, messagesVersion }: MessagesFeedProps) {
  return (
    <div className="feed-page home-feed-shell h-full min-h-0 overflow-x-clip py-3 md:min-h-[calc(100vh-4rem)] md:py-6 lg:overflow-hidden lg:py-4">
      <div className="mx-auto flex h-full w-full min-w-0 max-w-[1128px] flex-col px-3 sm:px-4">
        <div className="home-feed-grid grid h-full min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,260px)] lg:items-start lg:gap-6">
          <div className="home-feed-sidebar order-1 hidden lg:block" aria-hidden="true" />
          <div className="home-feed-center order-2 flex h-full min-h-0 min-w-0 flex-col">
            <MessagesAutoRefresh initialVersion={messagesVersion} />
            <MessagesColumn threads={threads} connections={connections} />
          </div>
          <div className="home-feed-sidebar order-3 hidden lg:block" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
