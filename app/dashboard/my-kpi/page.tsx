import { Metadata } from "next";
import { MyKpiClient } from "./my-kpi-client";
export const metadata: Metadata = {
  title: "My KPI % Share",
};

export default async function SalesReportPage() {

  return (
    <div className="@container/main flex-1 h-full py-2 md:gap-6 md:py-4 px-2 lg:px-4">
      <MyKpiClient/>
    </div>
  );
}