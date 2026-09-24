"use client"

import { Label, Pie, PieChart } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useMemo } from "react"

const chartData = [
  { amount: "sales", contribute: 1205, fill: "var(--color-sales)" },
  { amount: "support", contribute: 800, fill: "var(--color-support)" },
  { amount: "remain", contribute: 5800, fill: "var(--color-remain)" },
]

const chartConfig = {
  contribute: {
    label: "Contribute",
  },
  sales: {
    label: "Sales",
    color: "var(--chart-1)",
  },
  support: {
    label: "Support",
    color: "var(--chart-1a)",
  },
  remain: {
    label: "Remain",
    color: "var(--chart-1b)",
  },
} satisfies ChartConfig


export function SalesContributionChart() {
    const totalRevenue = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.contribute, 0)
  }, [])
    return (
        <div className="flex flex-col flex-1 border">
            <p>Sales contribution chart</p>
            <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square w-full max-w-[250px]"
            >
                <PieChart>
                    <Pie
                        data={chartData}
                        dataKey="contribute"
                        nameKey="amount"
                        innerRadius={80}
                        strokeWidth={5}
                        cornerRadius="50%"
                        paddingAngle={2}
                    >
                        <Label
                            content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                return (
                                <text
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                >
                                    <tspan
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    className="fill-foreground text-3xl font-bold"
                                    >
                                    {totalRevenue.toLocaleString()}
                                    </tspan>
                                    <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 24}
                                    className="fill-muted-foreground"
                                    >
                                    Visitors
                                    </tspan>
                                </text>
                                )
                            }
                            }}
                        />
                    </Pie>
                </PieChart>
            </ChartContainer>
        </div>
    )
}