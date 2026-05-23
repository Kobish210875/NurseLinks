import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import MessagesInbox from "@/components/messages/MessagesInbox";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getMessageThreads } from "@/lib/data/messages";
import { createClient } from "@/lib/supabase/server";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const supabase = await createClient();
  const threads = await getMessageThreads(supabase, user.id);

  return (
    <>
      <Navbar authenticated />
      <main className="feed-page min-h-[calc(100vh-4rem)] py-4 md:py-6">
        <div className="mx-auto max-w-2xl px-4">
          <MessagesInbox threads={threads} />
        </div>
      </main>
      <Footer />
    </>
  );
}
