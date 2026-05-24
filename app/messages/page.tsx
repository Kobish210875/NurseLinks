import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import MessagesFeed from "@/components/messages/MessagesFeed";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getMessageThreads } from "@/lib/data/messages";
import { getMessagesVersion } from "@/lib/data/sync-versions";
import { createClient } from "@/lib/supabase/server";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const supabase = await createClient();
  const [threads, messagesVersion] = await Promise.all([
    getMessageThreads(supabase, user.id),
    getMessagesVersion(supabase, user.id),
  ]);

  return (
    <div className="home-page-root flex min-h-screen flex-col max-md:block max-md:min-h-0">
      <Navbar authenticated />
      <main className="home-main-shell min-h-0 flex-1 max-md:block max-md:flex-none">
        <MessagesFeed threads={threads} messagesVersion={messagesVersion} />
      </main>
      <div className="lg:hidden">
        <Footer />
      </div>
    </div>
  );
}
