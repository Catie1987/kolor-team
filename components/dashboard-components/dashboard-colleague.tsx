"use client";

import { ColleagueDetail, ColleagueStat, getColleagueDetail } from "@/lib/actions/dashboard";
import { CheckCircle2, CheckCircle2Icon, Clock, ListChecks, UserRoundIcon, XIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "../ui/button";
import { useLoadingRouter } from "@/hooks/use-loading-router";
import { Separator } from "../ui/separator";
import { Progress } from "../ui/progress";
import { formatDistanceToNow, format } from "date-fns";
import { employmentTypeOptions, months, MonthSelection } from "@/lib/helper";
import { ActivityGrid } from "../activity-grid";

interface DashboardColleagueProps {
    colleague: ColleagueStat;
    index: number;
    initials: string;
    selectedMonth: MonthSelection;
}

const rankColors = ["text-yellow-500", "text-slate-400", "text-amber-700"];

export function DashboardColleague({
    colleague,
    index,
    initials,
    selectedMonth,
}: DashboardColleagueProps) {
    const [openMemeberSheet, setOpenMemeberSheet] = useState(false);
    return (
        <>
            <div 
                className="flex items-center gap-3 p-3 hover:bg-muted transition-colors duration-100"
                onClick={()=> setOpenMemeberSheet(true)}
            >
                <Avatar className="size-9 shrink-0 after:rounded-md" size="lg">
                    <AvatarImage src={colleague.imageUrl} alt={colleague.fullName} className="rounded-md"/>
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{colleague.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                        {colleague.department || "Department not available"}
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4 shrink-0">
                    <div className="flex flex-col items-end">
                        <p className="text-sm">{colleague.sharedProjectCount} projects</p>
                        <span className="text-sm text-muted-foreground">Together</span>
                    </div>
                    <div className="flex flex-col">
                        <p className="text-sm">{colleague.tasksAssignedByMeCompleted} tasks</p>
                        <span className="text-sm text-muted-foreground">Support</span>
                    </div>
                </div>
            </div>
            <MemberDetailSheet
                open={openMemeberSheet}
                onOpenChange={setOpenMemeberSheet}
                colleagueId={colleague.id}
                selectedMonth={selectedMonth}
            />
        </>
    )
}

interface MemeberDetailSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    colleagueId: string;
    selectedMonth: MonthSelection;
}

function MemberDetailSheet({open, onOpenChange, colleagueId, selectedMonth}: MemeberDetailSheetProps) {
    const router = useLoadingRouter();
    const [detail, setDetail] = useState<ColleagueDetail | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!open) return;
        setLoading(true);
        getColleagueDetail(colleagueId)
            .then(setDetail)
            .finally(() => setLoading(false));
    }, [open, colleagueId]);
    
    const initials = detail?.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "";
    const totalTasks = detail?.totalTasksAssigned ?? 0;
    const completionPercent = totalTasks > 0 ? Math.round(((detail?.totalTasksCompleted ?? 0) / totalTasks) * 100) : 0;

    const contractType = employmentTypeOptions.find(
        (item) => item.value === detail?.employmentType
    );
    const monthLabel = `${months[selectedMonth.month - 1]} - ${selectedMonth.year}`;
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent 
            side="right"
            showCloseButton={false}
            className="w-full! max-w-full! overflow-hidden bg-transparent sm:p-3 shadow-none sm:w-130! sm:max-w-130! border-none"
            >
                <div className="flex h-full bg-background min-h-0 w-full flex-col overflow-hidden border sm:rounded-2xl">
                    <header className="flex h-19 shrink-0 items-center justify-between px-6">
                        <SheetTitle className="text-xl">Member Details</SheetTitle>

                        <SheetClose render={
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-lg"
                                aria-label="Close staff details"
                                className="[&_svg]:size-5!"
                            >
                                <XIcon />
                            </Button>
                        }/>
                    </header>
                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
                        <SheetDescription className="sr-only">
                            Details for {detail?.fullName ?? "member"}
                        </SheetDescription>
                        {loading ? (
                            <p className="text-sm text-muted-foreground text-center py-8 animate-pulse">Loading...</p>
                        ) : !detail ? (
                            <p className="text-sm text-muted-foreground text-center py-8">Could not load member details.</p>
                        ) : (
                            <div className="flex flex-col gap-8">
                                <section className="flex items-center gap-3">
                                    <Avatar className="size-30 shrink-0 after:rounded-xl">
                                        <AvatarImage src={detail.imageUrl} alt={detail.fullName} className='rounded-xl' />
                                        <AvatarFallback>{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex min-w-0 flex-col gap-1">
                                        <h3 className="truncate text-2xl font-medium">
                                            {detail.fullName || "New User"}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {detail.workAt || "AMS Vietnam Co.,Ltd"}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {detail.department || "Not in any Department"}
                                        </p>
                                        {detail.isOnline ? (
                                            <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                                                <CheckCircle2Icon className="size-3.5 text-chart-3" />
                                                <span className="text-chart-3">Online</span>
                                                <span className="text-muted-foreground">-</span>
                                                <span>is active now</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap items-center gap-2 text-sm font-normal text-muted-foreground/70">
                                                <Clock className="size-3.5" />
                                                <span>Offline</span>
                                                <span>-</span>
                                                <span>
                                                    {detail.lastActiveAt
                                                        ? formatDistanceToNow(new Date(detail.lastActiveAt), { addSuffix: true })
                                                        : "never active"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </section>
                                <Separator />
                                <section className="flex flex-col gap-3">
                                    <h3 className="text-lg font-medium">Personal&apos;s Contribution</h3>
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div className="border bg-card rounded-lg p-4 flex flex-col h-32 justify-between">
                                            <p className="text-sm text-muted-foreground">
                                                Project Leader
                                            </p>
                                            <div className="flex flex-col gap-2">
                                                <p className="text-2xl font-medium">
                                                    {detail.projectsLedCount}
                                                    <span className="text-xs text-muted-foreground"> / {detail.totalProjectsCount}</span>
                                                </p>
                                                <p className="text-xs font-mono text-muted-foreground">
                                                    <span className="mr-1 text-chart-1">
                                                        {detail.totalProjectsCount > 0
                                                            ? Math.round((detail.projectsLedCount / detail.totalProjectsCount) * 100)
                                                            : 0}%
                                                    </span>
                                                    in total
                                                </p>
                                            </div>
                                        </div>
                                        <div className="border bg-card rounded-lg p-3 flex flex-col h-32 justify-between">
                                            <p className="text-sm text-muted-foreground">
                                                Project Follow
                                            </p>
                                            <div className="flex flex-col gap-2">
                                                <p className="text-2xl font-medium">
                                                    {detail.projectsFollowedCount}
                                                    <span className="text-xs text-muted-foreground"> / {detail.totalProjectsCount}</span>
                                                </p>
                                                <p className="text-xs font-mono text-muted-foreground">
                                                    <span className="mr-1 text-chart-1">
                                                        {detail.totalProjectsCount > 0
                                                        ? Math.round((detail.projectsFollowedCount / detail.totalProjectsCount) * 100)
                                                        : 0}%
                                                    </span>
                                                    in total
                                                </p>
                                            </div>
                                        </div>
                                        <div className="border bg-card rounded-lg p-3 flex flex-col h-32 justify-between">
                                            <p className="text-sm text-muted-foreground">
                                                Contacts Added
                                            </p>
                                            <div className="flex flex-col gap-2">
                                                <p className="text-2xl font-medium">
                                                    {detail.contactsAddedCount}
                                                    <span className="text-xs text-muted-foreground"> / {detail.totalContactsCount}</span>
                                                </p>
                                                <p className="text-xs font-mono text-muted-foreground">
                                                    <span className="mr-1 text-chart-1">
                                                        {detail.totalContactsCount > 0
                                                        ? Math.round((detail.contactsAddedCount / detail.totalContactsCount) * 100)
                                                        : 0}
                                                    </span>
                                                    in total
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                                <section className="flex flex-col gap-3 w-full">
                                    <h3 className="text-lg font-medium">Monthly Activities</h3>
                                    <div className="border bg-card rounded-lg p-4 flex justify-between gap-2">
                                        <div className="flex flex-col gap-2">
                                            <span className="font-medium mb-auto">{monthLabel}</span>
                                            <div className="flex gap-2 items-center">
                                                <span className="size-4 shrink-0 aspect-square bg-muted rounded"/>
                                                <p className="text-muted-foreground">no activities</p>
                                            </div>
                                            <div className="flex gap-2 items-center">
                                                <span className="size-4 shrink-0 aspect-square bg-primary/50 rounded"/>
                                                <p className="text-muted-foreground">online</p>
                                            </div>
                                            <div className="flex gap-2 items-center">
                                                <span className="size-4 shrink-0 aspect-square bg-primary rounded"/>
                                                <p className="text-muted-foreground">has activities</p>
                                            </div>
                                        </div>
                                        <div className="w-fit">
                                            <ActivityGrid memberId={colleagueId} month={selectedMonth.month} year={selectedMonth.year} />
                                        </div>
                                    </div>
                                </section>
                                <section className="flex flex-col gap-3">
                                    <h3 className="text-lg font-medium">Performance</h3>
                                    <div className="border bg-card rounded-lg p-4 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium flex items-center gap-1.5">
                                                <ListChecks className="size-4" />
                                                Task Progress
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {detail.totalTasksCompleted} / {totalTasks} completed
                                            </span>
                                        </div>
                                        <Progress value={completionPercent}/>
                                        <div className="flex items-center gap-2 mt-1">
                                            <CheckCircle2 className="size-4 text-chart-3" />
                                            <span className="text-sm text-muted-foreground">
                                                {completionPercent}% completion rate overall
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 mt-1">
                                        <div className="flex flex-col items-center gap-2 border rounded-md py-2 bg-card">
                                            <span className="text-xs text-muted-foreground">To Do</span>
                                            <span className="text-lg font-semibold">{detail.tasksByStatus.todo}</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-2 border rounded-md py-2 bg-card">
                                            <span className="text-xs text-muted-foreground">In Progress</span>
                                            <span className="text-lg font-semibold">{detail.tasksByStatus.in_progress}</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-2 border rounded-md py-2 bg-card">
                                            <span className="text-xs text-muted-foreground">Done</span>
                                            <span className="text-lg font-semibold text-chart-3">{detail.tasksByStatus.done}</span>
                                        </div>
                                    </div>
                                </section>
                                <section className="flex flex-col gap-3">
                                    <h3 className="text-lg font-medium">Member Information</h3>
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div className="flex min-w-0 flex-col gap-2 rounded-md bg-card p-4 border">
                                            <span className="text-sm text-muted-foreground">Role</span>
                                            <span className="truncate font-medium capitalize">{detail.role}</span>
                                        </div>
                                        <div className="flex min-w-0 flex-col gap-2 rounded-md bg-card p-4 border">
                                            <span className="text-sm text-muted-foreground">Contract Type</span>
                                            <span className="truncate font-medium">{contractType ? contractType.label : "—"}</span>
                                        </div>
                                        <div className="flex min-w-0 flex-col gap-2 rounded-md bg-card p-4 border">
                                            <span className="text-sm text-muted-foreground">Joined Date</span>
                                            <span className="truncate font-medium">{detail.joinedDate ? format(detail.joinedDate, "MMM dd, yyyy") : "—"}</span>
                                        </div>
                                        <div className="flex min-w-0 flex-col gap-2 rounded-md bg-card p-4 border">
                                            <span className="text-sm text-muted-foreground">Birthday</span>
                                            <span className="truncate font-medium">{detail.dateOfBirth ? format(detail.dateOfBirth, "MMM dd, yyyy") : "—"}</span>
                                        </div>
                                        <div className="flex min-w-0 flex-col gap-2 rounded-md bg-card p-4 border">
                                            <span className="text-sm text-muted-foreground">Working Hour</span>
                                            <span className="truncate font-medium">{detail.workingHour ? detail.workingHour: "—"}</span>
                                        </div>
                                        <div className="flex min-w-0 flex-col gap-2 rounded-md bg-card p-4 border">
                                            <span className="text-sm text-muted-foreground">Bio</span>
                                            <span className="truncate font-medium">{detail.bio ? detail.bio: "—"}</span>
                                        </div>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="flex min-w-0 flex-col gap-2 rounded-md bg-card p-4 border">
                                            <span className="text-sm text-muted-foreground">Email</span>
                                            <span className="truncate font-medium">{detail.email}</span>
                                        </div>
                                        <div className="flex min-w-0 flex-col gap-2 rounded-md bg-card p-4 border">
                                            <span className="text-sm text-muted-foreground">Phone</span>
                                            <span className="truncate font-medium">{detail.personalPhone ? detail.personalPhone: "—"}</span>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>
                    <footer className="p-4 flex flex-col gap-3">
                        <Button 
                            className="h-12 w-full"
                            onClick={() => {
                                onOpenChange(false);
                                router.push(`/dashboard/profile/${detail?.clerkId}`)
                            }}
                        >
                            Full Profile
                            <UserRoundIcon />
                        </Button>
                    </footer>
                </div>
            </SheetContent>
        </Sheet>
    )
}