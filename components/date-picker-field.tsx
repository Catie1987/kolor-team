// components/date-picker-field.tsx
"use client"
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils";
import { useState } from "react";


interface DatePickerFieldProps {
    value: string; // ISO date string, e.g. "2026-09-05"
    onChange: (isoDate: string) => void;
    placeholder?: string;
    className?: string;
}
function parseLocalDate(value: string): Date | undefined {
    if (!value) return undefined;
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function toLocalIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function DatePickerField({ value, onChange, placeholder = "Pick a date", className }: DatePickerFieldProps) {
    const [open, setOpen] = useState(false);
    const selectedDate = value ? new Date(value) : undefined;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger render={
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal h-9 rounded-sm",
                        !selectedDate && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="size-4" />
                    {selectedDate ? format(selectedDate, "dd-MMM-yyyy") : placeholder}
                </Button>
            } />
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    captionLayout="dropdown"
                    onSelect={(date) => {
                        if (date) {
                            onChange(toLocalIsoDate(date));
                            setOpen(false); // close after selecting
                        }
                    }}
                    autoFocus
                />
            </PopoverContent>
        </Popover>
    )
}