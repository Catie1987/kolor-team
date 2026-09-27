import { Metadata } from "next";
import { MemberListClient } from "./member-list-client";
import { getAllMembers } from "@/lib/actions/users";
export const metadata: Metadata = {
  title: "Member List",
};

export default async function MemberListPage() {
  const members = await getAllMembers();
  if (!members) return null
  return (
      <div className="@container/main flex flex-1 h-full py-2 md:gap-6 md:py-4 px-2 lg:px-4 overflow-y-auto h-screen-main">
        <MemberListClient members={members}/>
      </div>
  );
}