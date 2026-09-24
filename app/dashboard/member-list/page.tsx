import { Metadata } from "next";
import { MemberListClient } from "./member-list-client";
export const metadata: Metadata = {
  title: "Member List",
};

export default function MemberListPage() {
  return (
      <MemberListClient/>
  );
}