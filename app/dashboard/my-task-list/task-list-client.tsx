"use client"
import { useState, useEffect, useMemo } from "react";
import {
  InputGroup, InputGroupAddon, InputGroupInput,
} from "@/components/ui/input-group";
import { Search, Crown, CheckCircle2, Circle, Loader2, Pencil, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getMyTasks, updateTaskStatus, type MyTaskGroup } from "@/lib/actions/project-tasks";
import { useLoadingRouter } from "@/hooks/use-loading-router";
import { formatProjectId } from "@/lib/helper";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

const statusIcons: Record<string, React.ElementType> = {
    todo: Circle,
    in_progress: Loader2,
    done: CheckCircle2,
};


const statusVariant = [
    { id: "todo", label: "To Do", color: "bg-muted-foreground", activeColor: "bg-muted" },
    { id: "in_progress", label: "In Progress", color: "bg-yellow-500", activeColor: "bg-yellow-200" },
    { id: "done", label: "Done", color: "bg-green-500", activeColor: "bg-green-200" },
] as const;

export function TaskListClient() {
    const router = useLoadingRouter();
    const [groups, setGroups] = useState<MyTaskGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "todo" | "in_progress" | "done">("all");

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = { all: 0, todo: 0, in_progress: 0, done: 0 };
        for (const group of groups) {
            for (const task of group.tasks) {
                counts.all += 1;
                counts[task.status] = (counts[task.status] ?? 0) + 1;
            }
        }
        return counts;
    }, [groups]);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = () => {
        setLoading(true);
        getMyTasks()
            .then(setGroups)
            .finally(() => setLoading(false));
    };

    const filteredGroups = useMemo(() => {
        const q = search.trim().toLowerCase();

        return groups
            .map((g) => ({
                ...g,
                tasks: g.tasks.filter((t) => {
                    const matchesSearch =
                        !q ||
                        t.detail.toLowerCase().includes(q) ||
                        g.contactName.toLowerCase().includes(q) ||
                        g.contactShortName.toLowerCase().includes(q);
                    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
                    return matchesSearch && matchesStatus;
                }),
            }))
            .filter((g) => g.tasks.length > 0);
    }, [groups, search, statusFilter]);

    const totalTasks = filteredGroups.reduce((sum, g) => sum + g.tasks.length, 0);

    const handleToggleStatus = async (groupIndex: number, taskId: string, currentStatus: string) => {
        const nextStatus =
            currentStatus === "todo" ? "in_progress" : currentStatus === "in_progress" ? "done" : "todo";

        setGroups((prev) =>
            prev.map((g, i) =>
                i === groupIndex
                    ? { ...g, tasks: g.tasks.map((t) => (t.id === taskId ? { ...t, status: nextStatus as any } : t)) }
                    : g
            )
        );

        try {
            await updateTaskStatus(taskId, nextStatus);
        } catch {
            fetchTasks();
            toast.add({ type: "error", title: "Error", description: "Could not update task status." });
        }
    };

    return (
        <div className="flex flex-col flex-1 h-full ">
            <div className="pb-2 flex flex-col gap-2 sticky top-0 z-20 bg-background w-full">
                <InputGroup className="w-full bg-card shadow-sm">
                    <InputGroupInput
                        placeholder="Search tasks or projects..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <InputGroupAddon>
                        <Search />
                    </InputGroupAddon>
                    <InputGroupAddon align="inline-end">
                        {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
                    </InputGroupAddon>
                </InputGroup>
            </div>
            <div className="grid grid-cols-2 @2xl/main:grid-cols-4 gap-2 mb-2">
                <Button
                    variant={statusFilter === "all" ? "default" : "outline"}
                    size="default"
                    onClick={() => setStatusFilter("all")}
                    className={cn("rounded-sm shadow-sm", statusFilter !== "all" && "bg-card")}
                >
                    All
                </Button>
                {statusVariant.map((opt) => (
                <Button
                    key={opt.id}
                    variant={statusFilter === opt.id ? "default" : "outline"}
                    size="default"
                    onClick={() => setStatusFilter(opt.id)}
                    className={cn("rounded-sm shadow-sm gap-1.5", statusFilter !== opt.id && "bg-card")}
                >
                    <span className={cn("h-2 w-2 rounded-full mr-auto", statusFilter === opt.id ? opt.activeColor : opt.color)} />
                    {opt.label}
                    <Badge
                        variant="secondary"
                        className={cn("text-xs px-1.5 ml-auto", statusFilter === opt.id && "bg-primary-foreground/20 text-primary-foreground")}
                    >
                        {statusCounts[opt.id] ?? 0}
                    </Badge>
                </Button>
            ))}
            </div>
            {loading ? (
                <p className="text-sm text-muted-foreground p-8 text-center animate-pulse">Loading tasks...</p>
            ) : filteredGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground p-8 text-center">No tasks found.</p>
            ) : (
                <div className="flex flex-col bg-card rounded-lg border p-2 pb-0 @container/card">
                    {filteredGroups.map((group, groupIndex) => (
                        <div key={group.projectId} className="flex flex-col">
                        {/* Sticky project header — like alphabet headers in a contacts app */}
                            <div
                                className="sticky z-10 border bg-muted/80 rounded-md backdrop-blur-xs p-1 border-y flex items-center justify-between"
                                style={{ top: "48px" }} // adjust to match the search bar's height above
                                // onClick={() => router.push(`/dashboard/project-management/${group.projectId}`)}
                            >
                                <div className="flex items-center gap-2">
                                    {group.isLeader ? (
                                        <HoverCard>
                                            <HoverCardTrigger className="bg-primary border rounded-full p-2">
                                                <Crown className="size-3.5 text-card shrink-0" />
                                            </HoverCardTrigger>
                                            <HoverCardContent align={"start"}>
                                                This project is lead by you
                                            </HoverCardContent>
                                        </HoverCard>
                                    ): (
                                       <HoverCard>
                                            <HoverCardTrigger className="bg-card border rounded-full p-2">
                                                <Users className="size-3.5 text-primary shrink-0" />
                                            </HoverCardTrigger>
                                            <HoverCardContent align={"start"}>
                                                You are the members of this project and limited to edit and remove.
                                            </HoverCardContent>
                                        </HoverCard> 
                                    )}
                                    <Badge variant="outline" className="font-mono text-xs shrink-0 bg-card">
                                        {formatProjectId(group.projectNumber)}
                                    </Badge>
                                    <div className="flex items-center underline-offset-4 hover:underline cursor-pointer"
                                    onClick={() => router.push(`/dashboard/project-management/${group.projectId}`)}
                                    >
                                        <span className="text-sm">{`${group.contactShortName} `}</span>
                                        <p className="text-sm @lg/card:block hidden min-w-70 truncate">• {group.contactName}</p>
                                    </div>
                                    
                                </div>
                                <Badge variant="default" className="text-xs shrink-0 min-w-8">
                                    {group.tasks.length}
                                </Badge>
                            </div>
                            <div className="flex flex-col divide-y">
                                {group.tasks.map((task) => {
                                    const status = statusVariant.find((s) => s.id === task.status) ?? statusVariant[0];
                                    return (
                                        <div
                                            key={task.id}
                                            className="flex items-start gap-3 py-3 @lg/card:flex-row flex-col"
                                        >
                                            <Button
                                                variant="outline"
                                                size="xs"
                                                onClick={() => handleToggleStatus(groupIndex, task.id, task.status)}
                                                className={cn("w-26 gap-2 justify-start rounded-full")}
                                            >
                                                <span className={cn("size-2 aspect-square rounded-full", status.color)} />
                                                <p className="">{status.label}</p>
                                            </Button>
                                            <p
                                                className={cn(
                                                    "text-sm flex-1 mt-[1px]",
                                                    task.status === "done" && "line-through text-muted-foreground"
                                                )}
                                            >
                                                {task.detail}
                                            </p>
                                            <div className="flex items-center gap-2 @lg/card:ml-0 ml-auto">
                                                <Button size="icon-sm" variant="outline">
                                                    <Pencil/>
                                                </Button>
                                                <Button size="icon-sm" variant="outline">
                                                    <Trash2 className="text-red-500"/>
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div> 
            )}
        </div>
    )
}