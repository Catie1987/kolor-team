// lib/actions/projects.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { projectSchema, type ProjectInput } from "@/lib/schemas/project";
import { enrichWithClerkUser, enrichWithClerkUsers } from "@/lib/clerk/clerk-user-cache"
import { cache } from "react";
import { createNotificationInternal } from "./notifications";

export interface Project extends ProjectInput {
    id: string;
    projectNumber: number;
    created_at: string;
    updated_at: string;
    contacts?: { name: string; short_name: string };
    leader?: { id: string; fullName: string; email: string; imageUrl: string };
    participants?: { id: string; fullName: string; email: string; imageUrl: string }[];
}

function mapProject(row: any): Project {
    return {
        id: row.id,
        projectNumber: row.project_number,
        customerId: row.customer_id,
        description: row.description,
        pricingModel: row.pricing_model,
        pricingValue: row.pricing_value,
        currency: row.currency,
        status: row.status,
        priority: row.priority,
        leaderId: row.leader_id,
        participantIds: row.participant_ids ?? [],
        startedAt: row.started_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        contacts: row.contacts,
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

export async function createProject(input: ProjectInput) {
    const { userId: clerkUserId, sessionClaims } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const role = (sessionClaims?.metadata as any)?.role;
    const isAdmin = role === "admin";

    const mySupabaseId = await getSupabaseUserId(clerkUserId); // real UUID

    const parsed = projectSchema.safeParse({
        ...input,
        leaderId: isAdmin ? input.leaderId : mySupabaseId, // non-admins can only lead their own projects
    });
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        throw new Error(`${issue?.path.join(".")}: ${issue?.message}`);
    }
    const data = parsed.data;

    const { data: saved, error } = await supabaseAdmin
        .from("projects")
        .insert({
            customer_id: data.customerId || null,
            description: data.description || null,
            pricing_model: data.pricingModel,
            pricing_value: data.pricingValue,
            currency: data.currency,
            status: data.status,
            priority: data.priority,
            leader_id: data.leaderId,
            participant_ids: data.participantIds,
            started_at: data.startedAt || new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .select("*, contacts(name, short_name)")
        .single();

    if (error) throw new Error(error.message);
    return mapProject(saved);
}

export async function getProjects() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const { data, error } = await supabaseAdmin
        .from("projects")
        .select("*, contacts(name, short_name)")
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const rows = (data ?? []).map(mapProject);

    // Collect every Supabase users.id referenced (leaders + all participants)
    const allUserIds = [
        ...new Set(rows.flatMap((r) => [r.leaderId, ...r.participantIds])),
    ];

    // Look up their clerk_user_id in one query
    const { data: userRows } = await supabaseAdmin
        .from("users")
        .select("id, clerk_user_id")
        .in("id", allUserIds);

    const clerkIdMap = new Map(userRows?.map((u) => [u.id, u.clerk_user_id]) ?? []);

    // Attach clerk_user_id (singular) for leader enrichment
    const withLeaderClerkId = rows.map((r) => ({
        ...r,
        clerk_leader_id: clerkIdMap.get(r.leaderId),
    }));
    const withLeader = await enrichWithClerkUser(withLeaderClerkId, "clerk_leader_id", "leader");

    // Attach clerk_user_id[] (array) for participant enrichment
    const withParticipantClerkIds = withLeader.map((r) => ({
        ...r,
        clerk_participant_ids: r.participantIds
            .map((id) => clerkIdMap.get(id))
            .filter((id): id is string => !!id),
    }));
    const fullyEnriched = await enrichWithClerkUsers(
        withParticipantClerkIds,
        "clerk_participant_ids",
        "participants"
    );

    return fullyEnriched as Project[];
}

export async function updateProject(id: string, input: Partial<ProjectInput>) {
    const { userId: clerkUserId, sessionClaims } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const isAdmin = (sessionClaims?.metadata as any)?.role === "admin";
    const myId = await getSupabaseUserId(clerkUserId);

    const parsed = projectSchema.partial().safeParse(input);
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid project data");
    const data = parsed.data;

    if (!isAdmin && data.leaderId !== undefined) {
        delete data.leaderId;
    }

    const { data: existing } = await supabaseAdmin
        .from("projects")
        .select("status, leader_id, participant_ids, contacts(name)")
        .eq("id", id)
        .single();

    const { data: saved, error } = await supabaseAdmin
        .from("projects")
        .update({
            ...(data.customerId !== undefined && { customer_id: data.customerId }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.pricingModel !== undefined && { pricing_model: data.pricingModel }),
            ...(data.pricingValue !== undefined && { pricing_value: data.pricingValue }),
            ...(data.currency !== undefined && { currency: data.currency }),
            ...(data.status !== undefined && { status: data.status }),
            ...(data.priority !== undefined && { priority: data.priority }),
            ...(data.participantIds !== undefined && { participant_ids: data.participantIds }),
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*, contacts(name, short_name)")
        .single();

    if (error) throw new Error(error.message);

    // Notify everyone on the team if status changed and it wasn't self-initiated-only
    if (existing && data.status && data.status !== existing.status) {
        const recipients = [existing.leader_id, ...(existing.participant_ids ?? [])].filter(
            (uid) => uid !== myId
        );
        for (const receiverId of recipients) {
            await createNotificationInternal({
                type: "project_status_changed",
                description: `changed project status to "${data.status}" for ${(existing as any).contacts?.name ?? "the project"}`,
                senderId: myId,
                receiverId,
                relatedProjectId: id,
                actionRequired: false,
            });
        }
    }

    return mapProject(saved);
}

export async function deleteProject(id: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const { error } = await supabaseAdmin.from("projects").delete().eq("id", id);
    if (error) throw new Error(error.message);
}

export const getProjectById = cache(async (id: string) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const { data, error } = await supabaseAdmin
        .from("projects")
        .select("*, contacts(name, short_name)")
        .eq("id", id)
        .single();

    if (error) throw new Error(error.message);

    const mapped = mapProject(data);

    const allUserIds = [mapped.leaderId, ...mapped.participantIds];
    const { data: userRows } = await supabaseAdmin
        .from("users")
        .select("id, clerk_user_id")
        .in("id", allUserIds);

    const clerkIdMap = new Map(userRows?.map((u) => [u.id, u.clerk_user_id]) ?? []);

    const withLeaderClerkId = { ...mapped, clerk_leader_id: clerkIdMap.get(mapped.leaderId) };
    const [withLeader] = await enrichWithClerkUser([withLeaderClerkId], "clerk_leader_id", "leader");

    const withParticipantClerkIds = {
        ...withLeader,
        clerk_participant_ids: mapped.participantIds.map((id) => clerkIdMap.get(id)).filter(Boolean) as string[],
    };
    const [fullyEnriched] = await enrichWithClerkUsers([withParticipantClerkIds], "clerk_participant_ids", "participants");

    return fullyEnriched as Project;
})

export interface ProjectTeamData {
    leaderId: string;
    members: { id: string; fullName: string; email: string; imageUrl: string }[];
}

export async function getProjectTeamMembers(projectId: string): Promise<ProjectTeamData> {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const project = await getProjectById(projectId);
    if (!project) return { leaderId: "", members: [] };

    const members: ProjectTeamData["members"] = [];
    if (project.leader) {
        members.push({
            id: project.leaderId,
            fullName: project.leader.fullName,
            email: project.leader.email,
            imageUrl: project.leader.imageUrl,
        });
    }
    project.participants?.forEach((p, i) => {
        members.push({
            id: project.participantIds[i],
            fullName: p.fullName,
            email: p.email,
            imageUrl: p.imageUrl,
        });
    });

    return { leaderId: project.leaderId, members };
}