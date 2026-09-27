"use client";
import { useUser } from '@clerk/nextjs';
import { format } from "date-fns";
import { Skeleton } from '../ui/skeleton';
import { CalendarDays } from 'lucide-react';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import { type MonthSelection } from "@/lib/helper";
import { MonthYearPicker } from '../month-year-picker';
import { useState } from 'react';

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

interface DashBoardHeadProps {
    selectedMonth: MonthSelection;
    onMonthChange: (value: MonthSelection) => void;
}

export function DashBoardHead({ selectedMonth, onMonthChange }: DashBoardHeadProps) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];
    const { isLoaded, user } = useUser();
    const todayText = format(
        new Date(),
        "EEEE, dd MMM yyyy"
    );
    const hour = new Date().getHours();
    const greeting =
    hour < 12
    ? "Good Morning"
    : hour < 18
    ? "Good Afternoon"
    : "Good Evening";
    if (!isLoaded) return (
        <div className="flex flex-col gap-1">
            <div className='flex items-center'>
                <h1 className='text-2xl animate-pulse'>{greeting}</h1>
            </div>
            <Skeleton className='h-6 w-48'/>
        </div>
    )

    if (!user) return null;

    return (
        <div className='flex @xl/main:flex-row flex-col gap-2'>
            <div className="flex flex-1 flex-col gap-1">
                <div className='flex items-center gap-x-2 flex-wrap'>
                    <h1 className='@xl/main:text-2xl text-xl'>{greeting}</h1>
                    <h1 className='@xl/main:text-2xl text-xl'>Mr. {user.fullName}</h1>
                </div>
                <div className='flex items-center gap-2 text-muted-foreground text-sm'>
                    <CalendarDays className='size-4'/>
                    <span>{todayText}</span>
                </div>
            </div>
            <div className='flex flex-0'>
                <MonthYearPicker selectedMonth={selectedMonth} onMonthChange={onMonthChange} open={pickerOpen} onOpenChange={setPickerOpen}/>
            </div>
        </div>
    )
}