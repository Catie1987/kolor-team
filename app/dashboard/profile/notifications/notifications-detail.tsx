"use client"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-components/user-avatar";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { formatProjectId } from "@/lib/helper";
import type { Notification } from "@/lib/actions/notifications";

const typeLabels: Record<string, string> = {
    project_join_request: "Join Request",
    project_join_approved: "Join Approved",
    project_join_rejected: "Join Rejected",
    task_assigned: "Task Assigned",
    task_status_changed: "Task Status",
    project_status_changed: "Project Status",
    general: "General",
};

interface NotificationDetailProps {
    notification: Notification | null;
    onRespond: (id: string, approve: boolean) => void;
    onOpenProject: (projectId: string) => void;
}

export function NotificationDetail({ notification, onRespond, onOpenProject }: NotificationDetailProps) {
    if (!notification) {
        return (
            <div className="flex-1 flex items-center justify-center h-full min-h-20">
                <p className="text-sm text-muted-foreground">Select a notification to view details</p>
            </div>
        );
    }
    const isPendingAction = notification.actionRequired && notification.actionStatus === "pending";
    return (
        <div className="flex flex-col h-full p-6 gap-4 w-full">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <UserAvatar user={notification.sender} size="lg" />
                    <div>
                        <p className="text-base font-semibold">{notification.sender?.fullName ?? "Someone"}</p>
                        <p className="text-xs text-muted-foreground">{notification.sender?.email}</p>
                    </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(notification.created_at), "dd-MMM-yyyy HH:mm")}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                    {typeLabels[notification.type] ?? notification.type}
                </Badge>
                {notification.projects && (
                    <Badge
                        variant="outline"
                        className="font-mono text-xs cursor-pointer hover:bg-accent"
                        onClick={() => onOpenProject(notification.relatedProjectId!)}
                    >
                        {formatProjectId(notification.projects.project_number)} · {notification.projects.contacts?.name}
                    </Badge>
                )}
            </div>

            <Separator />

            <p className="text-sm whitespace-pre-wrap flex-1">{notification.description}</p>

            {isPendingAction && (
                <>
                    <Separator />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onRespond(notification.id, false)}>
                            Reject
                        </Button>
                        <Button onClick={() => onRespond(notification.id, true)}>
                            Approve
                        </Button>
                    </div>
                </>
            )}

            {!isPendingAction && notification.actionRequired && (
                <>
                    <Separator />
                    <div className="flex justify-end">
                        <Badge variant={notification.actionStatus === "approved" ? "default" : "destructive"}>
                            {notification.actionStatus}
                        </Badge>
                    </div>
                </>
            )}
        </div>
    )
}