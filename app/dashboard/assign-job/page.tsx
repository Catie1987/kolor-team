import { requireAdmin } from "@/lib/roles";
import { Metadata } from "next";
import { getAllMembers } from "@/lib/actions/users";
import { MemberClient } from "./member-client";
export const metadata: Metadata = {
  title: "Assign Job",
};

export default async function AssignJobPage() {
  await requireAdmin("/dashboard");
  const members = await getAllMembers();

  return (
    <div className="@container/main flex flex-1 h-full py-2 md:gap-6 md:py-4 px-2 lg:px-4">
      <MemberClient members={members}/>
    </div>
  );
}