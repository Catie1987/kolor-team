// components/task-comments.tsx
"use client"
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-components/user-avatar";
import { Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import {
    getTaskComments, createTaskComment, deleteTaskComment, type TaskComment,
} from "@/lib/actions/task-comments";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useUser } from "@clerk/nextjs";
import { toast } from "@/components/ui/toast";

interface TaskCommentsProps {
    taskId: string;
    currentUserId: string; // Supabase users.id
}

export function TaskComments({ taskId, currentUserId }: TaskCommentsProps) {
    const { user } = useUser();
    const isAdmin = (user?.publicMetadata as any)?.role === "admin";
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const fetchComments = () => {
        getTaskComments(taskId).then(setComments);
    };

    useEffect(() => {
        setLoading(true);
        getTaskComments(taskId)
            .then(setComments)
            .finally(() => setLoading(false));
    }, [taskId]);

    // Realtime: refetch whenever any comment on this task changes
    useEffect(() => {
        const channel = supabaseBrowser
            .channel(`task-comments-${taskId}`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "task_comments", filter: `task_id=eq.${taskId}` },
                () => fetchComments()
            )
            .subscribe();

        return () => {
            supabaseBrowser.removeChannel(channel);
        };
    }, [taskId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [comments.length]);

    const handleSend = async () => {
        if (!newComment.trim()) return;
        setSending(true);
        try {
            await createTaskComment({ taskId, content: newComment.trim() });
            setNewComment("");
            // Realtime will refetch automatically; optionally fetch immediately for snappier feel
            fetchComments();
        } catch (err) {
            toast.add({ type: "error", title: "Error", description: err instanceof Error ? err.message : "Could not post comment." });
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteTaskComment(id);
            setComments((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
            toast.add({ type: "error", title: "Error", description: err instanceof Error ? err.message : "Could not delete comment." });
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
                {loading ? (
                    <p className="text-xs text-muted-foreground text-center py-4 animate-pulse">Loading comments...</p>
                ) : comments.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No comments yet.</p>
                ) : (
                    comments.map((c) => {
                        const canDelete = isAdmin || c.userId === currentUserId;
                        return (
                            <div key={c.id} className="flex items-start gap-2 group">
                                <UserAvatar user={c.author} size="sm" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium">{c.author?.fullName ?? "Someone"}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap wrap-break-word">{c.content}</p>
                                </div>
                                {canDelete && (
                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
                                        onClick={() => handleDelete(c.id)}
                                    >
                                        <Trash2 className="size-3.5" />
                                    </Button>
                                )}
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            <div className="flex gap-2 items-end border-t pt-3">
                <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="text-sm min-h-9 resize-none"
                    rows={1}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
                <Button size="sm" onClick={handleSend} disabled={sending || !newComment.trim()}>
                    Send
                </Button>
            </div>
        </div>
    )
}