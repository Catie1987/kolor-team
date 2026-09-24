
import { Metadata } from "next";
import { TaskListClient } from "./task-list-client";
export const metadata: Metadata = {
  title: "My Task List",
};

export default async function MyTaskListPage() {
  // await requireAdmin("/dashboard"); // non-admins bounce to /dashboard, not /

  return (
    <div className="@container/main flex-1 h-full py-2 md:gap-6 md:py-4 px-2 lg:px-4">
      <TaskListClient/>
    </div>
  );
}