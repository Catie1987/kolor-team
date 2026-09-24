"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useMemo } from "react";
import { Wallet, TrendingUp, BriefcaseBusiness, SquarePen, Clock, CircleDollarSign, TrendingDown } from 'lucide-react';
import DonutChartCompletion from "./pie-completion";

const metrics = {
sales: [45, 67, 82, 74, 90, 78],
kpi: [60, 62, 58, 70, 76, 85],
projects: [30, 42, 55, 60, 58, 70],
tasks: [80, 75, 88, 92, 86, 95],
};

export function DashboardKpiCard() {
    return (
        <div className="grid @xl/main:grid-cols-2 @5xl/main:grid-cols-4 gap-4 *:data-[slot=card]:min-h-30 *:data-[slot=card]:rounded-md *:data-[slot=card]:py-4 *:data-[slot=card]:px-4">
            <Card className="@container/card bg-gradient-to-b from-primary to-primary/70 border-primary justify-between select-none">
                <div className="flex items-center justify-between">
                    <span className="text-muted">This month KPI</span>
                    <Wallet className="text-muted size-5"/>
                </div>
                <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-xl text-card">$ 580.25</h2>
                        <div className="font-mono flex gap-1 text-xs items-center">
                            <TrendingUp className="size-3.5 text-card"/>
                            <span className="text-card tracking-wide">12%</span> 
                            <span className="text-muted">.vs last month</span>
                        </div>
                    </div>
                    <MetricBars
                        lastSixDays={metrics.kpi}
                        className="bg-card"
                    />
                </div>
            </Card>
            <Card className="@container/card justify-between select-none">
                <div className="flex items-center justify-between text-muted-foreground">
                    <span className="">Project Follow</span>
                    <BriefcaseBusiness className="size-5"/>
                </div>
                <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-xl text-foreground font-semibold">4 <span className="text-sm font-normal text-muted-foreground">projects</span></h2>
                        <div className="font-mono flex gap-1 text-xs items-center">
                            <TrendingUp className="size-3.5 text-foreground"/>
                            <span className="text-foreground tracking-wide">+2</span> 
                            <span className="text-muted-foreground">.vs last month</span>
                        </div>
                    </div>
                    <MetricBars
                        lastSixDays={metrics.projects}
                        className="bg-chart-5"
                    />
                </div>
            </Card>
            <Card className="@container/card justify-between select-none">
                <div className="flex items-center justify-between text-muted-foreground">
                    <span className="">Task Completion</span>
                    <SquarePen className="size-5"/>
                </div>
                <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-xl text-foreground font-semibold">45 <span className="text-sm font-normal text-muted-foreground">%</span></h2>
                        <div className="font-mono flex gap-1 text-xs items-center">
                            <Clock className="size-3.5 text-foreground"/>
                            <span className="text-foreground tracking-wide">32</span> 
                            <span className="text-muted-foreground">total tasks</span>
                        </div>
                    </div>
                    <DonutChartCompletion completionRate={45} size={36} strokeWidth={5}/>
                </div>
            </Card>
            <Card className="@container/card justify-between select-none">
                <div className="flex items-center justify-between text-muted-foreground">
                    <span className="">Sales Revenue</span>
                    <CircleDollarSign className="size-5"/>
                </div>
                <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-xl text-foreground font-semibold">$ 85,400</h2>
                        <div className="font-mono flex gap-1 text-xs items-center">
                            <TrendingDown className="size-3.5 text-foreground"/>
                            <span className="text-foreground tracking-wide">-30%</span> 
                            <span className="text-muted-foreground">.vs last month</span>
                        </div>
                    </div>
                    <MetricBars
                        lastSixDays={metrics.sales}
                        className="bg-chart-1"
                    />
                </div>
            </Card>
        </div>
    )
}

function MetricBars({
  lastSixDays,
  className,
}: {
  lastSixDays: readonly number[]
  className: string
}) {
  const maximum = Math.max(...lastSixDays, 1)

  return (
    <div className="flex h-7.5 w-10 shrink-0 items-end justify-between">
      {lastSixDays.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className={cn('w-1 rounded-t-sm', className)}
          style={{ height: `${(value / maximum) * 100}%` }}
        />
      ))}
    </div>
  )
}