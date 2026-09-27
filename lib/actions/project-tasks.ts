"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { projectTaskSchema, type ProjectTaskInput } from "@/lib/schemas/project-task";
import { enrichWithClerkUser } from "../clerk/clerk-user-cache"; 
import { createNotificationInternal } from "@/lib/actions/notifications";
import { getSupabaseUserId } from "./users";

export interface ProjectTask extends ProjectTaskInput {
    id: string;
    created_at: string;
    updated_at: string;
    assignee?: { id: string; fullName: string; email: string; imageUrl: string };
    commentCount: number;
}

function mapTask(row: any): ProjectTask {
    return {
        id: row.id,
        projectId: row.project_id,
        detail: row.detail,
        assigneeId: row.assignee_id,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        commentCount: row.comment_count ?? 0,
    };
}

export async function getProjectTasks(projectId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const { data, error } = await supabaseAdmin
        .from("project_tasks")
        .select("*, users!assignee_id(clerk_user_id)")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);

    const rows = (data ?? []).map((row) => ({
        ...mapTask(row),
        clerk_user_id: row.users?.clerk_user_id,
    }));

    return enrichWithClerkUser(rows, "clerk_user_id", "assignee") as Promise<ProjectTask[]>;
}

// const isAdmin = (sessionClaims?.metadata as any)?.role === "admin";

export async function createProjectTask(input: ProjectTaskInput) {
    const { userId: clerkUserId, sessionClaims } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const isAdmin = (sessionClaims?.metadata as any)?.role === "admin";
    const myId = await getSupabaseUserId(clerkUserId);

    const parsed = projectTaskSchema.safeParse(input);
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        throw new Error(`${issue?.path.join(".")}: ${issue?.message}`);
    }
    const data = parsed.data;

    const { data: project } = await supabaseAdmin
        .from("projects")
        .select("leader_id, participant_ids, contacts(name)")
        .eq("id", data.projectId)
        .single();
    if (!project) throw new Error("Project not found.");

    const isLeader = project.leader_id === myId;
    let assigneeId = data.assigneeId || myId;

    if (!isAdmin && !isLeader) {
        assigneeId = myId;
    } else {
        const validAssignees = [project.leader_id, ...(project.participant_ids ?? [])];
        if (!validAssignees.includes(assigneeId)) {
            throw new Error("Assignee must be the project leader or a participant.");
        }
    }

    const { data: saved, error } = await supabaseAdmin
        .from("project_tasks")
        .insert({
            project_id: data.projectId,
            detail: data.detail,
            assignee_id: assigneeId,
            status: data.status,
        })
        .select("*, users!assignee_id(clerk_user_id)")
        .single();

    if (error) throw new Error(error.message);

    await touchProjectUpdatedAt(data.projectId);

    // Notify the assignee, if it's not the creator assigning to themselves
    if (assigneeId !== myId) {
        await createNotificationInternal({
            type: "task_assigned",
            description: `assigned you a new task: "${data.detail}"`,
            senderId: myId,
            receiverId: assigneeId,
            relatedProjectId: data.projectId,
            actionRequired: false,
        });
    }

    const mapped = { ...mapTask(saved), clerk_user_id: saved.users?.clerk_user_id };
    const [enriched] = await enrichWithClerkUser([mapped], "clerk_user_id", "assignee");
    return enriched as ProjectTask;
}

async function checkTaskPermission(taskId: string, clerkUserId: string): Promise<{ canManage: boolean }> {
    const { data: userRow } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("clerk_user_id", clerkUserId)
        .single();
    if (!userRow) return { canManage: false };

    const { data: task } = await supabaseAdmin
        .from("project_tasks")
        .select("assignee_id, project_id")
        .eq("id", taskId)
        .single();
    if (!task) return { canManage: false };

    const { data: project } = await supabaseAdmin
        .from("projects")
        .select("leader_id")
        .eq("id", task.project_id)
        .single();

    const isOwnTask = task.assignee_id === userRow.id;
    const isLeader = project?.leader_id === userRow.id;

    return { canManage: isOwnTask || isLeader };
}

