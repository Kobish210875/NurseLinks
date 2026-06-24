import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import MessagesAutoRefresh from "@/components/messages/MessagesAutoRefresh";
import MessageThreadView from "@/components/messages/MessageThreadView";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getNetworkPeer } from "@/lib/data/connections";
import { getThreadMessages } from "@/lib/data/messages";
import { getMessagesVersion } from "@/lib/data/sync-versions";
import { createClient } from "@/lib/supabase/server";

type ThreadPageProps = {
  params: Promise<{ peerId: string }>;
};

export default async function MessageThreadPage({ params }: ThreadPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const { peerId } = await params;
  const supabase = await createClient();
  const peer = await getNetworkPeer(supabase, user.id, peerId);

  if (!peer) {
    redirect("/messages");
  }

  const [messages, messagesVersion] = await Promise.all([
    getThreadMessages(supabase, user.id, peerId),
    getMessagesVersion(supabase, user.id, peerId),
  ]);

  return (
    <div className="home-page-root message-thread-page-root flex min-h-0 flex-col max-md:h-dvh max-md:max-h-dvh max-md:overflow-hidden md:min-h-screen">
      <Navbar authenticated />
      <main className="home-main-shell message-thread-page feed-page min-h-0 flex-1 max-md:flex max-md:flex-col max-md:overflow-hidden max-md:py-0 md:min-h-[calc(100vh-4rem)] md:py-6">
        <div className="message-thread-page-inner mx-auto w-full max-w-2xl px-3 sm:px-4 max-md:flex max-md:min-h-0 max-md:flex-1 max-md:flex-col max-md:px-0">
          <MessagesAutoRefresh initialVersion={messagesVersion} peerId={peerId} />
          <MessageThreadView peer={peer} messages={messages} currentUserId={user.id} />
        </div>
      </main>
      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
}
