"use client";
import { DashBoardHead } from "@/components/dashboard-components/dashboard-head";
import { DashboardKpiCard } from "@/components/dashboard-components/dashboard-kpi-card";
import { DashboardRevenueCard } from "@/components/dashboard-components/dashboard-revenue-card";
import { MonthSelection } from "@/lib/helper";
import { useState } from "react";
import { DashboardTaskMember } from "./dashboard-task-member";


export function DashboardClient() {
    const now = new Date();
    const [selectedMonth, setSelectedMonth] = useState<MonthSelection>({
        month: now.getMonth() + 1,
        year: now.getFullYear(),
    });
    return (
        <div className="@container/main py-2 md:py-4 px-4 lg:px-6 flex flex-1 flex-col gap-4 md:gap-6 overflow-y-auto no-scrollbar h-screen-main">
            <DashBoardHead
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
            />
            <DashboardKpiCard/>
            <DashboardRevenueCard selectedMonth={selectedMonth}/>
            <DashboardTaskMember selectedMonth={selectedMonth}/>
        </div>
    )
}