import { requireAdmin } from "@/lib/roles";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Admin Payroll",
};

export default async function SalesPayrollPage() {
  await requireAdmin("/dashboard"); // non-admins bounce to /dashboard, not /

  return (
    <div className="@container/main flex flex-1 h-full py-2 md:gap-6 md:py-4 px-2 lg:px-4">
      Admin Page Payroll
    </div>
  );
}