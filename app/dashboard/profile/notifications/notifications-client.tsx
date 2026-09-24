"use client"
import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { getMyNotifications, respondToJoinRequest, markNotificationRead, type Notification, deleteNotifications, markAllNotificationsRead } from "@/lib/actions/notifications";
import { useLoadingRouter } from "@/hooks/use-loading-router";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import { getCurrentSupabaseUserId } from "@/lib/actions/users";
import { useNotificationRealtime } from "@/hooks/use-notification-realtime";
import { NotificationsList } from "./notifications-list";
import { NotificationDetail } from "./notifications-detail";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCompact } from "@/hooks/use-compact";
import { NotificationDrawer } from "./notifications-drawer";


export function NotificationsClient() {
    const containerRef = useRef<HTMLDivElement>(null);
    const isCompact = useCompact(containerRef);
    const router = useLoadingRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = () => {
        setLoading(true);
        getMyNotifications()
            .then((data) => {
                setNotifications(data);
                // Auto-select the first one on initial load, email-client style
                if (data.length > 0 && !selectedId) {
                    setSelectedId(data[0].id);
                }
            })
            .finally(() => setLoading(false));
    };

    const sorted = useMemo(() => {
        return [...notifications].sort((a, b) => {
            const aPending = a.actionRequired && a.actionStatus === "pending";
            const bPending = b.actionRequired && b.actionStatus === "pending";
            if (aPending !== bPending) return aPending ? -1 : 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }, [notifications]);

    const unreadCount = useMemo(
        () => notifications.filter((n) => !n.isRead).length,
        [notifications]
    );

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            toast.add({ type: "success", title: "Done", description: "All notifications marked as read." });
        } catch {
            toast.add({ type: "error", title: "Error", description: "Could not mark notifications as read." });
        }
    };

    const selectedNotification = sorted.find((n) => n.id === selectedId) ?? null;

    const handleSelect = (n: Notification) => {
        setSelectedId(n.id);
        if (!n.isRead) {
            markNotificationRead(n.id);
            setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
        }
        if (isCompact) setDrawerOpen(true);
    };

    const handleRespond = async (id: string, approve: boolean) => {
        try {
            await respondToJoinRequest(id, approve);
            toast.add({ type: "success", title: approve ? "Approved" : "Rejected", description: "Your response has been recorded." });
            fetchNotifications();
        } catch (err) {
            toast.add({ type: "error", title: "Error", description: err instanceof Error ? err.message : "Could not respond." });
        }
    };

    const handleOpenProject = (projectId: string) => {
        router.push(`/dashboard/project-management/${projectId}`);
    };
    
    const handleDeleteOne = async (id: string) => {
    try {
        await deleteNotifications([id]);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (selectedId === id) setSelectedId(null);
        toast.add({ type: "info", title: "Notification delete", description: "Notification has been success removed from database" });
    } catch {
        toast.add({ type: "error", title: "Error", description: "Could not delete notification." });
    }
};

const handleDeleteMany = async (ids: string[]) => {
    try {
        await deleteNotifications(ids);
        setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
        if (selectedId && ids.includes(selectedId)) setSelectedId(null);
        toast.add({ type: "info", title: "All delete", description: "All notifications has been success removed from database" });
    } catch {
        toast.add({ type: "error", title: "Error", description: "Could not delete notifications." });
    }
};
    
    return(
        <div ref={containerRef} className="flex flex-1 flex-col">
            <div className="flex items-center justify-between">
                <Button variant={"outline"} className="gap-1 group hover:cursor-pointer border-none w-fit" onClick={() => router.back()}>
                    <ChevronLeft className="w-4 h-4 aspect-square group-hover:-translate-x-1 transform transition"/>
                    <p className="text-sm">Back</p>
                </Button>
                {!isCompact && (
                <h1 className="text-primary select-none font-medium">
                    Notifications Center
                </h1>)}
                <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="link">Recent ({unreadCount})</Button>}/>
                    <DropdownMenuContent>
                        <DropdownMenuGroup>
                        <DropdownMenuLabel>My Notifications</DropdownMenuLabel>
                        <DropdownMenuItem
                            disabled={unreadCount === 0}
                            onClick={handleMarkAllRead}
                        >
                            Mark all read
                        </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            {loading ? (
                <div className="border flex items-center justify-center flex-1 rounded-lg shadow-sm overflow-hidden min-h-120 mt-2 bg-card">
                    <p className="text-sm text-muted-foreground text-center animate-pulse">Loading...</p>
                </div>
            ) : (
            <div className="border flex flex-1 rounded-lg shadow-sm overflow-hidden min-h-120 mt-2 bg-card">
                <div className={cn("w-full max-w-xs shrink-0",
                    isCompact && "max-w-full"
                )}>
                    <NotificationsList
                        notifications={sorted}
                        selectedId={isCompact ? null : selectedId}
                        onSelect={handleSelect}
                        onDeleteMany={handleDeleteMany}
                        onDeleteOne={handleDeleteOne}
                    />
                </div>
                {!isCompact && (
                <NotificationDetail
                    notification={selectedNotification}
                    onRespond={handleRespond}
                    onOpenProject={handleOpenProject}
                />
                )}
            </div>
            )}
            {isCompact && (
                <NotificationDrawer
                    notification={selectedNotification}
                    onRespond={handleRespond}
                    onOpenProject={handleOpenProject}
                    open={drawerOpen}
                    onOpenChange={setDrawerOpen}
                />
            )}
        </div>
    )
}