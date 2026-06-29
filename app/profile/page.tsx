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
    onboarding?: string;
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
    <div id="profile-page-top" className="mx-auto max-w-[1128px] space-y-6 px-4 py-8">
      <ProfileForm
        user={user}
        saved={params.saved === "1"}
        onboarding={params.onboarding === "1"}
        error={errorMessage}
      />
      <ProfileChangePasswordSection />
      {!user.isAdmin ? <DeleteAccountSection /> : null}
      <div className="mobile-page-bottom-spacer md:hidden" aria-hidden="true" />
    </div>
  );
}

export default function ProfilePage({ searchParams }: ProfilePageProps) {
  return (
    <div className="home-page-root flex min-h-screen flex-col max-md:block max-md:min-h-0">
      <Navbar authenticated />
      <main className="home-main-shell feed-page profile-page min-h-0 flex-1 max-md:block max-md:flex-none">
        <Suspense fallback={<ProfilePageSkeleton />}>
          <ProfileContent searchParams={searchParams} />
        </Suspense>
      </main>
      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
}