export async function updateTaskStatus(id: string, status: string) {
    const { userId: clerkUserId, sessionClaims } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const isAdmin = (sessionClaims?.metadata as any)?.role === "admin";
    const myId = await getSupabaseUserId(clerkUserId);

    if (!isAdmin) {
        const { canManage } = await checkTaskPermission(id, clerkUserId);
        if (!canManage) throw new Error("You don't have permission to move this task.");
    }

    const parsed = taskStatusFromString(status);
    if (!parsed) throw new Error(`Invalid status: "${status}"`);

    const { data: task, error } = await supabaseAdmin
        .from("project_tasks")
        .update({ status: parsed, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("project_id, detail, assignee_id, projects(leader_id, contacts(name))")
        .single();

    if (error) throw new Error(error.message);

    await touchProjectUpdatedAt(task.project_id);

    const leaderId = (task.projects as any)?.leader_id;
    // Notify the leader if someone OTHER than the leader changed the status
    if (leaderId && leaderId !== myId) {
        await createNotificationInternal({
            type: "task_status_changed",
            description: `moved task "${task.detail}" to ${statusLabel(parsed)}`,
            senderId: myId,
            receiverId: leaderId,
            relatedProjectId: task.project_id,
            actionRequired: false,
        });
    }
}

function statusLabel(status: string) {
    return { todo: "To Do", in_progress: "In Progress", done: "Done" }[status] ?? status;
}

function taskStatusFromString(status: string): "todo" | "in_progress" | "done" | null {
    return ["todo", "in_progress", "done"].includes(status) ? (status as any) : null;
}

export async function deleteProjectTask(id: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Get project_id before deleting, so we can still touch it after
    const { data: task } = await supabaseAdmin
        .from("project_tasks")
        .select("project_id")
        .eq("id", id)
        .single();

    const { error } = await supabaseAdmin.from("project_tasks").delete().eq("id", id);
    if (error) throw new Error(error.message);

    if (task) await touchProjectUpdatedAt(task.project_id);
}

export async function updateProjectTask(id: string, input: Partial<ProjectTaskInput>) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const parsed = projectTaskSchema.partial().safeParse({
        ...input,
        assigneeId: input.assigneeId?.trim() || undefined,
    });
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid task data");
    const data = parsed.data;

    let assigneeId = data.assigneeId;

    // If assigneeId was explicitly part of the update but ended up empty, default to leader
    if ("assigneeId" in input && !assigneeId) {
        const { data: task } = await supabaseAdmin
            .from("project_tasks")
            .select("project_id")
            .eq("id", id)
            .single();

        const { data: project } = await supabaseAdmin
            .from("projects")
            .select("leader_id")
            .eq("id", task?.project_id)
            .single();

        assigneeId = project?.leader_id;
    }

    const { data: saved, error } = await supabaseAdmin
        .from("project_tasks")
        .update({
            ...(data.detail !== undefined && { detail: data.detail }),
            ...(assigneeId !== undefined && { assignee_id: assigneeId }),
            ...(data.status !== undefined && { status: data.status }),
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    await touchProjectUpdatedAt(saved.project_id);
    return mapTask(saved);
}

export async function reorderProjectTasks(taskIds: string[]) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const updates = taskIds.map((id, index) =>
        supabaseAdmin.from("project_tasks").update({ sort_order: index }).eq("id", id)
    );

    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) throw new Error(failed.error.message);
}

export interface MyTaskGroup {
    projectId: string;
    projectNumber: number;
    contactName: string;
    contactShortName: string;
    isLeader: boolean;
    tasks: ProjectTask[];
}

export async function getMyTasks(): Promise<MyTaskGroup[]> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const { data: userRow } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("clerk_user_id", clerkUserId)
        .single();

    if (!userRow) return [];
    const myId = userRow.id;

    // Projects where I'm the leader
    const { data: ledProjects } = await supabaseAdmin
        .from("projects")
        .select("id, project_number, leader_id, contacts(name, short_name)")
        .eq("leader_id", myId);

    // Projects where I'm a participant (tasks might be assigned to me there too)
    const { data: participantProjects } = await supabaseAdmin
        .from("projects")
        .select("id, project_number, leader_id, contacts(name, short_name)")
        .contains("participant_ids", [myId]);

    const allProjectIds = [
        ...new Set([
            ...(ledProjects ?? []).map((p) => p.id),
            ...(participantProjects ?? []).map((p) => p.id),
        ]),
    ];

    if (allProjectIds.length === 0) return [];

    // All tasks assigned to me, across any project
    const { data: myTasks, error } = await supabaseAdmin
        .from("project_tasks")
        .select("*, users!assignee_id(clerk_user_id)")
        .eq("assignee_id", myId)
        .in("project_id", allProjectIds)
        .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);

    const enrichedTasks = await enrichWithClerkUser(
        (myTasks ?? []).map((row) => ({ ...mapTask(row), clerk_user_id: row.users?.clerk_user_id })),
        "clerk_user_id",
        "assignee"
    );

    const projectMap = new Map(
        [...(ledProjects ?? []), ...(participantProjects ?? [])].map((p) => [p.id, p])
    );

    const groups = new Map<string, MyTaskGroup>();

    for (const task of enrichedTasks as ProjectTask[]) {
        const project = projectMap.get(task.projectId);
        if (!project) continue;

        if (!groups.has(task.projectId)) {
            groups.set(task.projectId, {
                projectId: task.projectId,
                projectNumber: project.project_number,
                contactName: (project as any).contacts?.name ?? "Unknown",
                contactShortName: (project as any).contacts?.short_name ?? "",
                isLeader: project.leader_id === myId,
                tasks: [],
            });
        }
        groups.get(task.projectId)!.tasks.push(task);
    }

    return Array.from(groups.values()).sort((a, b) => a.contactName.localeCompare(b.contactName));
}

async function touchProjectUpdatedAt(projectId: string) {
    await supabaseAdmin
        .from("projects")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", projectId);
}