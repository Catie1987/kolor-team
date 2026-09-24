"use client"
import { useState, useEffect, useMemo } from "react";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners, type DragStartEvent, type DragEndEvent, type DragOverEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { UserAvatar } from "@/components/user-avatar";
// import { GroupAvatar } from "@/components/group-avatar";
import { ChevronLeft, Pencil, Plus, Trash2, Triangle, TriangleAlert, TriangleDashed } from "lucide-react";
import {
    getProjectTasks,
    updateTaskStatus,
    deleteProjectTask,
    type ProjectTask,
    reorderProjectTasks,
} from "@/lib/actions/project-tasks";
// import { DialogTask } from "./dialog-task";
import type { Project } from "@/lib/actions/projects";
import { formatProjectId } from "@/lib/helper";
import { GroupAvatar } from "@/components/user-components/group-avatar";
import { useLoadingRouter } from "@/hooks/use-loading-router";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-components/user-avatar";
import { DialogTask } from "../dialog-task";
import { toast } from "@/components/ui/toast";
import { TaskCard } from "./task-card";
import { format } from "date-fns";

interface TeamMemberOption {
    id: string; // Supabase users.id — this is what assignee_id needs
    fullName: string;
    email: string;
    imageUrl: string;
}


interface ProjectKanbanProps {
    project: Project;
    currentUserId: string; // Supabase users.id
    isAdmin: boolean;
}

const columns = [
    { id: "todo", label: "To Do", color: "bg-muted-foreground" },
    { id: "in_progress", label: "In Progress", color: "bg-yellow-500" },
    { id: "done", label: "Done", color: "bg-green-500" },
] as const;

const priorityConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
    high: { label: "High", icon: TriangleAlert, className: "text-red-600 bg-red-50 border-red-200" },
    medium: { label: "Medium", icon: Triangle, className: "text-orange-600 bg-orange-50 border-orange-200 " },
    low: { label: "Low", icon: TriangleDashed, className: "text-muted-foreground bg-card border-border" },
};

export function ProjectKanban({ project , currentUserId, isAdmin }: ProjectKanbanProps) {
    const router = useLoadingRouter();
    const [tasks, setTasks] = useState<ProjectTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTask, setEditingTask] = useState<ProjectTask | undefined>(undefined);
    const [activeTask, setActiveTask] = useState<ProjectTask | null>(null);
    const [taskDialogOpen, setTaskDialogOpen] = useState(false);
    const [defaultStatus, setDefaultStatus] = useState<string>("todo");

    const isLeader = project.leaderId === currentUserId;
    const isParticipant = project.participantIds.includes(currentUserId);
    const canManageAnyTask = isAdmin || isLeader; // full control over every task
    const canCreateTasks = isAdmin || isLeader || isParticipant; 

    
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const handleTaskSaved = (task?: ProjectTask) => {
        fetchTasks(); // simplest: refetch to get accurate state (order, new task, etc.)
    };

    const openAddTask = (status: string) => {
        setEditingTask(undefined);
        setDefaultStatus(status);
        setTaskDialogOpen(true);
    };

    const openEditTask = (task: ProjectTask) => {
        setEditingTask(task);
        setTaskDialogOpen(true);
    };

    const teamMembers: TeamMemberOption[] = useMemo(() => {
        const members: TeamMemberOption[] = [];
        if (project.leader) {
            members.push({
                id: project.leaderId, // Supabase UUID
                fullName: project.leader.fullName,
                email: project.leader.email,
                imageUrl: project.leader.imageUrl,
            });
        }
        project.participants?.forEach((p, i) => {
            members.push({
                id: project.participantIds[i], // Supabase UUID, matched by index
                fullName: p.fullName,
                email: p.email,
                imageUrl: p.imageUrl,
            });
        });
        return members;
    }, [project]);

    useEffect(() => {
        fetchTasks();
    }, [project.id]);

    const fetchTasks = () => {
        setLoading(true);
        getProjectTasks(project.id)
            .then(setTasks)
            .finally(() => setLoading(false));
    };

    const tasksByStatus = useMemo(() => {
        const grouped: Record<string, ProjectTask[]> = { todo: [], in_progress: [], done: [] };
        for (const task of tasks) {
            grouped[task.status]?.push(task);
        }
        return grouped;
    }, [tasks]);

    const canMoveTask = (task: ProjectTask) => canManageAnyTask || task.assigneeId === currentUserId;

    const handleDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.type === "Task") {
            const task = event.active.data.current.task as ProjectTask;
            if (!canMoveTask(task)) return; // block the drag entirely
            setActiveTask(task);
        }
    };

