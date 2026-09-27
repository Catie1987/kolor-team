"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { taskCommentSchema, type TaskCommentInput } from "@/lib/schemas/task-comment";
import { enrichWithClerkUser } from "../clerk/clerk-user-cache";
import { createNotificationInternal } from "./notifications";// per the earlier non-"use server" split

export interface TaskComment {
    id: string;
    taskId: string;
    userId: string;
    content: string;
    created_at: string;
    updated_at: string;
    author?: { id: string; fullName: string; email: string; imageUrl: string };
}

function mapComment(row: any): TaskComment {
    return {
        id: row.id,
        taskId: row.task_id,
        userId: row.user_id,
        content: row.content,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

async function getSupabaseUserId(clerkUserId: string): Promise<string> {
    const { data, error } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("clerk_user_id", clerkUserId)
        .single();
    if (error || !data) throw new Error("User not found in Supabase — try reloading the dashboard first");
    return data.id;
}

export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const { data, error } = await supabaseAdmin
        .from("task_comments")
        .select("*, users!user_id(clerk_user_id)")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    const rows = (data ?? []).map((row) => ({
        ...mapComment(row),
        clerk_user_id: row.users?.clerk_user_id,
    }));

    return enrichWithClerkUser(rows, "clerk_user_id", "author") as Promise<TaskComment[]>;
}

export async function createTaskComment(input: TaskCommentInput): Promise<TaskComment> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const parsed = taskCommentSchema.safeParse(input);
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        throw new Error(`${issue?.path.join(".")}: ${issue?.message}`);
    }
    const data = parsed.data;

    const myId = await getSupabaseUserId(clerkUserId);

    const { data: saved, error } = await supabaseAdmin
        .from("task_comments")
        .insert({
            task_id: data.taskId,
            user_id: myId,
            content: data.content,
        })
        .select("*, users!user_id(clerk_user_id)")
        .single();

    if (error) throw new Error(error.message);

    // Notify everyone relevant to the task: assignee + project leader + other commenters,
    // excluding whoever just posted the comment
    const { data: task } = await supabaseAdmin
        .from("project_tasks")
        .select("assignee_id, detail, project_id, projects(leader_id)")
        .eq("id", data.taskId)
        .single();

    if (task) {
        const { data: otherComments } = await supabaseAdmin
            .from("task_comments")
            .select("user_id")
            .eq("task_id", data.taskId);

        const recipientIds = new Set<string>();
        if (task.assignee_id) recipientIds.add(task.assignee_id);
        const leaderId = (task.projects as any)?.leader_id;
        if (leaderId) recipientIds.add(leaderId);
        for (const c of otherComments ?? []) {
            if (c.user_id) recipientIds.add(c.user_id);
        }
        recipientIds.delete(myId); // don't notify yourself

        for (const receiverId of recipientIds) {
            await createNotificationInternal({
                type: "general",
                description: `commented on task "${task.detail}": "${data.content.slice(0, 80)}${data.content.length > 80 ? "..." : ""}"`,
                senderId: myId,
                receiverId,
                relatedProjectId: task.project_id,
                actionRequired: false,
            });
        }
    }

    const mapped = { ...mapComment(saved), clerk_user_id: saved.users?.clerk_user_id };
    const [enriched] = await enrichWithClerkUser([mapped], "clerk_user_id", "author");
    return enriched as TaskComment;
}

export async function deleteTaskComment(id: string) {
    const { userId: clerkUserId, sessionClaims } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const isAdmin = (sessionClaims?.metadata as any)?.role === "admin";
    const myId = await getSupabaseUserId(clerkUserId);

    if (!isAdmin) {
        const { data: comment } = await supabaseAdmin
            .from("task_comments")
            .select("user_id")
            .eq("id", id)
            .single();
        if (!comment || comment.user_id !== myId) {
            throw new Error("You can only delete your own comments.");
        }
    }

    const { error } = await supabaseAdmin.from("task_comments").delete().eq("id", id);
    if (error) throw new Error(error.message);
}