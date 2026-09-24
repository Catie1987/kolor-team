// components/dashboard-components/month-year-picker.tsx
"use client"
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MonthSelection } from "@/lib/helper";

const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface MonthYearPickerProps {
    selectedMonth: MonthSelection;
    onMonthChange: (value: MonthSelection) => void;
    yearRange?: number; 
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function MonthYearPicker({ selectedMonth, onMonthChange, yearRange = 2, open, onOpenChange }: MonthYearPickerProps) {
    const currentYear = new Date().getFullYear();

    const years = useMemo(() => {
        const list: number[] = [];
        for (let y = currentYear + yearRange; y >= currentYear - yearRange; y--) {
            list.push(y);
        }
        return list;
    }, [currentYear, yearRange]);

    const label = `${monthNames[selectedMonth.month - 1]}-${selectedMonth.year}`;

    const handleSelect = (month: number, year: number) => {
        onMonthChange({ month, year });
        onOpenChange(false); // close right after picking
    };

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger render={
                <Button variant="outline" className="w-36 h-10 justify-start gap-2 rounded-sm bg-card shadow-md mt-auto">
                    <Calendar className="size-4" />
                    {label}
                    <ChevronDown className="size-4 ml-auto"/>
                </Button>
            } />
            <PopoverContent className="w-60 p-0 overflow-hidden rounded-sm" align="end">
                <ScrollArea className="h-72">
                    <div className="flex flex-col">
                        {years.map((year) => (
                            <div key={year}>
                                <div className="sticky top-0 z-0 bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b">
                                    {year}
                                </div>
                                <div className="grid grid-cols-3 gap-1 p-2 pr-4">
                                    {monthNames.map((name, i) => {
                                        const monthNum = i + 1;
                                        const isSelected = selectedMonth.month === monthNum && selectedMonth.year === year;
                                        return (
                                            <button
                                                key={name}
                                                onClick={() => handleSelect(monthNum, year)}
                                                className={cn(
                                                    "flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                                                    isSelected && "bg-primary text-primary-foreground hover:bg-primary"
                                                )}
                                            >
                                                {name}
                                                
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}