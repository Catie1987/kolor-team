"use client"
import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/user-components/user-avatar";
import { createProjectTask, ProjectTask, updateProjectTask } from "@/lib/actions/project-tasks";
import { toast } from "@/components/ui/toast";

interface DialogTaskProps {
    projectId: string;
    leaderId: string; 
    teamMembers: { id: string; fullName: string; email: string; imageUrl: string }[];
    task?: ProjectTask; // if provided, dialog operates in edit mode
    defaultStatus?: string; // only used in create mode
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: (task?: ProjectTask) => void;
}

export function DialogTask({ 
        projectId,
        leaderId,
        teamMembers,
        task,
        defaultStatus = "todo",
        open,
        onOpenChange,
        onSaved, 
    }: DialogTaskProps) {
    const isEditMode = !!task;
    const [detail, setDetail] = useState("");
    const [assigneeId, setAssigneeId] = useState<string>(leaderId);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setDetail(task?.detail ?? "");
            setAssigneeId(task?.assigneeId ?? leaderId);
        }
    }, [open, task, leaderId]);

    const assignee = teamMembers.find((m) => m.id === assigneeId);

    const handleSave = async () => {
        if (!detail.trim()) return;
        setSaving(true);
        try {
            let saved: ProjectTask;
            if (isEditMode) {
                saved = await updateProjectTask(task.id, {
                    detail: detail.trim(),
                    assigneeId,
                    status: task.status,
                });
            } else {
                saved = await createProjectTask({
                    projectId,
                    detail: detail.trim(),
                    assigneeId,
                    status: defaultStatus as any,
                });
            }
            onOpenChange(false);
            onSaved(saved);
            toast.add({
                type: "success",
                title: "Success",
                description: `${isEditMode ? "Your task has been updated" : "New task has been added"}.`,
            });
        } catch (err) {
            toast.add({
                type: "error",
                title: "Error",
                description: err instanceof Error ? err.message : "Could not save task.",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Task</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor="detail">Task detail</Label>
                        <Textarea
                            id="detail"
                            value={detail}
                            onChange={(e) => setDetail(e.target.value)}
                            placeholder="What needs to be done?"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Assignee</Label>
                        <Select value={assigneeId} onValueChange={(v) => v && setAssigneeId(v)}>
                            <SelectTrigger className="w-full">
                                {assignee?.fullName ?? "Select assignee"}
                            </SelectTrigger>
                            <SelectContent alignItemWithTrigger={false}>
                                <SelectGroup>
                                    {teamMembers.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            <div className="flex items-center gap-2">
                                                <UserAvatar user={m} size="sm" showName={false} />
                                                {m.fullName}
                                                {m.id === leaderId && (
                                                    <span className="text-xs text-muted-foreground">(Leader)</span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose render={<Button variant="outline">Cancel</Button>} />
                    <Button onClick={handleSave} disabled={saving || !detail.trim()}>
                        {saving ? "Saving..." : isEditMode ? "Save changes" : "Add Task"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}