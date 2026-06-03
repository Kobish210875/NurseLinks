import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProfilePageSkeleton from "@/components/profile/ProfilePageSkeleton";

export default function ProfileLoading() {
  return (
    <>
      <Navbar authenticated />
      <ProfilePageSkeleton />
      <div className="lg:hidden">
        <Footer />
      </div>
    </>
  );
}
