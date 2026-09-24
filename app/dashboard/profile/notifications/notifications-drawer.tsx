"use client"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-components/user-avatar";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { formatProjectId } from "@/lib/helper";
import type { Notification } from "@/lib/actions/notifications";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

const typeLabels: Record<string, string> = {
    project_join_request: "Join Request",
    project_join_approved: "Join Approved",
    project_join_rejected: "Join Rejected",
    task_assigned: "Task Assigned",
    task_status_changed: "Task Status",
    project_status_changed: "Project Status",
    general: "General",
};

interface NotificationDrawerProps {
    notification: Notification | null;
    onRespond: (id: string, approve: boolean) => void;
    onOpenProject: (projectId: string) => void;
    open: boolean;
    onOpenChange:(open: boolean) => void;
}

export function NotificationDrawer({ notification, onRespond, onOpenProject, open, onOpenChange }: NotificationDrawerProps) {
    if (!notification) return null;
    const isPendingAction = notification.actionRequired && notification.actionStatus === "pending";
    return (
        <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
            <DrawerContent className="max-h-[85vh]">
                <DrawerHeader>
                    <DrawerTitle>
                        {!isPendingAction && notification.actionRequired ? (
                            <Badge variant={notification.actionStatus === "approved" ? "default" : "destructive"} className="capitalize text-base p-4">
                            {notification.actionStatus}
                            </Badge>
                        ): (
                            <Badge variant="secondary" className="text-base p-4">
                            {typeLabels[notification.type] ?? notification.type}
                            </Badge>
                        )}
                        
                    </DrawerTitle>
                    {notification.projects && (
                        <DrawerDescription className="mt-2">
                            {formatProjectId(notification.projects.project_number)} · {notification.projects.contacts?.name}
                        </DrawerDescription>
                    )}
                </DrawerHeader>
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
                    <Separator />
                    {/* {!isPendingAction && notification.actionRequired && (
                        <Badge variant={notification.actionStatus === "approved" ? "default" : "destructive"} className="capitalize">
                            {notification.actionStatus}
                        </Badge>
                    )} */}
                    <p className="text-sm whitespace-pre-wrap flex-1">{notification.description}</p>
                </div>
                <Separator/>
                <DrawerFooter className="min-h-10 pt-4 bg-card">
                    {isPendingAction && (
                        <div className="flex flex-col gap-2">
                            <Button onClick={() => onRespond(notification.id, true)}>
                                Approve
                            </Button>
                            <Button variant="outline" onClick={() => onRespond(notification.id, false)}>
                                Reject
                            </Button>
                        </div>
                    )}
                    <DrawerClose render={<Button variant="outline">Close</Button>} />
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}