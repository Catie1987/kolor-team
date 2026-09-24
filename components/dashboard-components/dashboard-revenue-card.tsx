"use client"
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from 'lucide-react';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { CSSProperties, useEffect, useState } from "react";
import { getMyProjectStatusStats, ProjectStatusStat } from "@/lib/actions/dashboard";
import { MonthSelection } from "@/lib/helper";
import { cn } from "@/lib/utils";
import { useLoadingRouter } from "@/hooks/use-loading-router";

interface DashboardRevenueCardProps {
    selectedMonth: MonthSelection;
}

export const salesRevenue = [
  { week: 'Week 1', revenue: 35200, grossProfit: 4200 },
  { week: 'Week 2', revenue: 41400, grossProfit: 5010 },
  { week: 'Week 3', revenue: 50230, grossProfit: 6280 },
  { week: 'Week 4', revenue: 39100, grossProfit: 4805 },
] as const

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
  grossProfit: {
    label: "Gross Profit",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

export function DashboardRevenueCard({ selectedMonth }: DashboardRevenueCardProps) {
    const [stats, setStats] = useState<ProjectStatusStat[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useLoadingRouter();

    useEffect(() => {
        setLoading(true);
        getMyProjectStatusStats({ month: selectedMonth.month, year: selectedMonth.year })
            .then(setStats)
            .finally(() => setLoading(false));
    }, [selectedMonth]);
    const total = stats.reduce((sum, s) => sum + s.value, 0);
    return (
        <div className="flex flex-col @5xl/main:flex-row gap-4 *:data-[slot=card]:min-h-30 *:data-[slot=card]:rounded-md *:data-[slot=card]:py-4 *:data-[slot=card]:px-4 w-full">
            <Card className="@container/card justify-between select-none flex-1 gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">Weekly Sales Revenue</h2>
                    <div className="flex items-center">
                        <Button variant="link" className="px-1"
                        onClick={() => router.push("/dashboard/sales-report")}
                        >
                            View detail
                        </Button>
                        <ArrowUpRight className="size-4 text-primary"/>
                    </div>
                </div>
                <div className="flex gap-4 @xl/card:flex-row flex-col">
                    <div className="grid @xl/card:grid-cols-1 grid-cols-3 gap-6 min-w-40 min-h-12 max-h-48 my-auto tracking-wide">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-xl font-semibold">$ 212k</h1>
                            <span className="text-muted-foreground">Total this month</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <h1 className="text-xl font-semibold">18%</h1>
                            <span className="text-muted-foreground">Gross profit rate</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <h1 className="text-xl font-semibold">34</h1>
                            <span className="text-muted-foreground">Active Customers</span>
                        </div>
                    </div>
                    <div className="w-full">
                        <div className="flex items-center justify-end gap-4 mb-2">
                            <div className="flex items-center gap-2">
                                <span className="h-3 w-3 aspect-square rounded-full bg-chart-1"/>
                                <p className="font-medium text-foreground/80">Sales Revenue</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-3 w-3 aspect-square rounded-full bg-chart-3"/>
                                <p className="font-medium text-foreground/80">Gross Profit</p>
                            </div>
                        </div>
                        <ChartContainer config={chartConfig} className="h-64 w-full aspect-auto">
                            <BarChart 
                                accessibilityLayer 
                                data={[...salesRevenue]}
                                barCategoryGap="24%"
                                barGap={5}
                            >
                                <CartesianGrid vertical={false} />
                                <XAxis
                                dataKey="week"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                />
                                <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                />
                                <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent indicator="dot"/>
                                }
                                />
                                {/* <ChartLegend position={"top"} offset={10} content={<ChartLegendContent />} /> */}
                                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="grossProfit" fill="var(--color-grossProfit)" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                    </div>
                </div>
                
            </Card>
            <Card className="@container/card select-none @xl/main:min-w-md gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">Project Stats</h2>
                    <div className="flex items-center">
                        <Button variant="link" className="px-1"
                        onClick={() => router.push("/dashboard/project-management")}
                        >
                            All Projects
                        </Button>
                        <ArrowUpRight className="size-4 text-primary"/>
                    </div>
                </div>
                {loading ? (
                    <p className="text-sm text-muted-foreground py-4 text-center animate-pulse">Loading...</p>
                    ) : total === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No projects yet.</p>
                    ) : (
                    <div className="flex flex-col gap-6 h-full justify-between">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-4 text-sm">
                                <span className="text-muted-foreground">Total Projects</span>
                                <span className="font-semibold text-foreground">{total}</span>
                            </div>
                            <div className="flex h-6 items-start gap-1 overflow-hidden rounded-sm">
                                {stats
                                    .filter((s) => s.value > 0) // bar only shows non-zero segments
                                    .map((s, index) => (
                                        <span
                                            key={s.status}
                                            className={cn("project-load-segment h-full min-w-4 shrink-0 rounded-sm", s.color)}
                                            style={{
                                                "--segment-width": `${(s.value / total) * 100}%`,
                                                animationDelay: `${index * 90}ms`,
                                            } as CSSProperties}
                                        />
                                    ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 h-48 justify-between">
                            {stats.map((s) => (
                                <div key={s.status} className="flex min-w-0 items-center gap-3 text-sm">
                                    <div className="flex min-w-0 shrink-0 items-center gap-2">
                                        <span className={cn("size-4 rounded-[6px]", s.color)} />
                                        <span className="truncate font-medium text-foreground/80">
                                            {s.label}
                                        </span>
                                    </div>
                                    <span className="min-w-0 flex-1 border-t border-dashed border-border" />
                                    <div className="flex shrink-0 items-center gap-2">
                                        <span className="w-6 text-right font-medium text-foreground/80">
                                            {s.value}
                                        </span>
                                        <span className="w-10 text-right text-muted-foreground">
                                            {s.percent}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Card>
        </div>
    )
}