const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === "Task";
    if (!isActiveATask) return;

    const activeTaskData = active.data.current?.task as ProjectTask;
    if (!canMoveTask(activeTaskData)) return; 

    const isOverATask = over.data.current?.type === "Task";
    const isOverAColumn = over.data.current?.type === "Column";

    // Dropping a task over another task — live reorder + possibly change status
    if (isActiveATask && isOverATask) {
        setTasks((tasks) => {
            const activeIndex = tasks.findIndex((t) => t.id === activeId);
            const overIndex = tasks.findIndex((t) => t.id === overId);
            if (activeIndex === -1 || overIndex === -1) return tasks;

            if (tasks[activeIndex].status !== tasks[overIndex].status) {
                tasks[activeIndex] = { ...tasks[activeIndex], status: tasks[overIndex].status };
            }

            return arrayMove(tasks, activeIndex, overIndex);
        });
    }

    // Dropping a task over an empty column area — move to end of that column
    if (isActiveATask && isOverAColumn) {
        setTasks((tasks) => {
            const activeIndex = tasks.findIndex((t) => t.id === activeId);
            if (activeIndex === -1) return tasks;
            if (tasks[activeIndex].status === overId) return tasks; // already there

            tasks[activeIndex] = { ...tasks[activeIndex], status: overId as any };
            return arrayMove(tasks, activeIndex, activeIndex); // triggers re-render, position unchanged
        });
    }
};

const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !canMoveTask(task)) return;

    // By this point, onDragOver has already updated `tasks` locally (status + order).
    // Now just persist: the task's final status, and the sort order of its column.
    const columnTasks = tasks.filter((t) => t.status === task.status);

    try {
        await updateTaskStatus(taskId, task.status);
        await reorderProjectTasks(columnTasks.map((t) => t.id));
    } catch (err) {
        fetchTasks(); // simplest reliable revert — refetch true state from server
        toast.add({ type: "error", title: "Error found", description: "Could not move task, please try again." });
    }
};

    const handleDelete = async (id: string) => {
        try {
            await deleteProjectTask(id);
            setTasks((prev) => prev.filter((t) => t.id !== id));
            // toast.success("Task deleted.");
        } catch {
            // toast.error("Could not delete task.");
        }
    };

    // const handleTaskUpdated = (id: string, newDetail: string) => {
    //     setTasks((prev) =>
    //         prev.map((t) => (t.id === id ? { ...t, detail: newDetail } : t))
    //     );
    // };

    const priority = priorityConfig[project.priority];
    const IconPriority = priority.icon;

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex @xl/main:flex-row flex-col gap-x-2 min-h-10 relative">
                <Button variant={"outline"} className="gap-1 group hover:cursor-pointer border-none w-fit" onClick={() => router.back()}>
                    <ChevronLeft className="w-4 h-4 aspect-square group-hover:-translate-x-1 transform transition"/>
                    <p className="text-sm">Back</p>
                </Button>
                <div className="w-full p-1 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-4">
                        <h1 className="font-semibold flex items-center gap-2 text-primary">
                            {project.contacts?.name}
                        </h1>
                        <div className="absolute top-1 right-2 flex items-center gap-2">
                            <Button size="icon-sm" variant="outline" className="rounded-sm">
                                <Pencil className="size-4"/>
                            </Button>
                            <Button size="icon-sm" variant="outline" className="rounded-sm">
                                <Trash2 className="size-4 text-red-500"/>
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Badge variant="outline" className="font-mono text-xs">
                            {formatProjectId(project.projectNumber)}
                        </Badge>
                        <span className="text-xs font-medium">• {project.contacts?.short_name}</span>
                        <p className="text-xs italic ml-auto @xl/main:translate-y-2">
                            <span className="text-muted-foreground">Date started: </span>{format(project.startedAt as string, "dd-MMM-yyy")}
                        </p>
                    </div>
                    <Separator className="my-1"/>
                    <div className="flex flex-col gap-1">
                        <div className="flex gap-2">
                            <GroupAvatar users={teamMembers} size="lg" max={3}/>
                            <div className="text-xs flex flex-col my-auto">
                                <p className="text-muted-foreground">Team Members:</p>
                                <span className="text-sm">{project.leader?.fullName} and {teamMembers.length - 1} Other</span>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {project.description}
                        </p>
                        <div className="flex items-center justify-between">
                            <p className="text-xs italic">
                                <span className="text-muted-foreground">Latest updated: </span>{format(project.updated_at as string, "dd-MMM-yyy")}
                            </p>
                            <div className="flex items-center gap-2">
                                <p className="text-sm @xl/main:block hidden">Priority:</p>
                                <Badge variant="outline" className={cn(priority.className, "")}>
                                    <IconPriority className="h-3 w-3 aspect-square"/>
                                    {priority.label}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>


                {/* <GroupAvatar users={teamMembers} max={5} size="sm" /> */}
            </div>
            {loading ? (
                <p className="text-sm text-muted-foreground p-8 text-center animate-pulse">Loading tasks...</p>
            ): (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                >
                    <div className="grid grid-cols-1 @2xl/main:grid-cols-3 gap-4 flex-1 min-h-96">
                        {columns.map((col) => (
                            <KanbanColumn
                                key={col.id}
                                id={col.id}
                                label={col.label}
                                color={col.color}
                                tasks={tasksByStatus[col.id]}
                                onAddTask={canCreateTasks ? () => openAddTask(col.id) : undefined}
                                onEdit={openEditTask}
                                onDelete={handleDelete}
                                currentUserId={currentUserId}
                                canManageAnyTask={canManageAnyTask}
                            />
                        ))}
                    </div>
                    <DragOverlay>
                        {activeTask && (
                            <TaskCard task={activeTask} onDelete={() => {}} onEdit={() => {}} isOverlay canManage={canManageAnyTask}/>
                        )}
                    </DragOverlay>
                </DndContext>
            )}
            <DialogTask
                projectId={project.id}
                leaderId={project.leaderId}
                teamMembers={teamMembers}
                task={editingTask}
                defaultStatus={defaultStatus}
                open={taskDialogOpen}
                onOpenChange={(open) => {
                    setTaskDialogOpen(open);
                    if (!open) setEditingTask(undefined);
                }}
                onSaved={handleTaskSaved}
            />
        </div>
    )
}

