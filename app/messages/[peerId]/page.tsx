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
    <div className="home-page-root flex min-h-screen flex-col max-md:block max-md:min-h-0">
      <Navbar authenticated />
      <main className="home-main-shell message-thread-page feed-page min-h-0 flex-1 py-4 max-md:block max-md:flex-none max-md:py-0 md:min-h-[calc(100vh-4rem)] md:py-6">
        <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-3 sm:px-4 md:block md:flex-none">
          <MessagesAutoRefresh initialVersion={messagesVersion} peerId={peerId} />
          <MessageThreadView peer={peer} messages={messages} currentUserId={user.id} />
        </div>
      </main>
      <div className="lg:hidden">
        <Footer />
      </div>
    </div>
  );
}
