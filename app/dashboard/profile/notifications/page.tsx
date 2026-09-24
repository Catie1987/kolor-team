import { Metadata } from "next";
import { NotificationsClient } from "./notifications-client";
export const metadata: Metadata = {
  title: "Notifications",
};

export default function NotificationPage() {
  return (
    <div className="@container/main flex-1 h-full py-2 gap-4 md:py-4 px-2 lg:px-4">
      <NotificationsClient/>
    </div>
  );
}