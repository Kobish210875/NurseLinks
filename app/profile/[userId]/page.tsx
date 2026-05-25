import Link from "next/link";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProfileViewCard from "@/components/profile/ProfileViewCard";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getProfileView } from "@/lib/data/profile-view";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";
import { createClient } from "@/lib/supabase/server";

type PublicProfilePageProps = {
  params: Promise<{ userId: string }>;
};

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const viewer = await getCurrentUser();
  if (!viewer) {
    redirect("/");
  }

  const { userId } = await params;

  if (userId === viewer.id) {
    redirect("/profile");
  }

  const supabase = await createClient();
  const profile = await getProfileView(supabase, userId, viewer.id);
  const locale = await getLocale();
  const t = createT(getMessages(locale));

  if (!profile) {
    return (
      <>
        <Navbar authenticated />
        <main className="mx-auto max-w-xl px-4 py-12 text-center">
          <p className="text-muted-foreground">{t("profile.notFound")}</p>
          <Link href="/network" className="mt-4 inline-block text-sm font-medium text-primary">
            {t("network.title")}
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar authenticated />
      <main className="mx-auto max-w-[1128px] px-4 py-8">
        <div className="mx-auto mb-4 max-w-xl text-start">
          <Link href="/network" className="text-sm font-medium text-primary hover:underline">
            {t("network.backToNetwork")}
          </Link>
        </div>
        <ProfileViewCard profile={profile} isOwnProfile={false} />
      </main>
      <Footer />
    </>
  );
}