function KanbanColumn({
    id, label, color, tasks, onAddTask, onDelete, onEdit, currentUserId, canManageAnyTask,
}: {
    id: string;
    label: string;
    color: string;
    tasks: ProjectTask[];
    onAddTask?: () => void;
    onDelete: (id: string) => void;
    onEdit: (task: ProjectTask) => void;
    currentUserId: string;
    canManageAnyTask: boolean;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id,
        data: { type: "Column" },
    });

    return (
        <div
            className={cn(
                "flex flex-col rounded-lg h-auto max-h-120 @2xl/main:h-120 transition-colors border bg-muted/50 shadow-sm overflow-hidden",
                isOver && "ring-2 ring-primary"
            )}
        >
            <div className="flex items-center justify-between py-2 px-3 border-b bg-muted shrink-0">
                <div className="flex items-center gap-2">
                    <div className={cn("h-1.5 w-1.5 aspect-square rounded-full", color)} />
                    <span className="text-sm font-medium">{label}</span>
                    <div className="text-sm text-mono">{tasks.length}</div>
                </div>
                
                <Button variant="default" size="icon" className="size-6 rounded-sm" onClick={onAddTask} disabled={!onAddTask}>
                    <Plus className="size-4" />
                </Button>
            </div>

            <SortableContext items={tasks.map((t) => t.id)}>
                <div ref={setNodeRef} className="flex flex-grow flex-col gap-2 p-2 overflow-x-hidden overflow-y-auto">
                    {tasks.map((task) => {
                        const canManageThisTask = canManageAnyTask || task.assigneeId === currentUserId;
                        return(
                            <TaskCard key={task.id} task={task} onDelete={onDelete} onEdit={onEdit} canManage={canManageThisTask}/>
                        )
                    })}
                </div>
            </SortableContext>
        </div>
    )
}

