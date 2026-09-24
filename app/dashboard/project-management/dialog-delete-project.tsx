"use client"

import { useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteProject, type Project } from "@/lib/actions/projects";
import { formatProjectId } from "@/lib/helper";
import { UserHoverCard } from "@/components/user-components/user-hover-card";
import { format } from "date-fns";
import { toast } from "@/components/ui/toast";

interface DialogDeleteProjectProps {
    project: Project | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDeleted: () => void;
}

export function DialogDeleteProject({ project, open, onOpenChange, onDeleted }: DialogDeleteProjectProps) {
    const [deleting, setDeleting] = useState(false);

    if (!project) return null;

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteProject(project.id);
            onOpenChange(false);
            toast.add({
                type: "warning",
                title: "Deleted",
                description: "Project has been removed permanently from database",
            });
            onDeleted();
        } catch (err) {
            // toast.error(err instanceof Error ? err.message : "Could not delete project.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete project ID {formatProjectId(project.projectNumber)} ?</AlertDialogTitle>
                    <div className="text-sm font-normal text-muted-foreground flex flex-col gap-2">
                        <p>This action cannot be undone. This will permanently delete{" "}
                            <span className="font-medium text-foreground">
                                {project.contacts?.name ?? "this project"}
                            </span>{" "}
                            and all its associated tasks.
                        </p>
                        <p>
                            This project was created by 
                            <UserHoverCard className="text-sm mr-2" creator={project.leader}/>
                            from 
                            <span className="text-foreground ml-2">
                                {project.startedAt && format(project.startedAt, "dd-MMM-yyyy")}
                            </span>
                        </p>
                    </div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {deleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}