import Link from "next/link";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import MarkThreadReadOnOpen from "@/components/messages/MarkThreadReadOnOpen";
import MessagesAutoRefresh from "@/components/messages/MessagesAutoRefresh";
import MessageThreadView from "@/components/messages/MessageThreadView";
import Navbar from "@/components/Navbar";
import { createT, getMessages } from "@/lib/i18n/messages";
import { getLocale } from "@/lib/i18n/get-locale";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getNetworkPeer } from "@/lib/data/connections";
import { getThreadMessages, usersAreConnected } from "@/lib/data/messages";
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

  const connected = await usersAreConnected(supabase, user.id, peerId);
  const [messages, messagesVersion] = connected
    ? await Promise.all([
        getThreadMessages(supabase, user.id, peerId),
        getMessagesVersion(supabase, user.id, peerId),
      ])
    : [[], "disconnected"];

  const locale = await getLocale();
  const t = createT(getMessages(locale));

  return (
    <>
      <Navbar authenticated />
      <main className="feed-page min-h-0 py-4 max-md:pb-[calc(var(--mobile-bottom-nav-offset)+0.5rem)] md:min-h-[calc(100vh-4rem)] md:py-6">
        <div className="mx-auto max-w-2xl px-3 sm:px-4">
          {!connected ? (
            <div className="feed-card p-6 text-center">
              <p className="text-sm text-muted-foreground">{t("messages.notConnected")}</p>
              <Link
                href="/network"
                className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
              >
                {t("network.title")}
              </Link>
            </div>
          ) : (
            <>
              <MessagesAutoRefresh initialVersion={messagesVersion} peerId={peerId} />
              <MarkThreadReadOnOpen peerId={peerId} />
              <MessageThreadView peer={peer} messages={messages} isAdmin={user.isAdmin} />
            </>
          )}
        </div>
      </main>
      <div className="lg:hidden">
        <Footer />
      </div>
    </>
  );
}
