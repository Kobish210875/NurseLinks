import { Suspense } from "react";
import { redirect } from "next/navigation";
import Footer from "@/components/Footer";
import DeleteAccountSection from "@/components/profile/DeleteAccountSection";
import Navbar from "@/components/Navbar";
import ProfileChangePasswordSection from "@/components/profile/ProfileChangePasswordSection";
import ProfileForm from "@/components/profile/ProfileForm";
import ProfilePageSkeleton from "@/components/profile/ProfilePageSkeleton";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getLocale } from "@/lib/i18n/get-locale";
import { createT, getMessages } from "@/lib/i18n/messages";

type ProfilePageProps = {
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
};

async function ProfileContent({ searchParams }: ProfilePageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const locale = await getLocale();
  const t = createT(getMessages(locale));
  const params = await searchParams;

  const errorMessage =
    params.error === "invalid-city"
      ? t("errors.invalid-city")
      : params.error === "invalid-institution"
        ? t("profile.saveFailed")
        : params.error === "save-failed"
          ? t("profile.saveFailed")
          : params.error === "delete-not-configured"
            ? t("profile.deleteNotConfigured")
            : params.error === "delete-failed"
              ? t("profile.deleteFailed")
              : null;

  return (
    <main id="profile-page-top" className="mx-auto max-w-[1128px] space-y-6 px-4 py-8">
      <ProfileForm user={user} saved={params.saved === "1"} error={errorMessage} />
      <ProfileChangePasswordSection />
      {!user.isAdmin ? <DeleteAccountSection /> : null}
    </main>
  );
}

export default function ProfilePage({ searchParams }: ProfilePageProps) {
  return (
    <>
      <Navbar authenticated />
      <Suspense fallback={<ProfilePageSkeleton />}>
        <ProfileContent searchParams={searchParams} />
      </Suspense>
      <div className="lg:hidden">
        <Footer />
      </div>
    </>
  );
}
