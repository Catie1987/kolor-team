import { Metadata } from "next";
import { ContactListClient } from "./contact-list-client";
export const metadata: Metadata = {
  title: "Customer List",
};

export default function CustomerListPage() {
  return (
      <ContactListClient/>
  );
}