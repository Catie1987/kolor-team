"use client"
import type { Notification } from "@/lib/actions/notifications";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user-components/user-avatar";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useIsMobile } from "@/hooks/use-mobile";

const typeLabels: Record<string, string> = {
    project_join_request: "Join Request",
    project_join_approved: "Join Approved",
    project_join_rejected: "Join Rejected",
    task_assigned: "Task Assigned",
    task_status_changed: "Task Status",
    project_status_changed: "Project Status",
    general: "General",
};

interface NotificationsListProps {
    notifications: Notification[];
    selectedId: string | null;
    onSelect: (n: Notification) => void;
    onDeleteMany: (ids: string[]) => void;
    onDeleteOne: (id: string) => void;
}

export function NotificationsList({ 
    notifications,
    selectedId,
    onSelect,
    onDeleteMany,
    onDeleteOne,
 }: NotificationsListProps) {
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
    const selectMode = checkedIds.size > 0;

    const availableTypes = useMemo(
        () => [...new Set(notifications.map((n) => n.type))],
        [notifications]
    );

    const filtered = useMemo(() => {
        if (typeFilter === "all") return notifications;
        return notifications.filter((n) => n.type === typeFilter);
    }, [notifications, typeFilter]);
    const allSelected = filtered.length > 0 && filtered.every((n) => checkedIds.has(n.id));

    const toggleCheck = (id: string) => {
        setCheckedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        setCheckedIds((prev) => {
            if (allSelected) return new Set();
            return new Set(filtered.map((n) => n.id));
        });
    };

    const exitSelectMode = () => setCheckedIds(new Set());

    const handleDeleteSelected = () => {
        onDeleteMany([...checkedIds]);
        exitSelectMode();
    };
    return (
        <div className="flex flex-col h-full border-r bg-muted/50">
            <div className="shrink-0">
                <div className="p-2 h-14">
                    {selectMode ? (
                        <div className="h-full flex items-center gap-2 relative">
                            <Checkbox 
                                checked={allSelected} 
                                onCheckedChange={toggleSelectAll} 
                                className="rounded border-primary/50 size-5 [&>svg]:size-5 ml-2 z-1"
                            />
                            {!allSelected && <span className="absolute top-1/2 left-[13px] -translate-y-1/2 size-2.5 bg-primary"/>}
                            <Button
                                variant="destructive"
                                size="default"
                                className="h-8 text-xs ml-auto"
                                onClick={handleDeleteSelected}
                            >
                                <Trash2 className="size-3.5" />
                                Delete ({checkedIds.size})
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="shrink-0"
                                onClick={exitSelectMode}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                    ) : (
                    <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
                        <SelectTrigger className="w-full h-8 text-sm bg-card">
                            {typeFilter === "all" ? "All types" : typeLabels[typeFilter] ?? typeFilter}
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="all">All types</SelectItem>
                                {availableTypes.map((t) => (
                                    <SelectItem key={t} value={t}>{typeLabels[t] ?? t}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    )}
                </div>
                <ScrollArea className="h-[calc(100dvh-194px)] bg-card">
                    <div className="flex flex-col divide-y divide-primary/20">
                    {filtered.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-8 text-center">No notifications.</p>
                    ) : (
                        filtered.map((n) => {
                            const isPendingAction = n.actionRequired && n.actionStatus === "pending";
                            const isSelected = n.id === selectedId;
                            const isChecked = checkedIds.has(n.id);
                            return (
                                <div
                                    key={n.id}
                                    onClick={() => (selectMode ? toggleCheck(n.id) : onSelect(n))}
                                    className={cn(
                                        "flex items-start gap-2.5 p-3 text-left bg-card hover:bg-primary/20 transition-colors w-full select-none group relative pr-4",
                                        isSelected && "bg-primary/20",
                                        isSelected && !selectMode && "bg-primary/20",
                                        isChecked && "bg-card"
                                    )}
                                >
                                    <UserAvatar user={n.sender} size="sm" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={cn("text-sm truncate", !n.isRead && "font-semibold")}>
                                                {n.sender?.fullName ?? "Someone"}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: false })}
                                            </span>
                                        </div>
                                        <p className={cn("text-xs text-muted-foreground truncate", !n.isRead && "text-foreground")}>
                                            {n.description}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2 h-5">
                                            {!n.isRead && <span className="w-2 h-2 aspect-square rounded-full bg-primary shrink-0" />}
                                            {isPendingAction && (
                                                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                                    Action needed
                                                </Badge>
                                            )}
                                            <Button 
                                                variant={"outline"} size="icon-xs" 
                                                className="ml-auto rounded-sm hidden group-hover:flex hover:bg-red-200"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteOne(n.id);
                                                }}
                                            >
                                                <Trash2 className="size-3.5 text-red-500"/>
                                            </Button>
                                        </div>
                                    </div>
                                    <Checkbox
                                        checked={isChecked}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleCheck(n.id);
                                            }}
                                        className={cn("absolute bottom-4 left-4 rounded border-primary/50",
                                            selectMode ? "flex" : "hidden group-hover:flex"
                                        )}
                                    />
                                </div>
                            );
                        })
                    )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}