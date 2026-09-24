"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { notificationSchema, type NotificationInput } from "@/lib/schemas/notification"
import { cache } from "react";
import { enrichWithClerkUser } from "../clerk/clerk-user-cache";
import { getSupabaseUserId } from "./users";

export interface Notification {
    id: string;
    type: string;
    description: string;
    senderId: string;
    receiverId: string;
    relatedProjectId?: string;
    actionRequired: boolean;
    actionStatus?: "pending" | "approved" | "rejected";
    isRead: boolean;
    created_at: string;
    updated_at: string;
    sender?: { id: string; fullName: string; email: string; imageUrl: string };
    projects?: { project_number: number; contacts?: { name: string; short_name: string } };
}

function mapNotification(row: any): Notification {
    return {
        id: row.id,
        type: row.type,
        description: row.description,
        senderId: row.sender_id,
        receiverId: row.receiver_id,
        relatedProjectId: row.related_project_id,
        actionRequired: row.action_required,
        actionStatus: row.action_status,
        isRead: row.is_read,
        created_at: row.created_at,
        updated_at: row.updated_at,
        projects: row.projects,
    };
}



async function createNotification(input: NotificationInput) {
    const parsed = notificationSchema.safeParse(input);
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid notification data");
    const data = parsed.data;

    const { error } = await supabaseAdmin.from("notifications").insert({
        type: data.type,
        description: data.description,
        sender_id: data.senderId,
        receiver_id: data.receiverId,
        related_project_id: data.relatedProjectId || null,
        action_required: data.actionRequired,
        action_status: data.actionRequired ? "pending" : null,
    });

    if (error) throw new Error(error.message);
}

// --- Request to join a project ---
export async function requestToJoinProject(projectId: string) {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const myId = await getSupabaseUserId(clerkUserId);

    const { data: project } = await supabaseAdmin
        .from("projects")
        .select("leader_id, participant_ids, contacts(name)")
        .eq("id", projectId)
        .single();

    if (!project) throw new Error("Project not found.");

    if (project.leader_id === myId || (project.participant_ids ?? []).includes(myId)) {
        throw new Error("You're already part of this project.");
    }

    // Notify the leader (extend to also notify admins if desired)
    await createNotification({
        type: "project_join_request",
        description: `requested to join Project ${(project as any).contacts?.name ?? "a project"}`,
        senderId: myId,
        receiverId: project.leader_id,
        relatedProjectId: projectId,
        actionRequired: true,
    });
}

export async function respondToJoinRequest(notificationId: string, approve: boolean) {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const myId = await getSupabaseUserId(clerkUserId);

    const { data: notification } = await supabaseAdmin
        .from("notifications")
        .select("*")
        .eq("id", notificationId)
        .single();

    if (!notification) throw new Error("Notification not found.");
    if (notification.receiver_id !== myId) throw new Error("You cannot respond to this request.");
    if (notification.action_status !== "pending") throw new Error("This request has already been resolved.");

    // Update the original notification
    await supabaseAdmin
        .from("notifications")
        .update({ action_status: approve ? "approved" : "rejected", updated_at: new Date().toISOString() })
        .eq("id", notificationId);

    if (approve && notification.related_project_id) {
        const { data: project } = await supabaseAdmin
            .from("projects")
            .select("participant_ids, contacts(name)")
            .eq("id", notification.related_project_id)
            .single();

        if (project && !project.participant_ids.includes(notification.sender_id)) {
            await supabaseAdmin
                .from("projects")
                .update({
                    participant_ids: [...project.participant_ids, notification.sender_id],
                    updated_at: new Date().toISOString(),
                })
                .eq("id", notification.related_project_id);
        }

        await createNotification({
            type: "project_join_approved",
            description: `approved your request to join ${(project as any)?.contacts?.name ?? "the project"}`,
            senderId: myId,
            receiverId: notification.sender_id,
            relatedProjectId: notification.related_project_id,
            actionRequired: false,
        });
    } else if (!approve) {
        await createNotification({
            type: "project_join_rejected",
            description: "rejected your request to join a project",
            senderId: myId,
            receiverId: notification.sender_id,
            relatedProjectId: notification.related_project_id,
            actionRequired: false,
        });
    }
}

// --- Fetching notifications ---
export const getMyNotifications = cache(async (): Promise<Notification[]> => {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const myId = await getSupabaseUserId(clerkUserId);

    const { data, error } = await supabaseAdmin
        .from("notifications")
        .select("*, users!sender_id(clerk_user_id), projects(project_number, contacts(name, short_name))")
        .eq("receiver_id", myId)
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const rows = (data ?? []).map((row) => ({
        ...mapNotification(row),
        clerk_user_id: row.users?.clerk_user_id,
        projects: row.projects,
    }));

    return enrichWithClerkUser(rows, "clerk_user_id", "sender") as Promise<Notification[]>;
});

export async function markNotificationRead(id: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await supabaseAdmin.from("notifications").update({ is_read: true }).eq("id", id);
}

export async function getUnreadNotificationCount(): Promise<number> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return 0;

    const myId = await getSupabaseUserId(clerkUserId);

    const { count } = await supabaseAdmin
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", myId)
        .eq("is_read", false);

    return count ?? 0;
}

export async function markAllNotificationsRead() {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const myId = await getSupabaseUserId(clerkUserId);

    const { error } = await supabaseAdmin
        .from("notifications")
        .update({ is_read: true })
        .eq("receiver_id", myId)
        .eq("is_read", false);

    if (error) throw new Error(error.message);
}

export async function hasPendingJoinRequest(projectId: string): Promise<boolean> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return false;

    const myId = await getSupabaseUserId(clerkUserId);

    const { data, error } = await supabaseAdmin
        .from("notifications")
        .select("id")
        .eq("type", "project_join_request")
        .eq("sender_id", myId)
        .eq("related_project_id", projectId)
        .eq("action_status", "pending")
        .maybeSingle();

    if (error) return false;
    return !!data;
}

export async function getMyPendingJoinRequestProjectIds(): Promise<string[]> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return [];

    const myId = await getSupabaseUserId(clerkUserId);

    const { data, error } = await supabaseAdmin
        .from("notifications")
        .select("related_project_id")
        .eq("type", "project_join_request")
        .eq("sender_id", myId)
        .eq("action_status", "pending");

    if (error) return [];
    return (data ?? []).map((r) => r.related_project_id).filter(Boolean) as string[];
}

export async function createNotificationInternal(input: NotificationInput) {
    const parsed = notificationSchema.safeParse(input);
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid notification data");
    const data = parsed.data;

    const { error } = await supabaseAdmin.from("notifications").insert({
        type: data.type,
        description: data.description,
        sender_id: data.senderId,
        receiver_id: data.receiverId,
        related_project_id: data.relatedProjectId || null,
        action_required: data.actionRequired,
        action_status: data.actionRequired ? "pending" : null,
    });

    if (error) throw new Error(error.message);
}

export async function deleteNotifications(ids: string[]) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const { error } = await supabaseAdmin.from("notifications").delete().in("id", ids);
    if (error) throw new Error(error.message);
}