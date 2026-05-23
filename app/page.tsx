import AuthLanding from "@/components/auth/AuthLanding";
import LanguageToggle from "@/components/i18n/LanguageToggle";
import NurseLinkWordmark from "@/components/NurseLinkWordmark";

export default function LandingPage() {
  return (
    <div className="feed-page flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border bg-nav-bg px-4 py-3">
        <NurseLinkWordmark textClassName="text-primary" />
        <LanguageToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <AuthLanding />
      </main>
    </div>
  );
}
