"use client"

import { cn } from "@/lib/utils"
import { Button } from "../ui/button"
import { ArrowUpRight } from "lucide-react"
import { MonthSelection } from "@/lib/helper";
import { useEffect, useState } from "react";
import { ColleagueStat, getMyTeamColleagues } from "@/lib/actions/dashboard";
import { DashboardColleague } from "./dashboard-colleague";


interface DashboardTaskMemberProps {
    selectedMonth: MonthSelection;
}

export function DashboardTaskMember({selectedMonth}: DashboardTaskMemberProps) {
    const [colleagues, setColleagues] = useState<ColleagueStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getMyTeamColleagues({ month: selectedMonth.month, year: selectedMonth.year, limit: 4 })
            .then(setColleagues)
            .finally(() => setLoading(false));
    }, [selectedMonth]);
    return (
        <div className="flex flex-col @5xl/main:flex-row gap-4 w-full">
            <div className={cn("@container/card justify-between select-none flex-1 gap-4",
                "min-h-30 border bg-card shadow-md rounded-lg"
            )}>
                <div className="flex items-center justify-between mt-4 px-4">
                    <h2 className="text-lg font-medium">Recent Tasks</h2>
                    <div className="flex items-center">
                        <Button variant="link" className="px-1"
                        // onClick={() => router.push("/dashboard/sales-report")}
                        >
                            View detail
                        </Button>
                        <ArrowUpRight className="size-4 text-primary"/>
                    </div>
                </div>
            </div>
            <div className={cn("@container/card select-none @xl/main:min-w-md gap-4",
                "min-h-30 border bg-card shadow-md rounded-lg"
            )}>
                <div className="flex items-center justify-between mt-4 px-4">
                    <h2 className="text-lg font-medium">Your Teams</h2>
                    <div className="flex items-center">
                        <Button variant="link" className="px-1"
                        // onClick={() => router.push("/dashboard/sales-report")}
                        >
                            View detail
                        </Button>
                        <ArrowUpRight className="size-4 text-primary"/>
                    </div>
                </div>
                {loading ? (
                    <p className="text-sm text-muted-foreground py-4 text-center animate-pulse px-4">Loading...</p>
                ) : colleagues.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center max-w-2/3 mx-auto px-4">No shared projects yet or you dont have any teammate this month</p>
                ) : (
                    <div className="flex flex-col divide-y mt-4">
                        {colleagues.map((c, index) => {
                            const initials = c.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                            return (
                                <DashboardColleague 
                                key={index} 
                                index={index} 
                                colleague={c} 
                                initials={initials}
                                selectedMonth={selectedMonth}
                                />
                            ) 
                        })}
                    </div>
                )}
            </div>
        </div>
    )
};
