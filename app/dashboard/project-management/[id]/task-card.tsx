"use client"
import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UserAvatar } from "@/components/user-components/user-avatar";
import { Trash2, Calendar, Pencil, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateProjectTask, type ProjectTask } from "@/lib/actions/project-tasks";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface TaskCardProps {
    task: ProjectTask;
    onDelete: (id: string) => void;
    onEdit: (task: ProjectTask) => void;
    isOverlay?: boolean;
    canManage: boolean;
}

function TaskCard({ task, onDelete, onEdit, isOverlay, canManage }: TaskCardProps) {
    const [mouseIsOver, setMouseIsOver] = useState(false);

    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: { type: "Task", task },
        disabled: isOverlay || !canManage,
    });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    // Ghost placeholder while this card is being dragged
    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="p-3 min-h-32 h-32 rounded-sm border-2 border-dashed border-primary/40 bg-primary/5"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...(canManage ? attributes : {})}
            {...(canManage ? listeners : {})}
            onMouseEnter={() => setMouseIsOver(true)}
            onMouseLeave={() => setMouseIsOver(false)}
            className={cn(
                "bg-card p-2 rounded-sm border shadow-sm relative transition-shadow",
                canManage ? "cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-inset hover:ring-primary/50" : "cursor-default",
                isOverlay && "shadow-lg rotate-2 cursor-grabbing",
                "h-32 min-h-32"
            )}
        >
            {/* <p className="text-sm whitespace-pre-wrap pr-6">{detail}</p> */}
            <ScrollArea className="h-20 text-sm pr-2 pb-1 border-b select-none">
                <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="size-3.5"/>
                    <p className="text-xs">
                        {format(task.created_at, "dd-MMM-yyyy")}
                    </p>
                </div>
                <span>{task.detail}</span>
            </ScrollArea>
            <div className="py-1 flex items-start justify-between">
                <div className="flex items-center my-auto">
                    <UserAvatar user={task.assignee} size="sm" />
                </div>
                {canManage && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon-sm" className="rounded-sm" disabled={!mouseIsOver}
                        onClick={(e) => {
                                e.stopPropagation();
                                onEdit(task);
                            }}>
                            <Pencil/>
                        </Button>
                        <Button disabled={!mouseIsOver}
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(task.id);
                            }}
                            variant="outline"
                            size="icon-sm"
                            className="rounded-sm"
                        >
                            <Trash2 className="size-4 text-red-500" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

export { TaskCard };