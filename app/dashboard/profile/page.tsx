import { Metadata } from "next";
import ViewProfile from "./view-profile";
export const metadata: Metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  return (
    <div className="@container/main flex flex-1 h-full py-2 md:gap-6 md:py-4 px-2 lg:px-4">
      <ViewProfile/>
    </div>
  );
}