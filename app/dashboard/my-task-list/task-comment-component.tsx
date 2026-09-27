"use client"
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Trash2, XIcon, Send } from 'lucide-react';
import { UserHoverCard } from '@/components/user-components/user-hover-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProjectTask } from '@/lib/actions/project-tasks';
import { format, formatDistanceToNow } from 'date-fns';
import { createTaskComment, deleteTaskComment, getTaskComments, TaskComment } from '@/lib/actions/task-comments';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { toast } from '@/components/ui/toast';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';


interface TaskCommentComponentProps{
    open: boolean;
    setOpen: (open: boolean)=>void;
    currentUserId: string;
    task: ProjectTask;
    onCommentCountChange?: (taskId: string, count: number) => void;
}


export function TaskCommentComponent({
    open,
    setOpen,
    currentUserId,
    task,
    onCommentCountChange,
}: TaskCommentComponentProps) {
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    
    const initials = task.assignee?.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "";
    const taskId = task.id

    const fetchComments = () => {
        getTaskComments(taskId).then((data) => {
            setComments(data);
            onCommentCountChange?.(taskId, data.length); // report the fresh count upward
        });
    };

    useEffect(() => {
        setLoading(true);
        getTaskComments(taskId)
            .then((data) => {
                setComments(data);
                onCommentCountChange?.(taskId, data.length);
            })
            .finally(() => setLoading(false));
    }, [taskId]);

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
    }, [task.id]);

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
            setComments((prev) => {
                const next = prev.filter((c) => c.id !== id);
                onCommentCountChange?.(taskId, next.length); // report decrement too
                return next;
            });
        } catch (err) {
            toast.add({ type: "error", title: "Error", description: err instanceof Error ? err.message : "Could not delete comment." });
        }
    };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent 
            side="right"
            showCloseButton={false}
            className="w-full! max-w-full! overflow-hidden bg-transparent sm:p-3 shadow-none sm:w-96! sm:max-w-96! border-none"
        >
            <div className="flex h-full bg-background min-h-0 w-full flex-col overflow-hidden border sm:rounded-2xl">
                <header className="flex h-19 shrink-0 items-center justify-between px-6">
                    <SheetTitle className="text-xl">Task Detail</SheetTitle>
                    <SheetClose render={
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-lg"
                            aria-label="Close staff details"
                            className="[&_svg]:size-5!"
                        >
                            <XIcon />
                        </Button>
                    }/>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto px-2 py-4 no-scrollbar">
                    <SheetDescription className="sr-only">
                        Details for {task.id ?? "task id"}
                    </SheetDescription>
                    <div className="flex flex-col gap-4">
                        <section className="flex flex-col border bg-card rounded-lg p-2">
                            <div className='flex items-center gap-2'>
                                <Avatar className="size-8 shrink-0">
                                    <AvatarImage src={task.assignee?.imageUrl} alt={task.assignee?.fullName} className='' />
                                    <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                                <div className='flex flex-col items-start'>
                                    <UserHoverCard creator={task.assignee}/>
                                    <span className='text-xs text-muted-foreground -translate-y-2 ml-1'>
                                        {formatDistanceToNow(task.created_at, {addSuffix: true})}
                                    </span>
                                </div>
                            </div>
                            <div className='px-1'>
                                {task.detail}
                            </div>
                            <span className='italic text-xs ml-auto text-muted-foreground mt-2'>latest updated {format(task.updated_at, "MMM dd, yyyy")}</span>
                        </section>
                        <section className='flex flex-col p-2 gap-2'>
                            <p className='text-primary'>Comments ({comments.length})</p>
                            <Separator className="mb-1"/>
                            {loading ? (
                                <p className="text-xs text-muted-foreground text-center py-3 animate-pulse">Loading comments...</p>
                                ) : comments.length === 0 ? (
                                    <span className='text-muted-foreground text-xs py-3'>
                                        Currently no comment on this task yet, be the first!
                                    </span>
                                ) : (
                                    comments.map((c) => {
                                        const canDelete = c.userId === currentUserId;
                                        return(
                                            <div key={c.id} className='flex gap-2'>
                                                <Avatar className="size-6 shrink-0 mt-1">
                                                    <AvatarImage src={c.author?.imageUrl} alt={c.author?.fullName} className='' />
                                                    <AvatarFallback>K</AvatarFallback>
                                                </Avatar>
                                                <div className='border rounded-md bg-card flex-1 min-w-0 min-h-12 p-2 relative group hover:border-primary/80 duration-200 hover:shadow-sm transition-all'>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-medium">{c.author?.fullName ?? "Someone"}</span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm whitespace-pre-wrap wrap-break-word mt-1">{c.content}</p>
                                                    {canDelete && 
                                                        <Button variant="ghost" size="icon-sm" 
                                                        className="text-destructive/70 hover:text-destructive opacity-0 group-hover:opacity-100 absolute right-2 top-2"
                                                        onClick={() => handleDelete(c.id)}>
                                                            <Trash2/>
                                                        </Button>
                                                    }
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                                <div ref={bottomRef} />
                        </section>

                        
                    </div>
                </div>
                <footer className="p-4 flex flex-col gap-3">
                    <div className='flex flex-row gap-2 items-end'>
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
                        <Button size="icon-lg" onClick={handleSend} disabled={sending || !newComment.trim()}>
                            <Send/>
                        </Button>
                    </div>
                </footer>
            </div>
        </SheetContent>
    </Sheet>
  )
}
