// components/activity-grid.tsx
"use client"
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getMemberActivityByMonth, type DailyActivity } from "@/lib/actions/dashboard";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";

interface ActivityGridProps {
    memberId: string;
    month: number;
    year: number;
}

function parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
}

export function ActivityGrid({ memberId, month, year }: ActivityGridProps) {
    const [activity, setActivity] = useState<DailyActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getMemberActivityByMonth(memberId, month, year)
            .then(setActivity)
            .finally(() => setLoading(false));
    }, [memberId, month, year]);

    if (loading) {
        return <div className="h-24 flex items-center justify-center text-xs text-muted-foreground animate-pulse">Loading...</div>;
    }

    // Pad the start so the grid aligns to weekday columns (Sunday-first)
    const firstDay = new Date(year, month - 1, 1).getDay();
    const leadingBlanks = Array.from({ length: firstDay }, () => null);

    return (
        <div className="flex flex-col gap-2">
            <div className="grid grid-cols-7 gap-1.5">
                {leadingBlanks.map((_, i) => (
                    <div key={`blank-${i}`} className="size-4" />
                ))}
                {activity.map((day) => {
                    const cellColor = day.hasWorkActivity
                        ? "bg-primary"
                        : day.hasOnlineActivity
                        ? "bg-primary/50"
                        : "bg-muted";

                    return (
                        <Tooltip key={day.date}>
                            <TooltipTrigger render={
                                <div className={cn("size-5 rounded cursor-default", cellColor)} />
                            } />
                            <TooltipContent>
                                <p className="text-xs">
                                    {format(parseLocalDate(day.date), "EEEE, dd MMM yyyy")}
                                    {day.hasWorkActivity && ` — ${day.actionCount} action${day.actionCount > 1 ? "s" : ""}`}
                                    {day.hasOnlineActivity && !day.hasWorkActivity && " — online only"}
                                    {!day.hasWorkActivity && !day.hasOnlineActivity && " — no activity"}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>
        </div>
    )
}