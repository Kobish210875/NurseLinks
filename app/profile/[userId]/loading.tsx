import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProfilePageSkeleton from "@/components/profile/ProfilePageSkeleton";

export default function PublicProfileLoading() {
  return (
    <>
      <Navbar authenticated />
      <ProfilePageSkeleton />
      <Footer />
    </>
  );
}
