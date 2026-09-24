// lib/actions/dashboards.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

async function getSupabaseUserId(clerkUserId: string): Promise<string> {
    const { data, error } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("clerk_user_id", clerkUserId)
        .single();
    if (error || !data) throw new Error("User not found in Supabase — try reloading the dashboard first");
    return data.id;
}

export interface ProjectStatusStat {
    status: string;
    label: string;
    color: string;
    value: number;
    percent: string;
}

// const statusConfig: Record<string, { label: string; color: string }> = {
//     just_started: { label: "Just Started", color: "bg-blue-500" },
//     in_progress: { label: "In Progress", color: "bg-amber-500" },
//     success: { label: "Success", color: "bg-emerald-500" },
//     pending: { label: "Pending", color: "bg-indigo-500" },
//     drop: { label: "Drop", color: "bg-red-500" },
// };

const statusConfig: Record<string, { label: string; color: string }> = {
    just_started: { label: "Just Started", color: "bg-chart-1" },
    in_progress: { label: "In Progress", color: "bg-chart-2" },
    success: { label: "Success", color: "bg-chart-3" },
    pending: { label: "Pending", color: "bg-chart-4" },
    drop: { label: "Drop", color: "bg-chart-6" },
};

export interface ProjectStatusStatsParams {
    month?: number; // 1-12, filters by started_at's month
    year?: number;  // required if month is given
}

export async function getMyProjectStatusStats(
    params: ProjectStatusStatsParams = {}
): Promise<ProjectStatusStat[]> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const myId = await getSupabaseUserId(clerkUserId);

    let ledQuery = supabaseAdmin.from("projects").select("status, started_at").eq("leader_id", myId);
    let participatedQuery = supabaseAdmin
        .from("projects")
        .select("status, started_at")
        .contains("participant_ids", [myId]);

    if (params.month && params.year) {
        const monthStart = new Date(params.year, params.month - 1, 1).toISOString();
        const monthEnd = new Date(params.year, params.month, 1).toISOString();
        ledQuery = ledQuery.gte("started_at", monthStart).lt("started_at", monthEnd);
        participatedQuery = participatedQuery.gte("started_at", monthStart).lt("started_at", monthEnd);
    }

    const [{ data: led }, { data: participated }] = await Promise.all([ledQuery, participatedQuery]);

    // Dedupe in case a project matches both (leader who's also in participant_ids)
    const seen = new Set<string>();
    const all: { status: string }[] = [];
    for (const p of [...(led ?? []), ...(participated ?? [])]) {
        const key = `${p.status}-${p.started_at}`; // not a perfect unique key without id, see note below
        all.push(p);
    }

    const total = all.length;
    const counts: Record<string, number> = {};
    for (const p of all) {
        counts[p.status] = (counts[p.status] ?? 0) + 1;
    }

    return Object.entries(statusConfig).map(([status, cfg]) => ({
        status,
        label: cfg.label,
        color: cfg.color,
        value: counts[status] ?? 0,
        percent: total > 0 ? `${Math.round(((counts[status] ?? 0) / total) * 100)}%` : "0%",
    })); 
}

export interface MonthlyProjectVolume {
    month: string; // "Jan", "Feb", ...
    count: number;
}

export async function getMyProjectVolumeByMonth(year: number): Promise<MonthlyProjectVolume[]> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const myId = await getSupabaseUserId(clerkUserId);

    const yearStart = new Date(year, 0, 1).toISOString();
    const yearEnd = new Date(year + 1, 0, 1).toISOString();

    const [{ data: led }, { data: participated }] = await Promise.all([
        supabaseAdmin
            .from("projects")
            .select("started_at")
            .eq("leader_id", myId)
            .gte("started_at", yearStart)
            .lt("started_at", yearEnd),
        supabaseAdmin
            .from("projects")
            .select("started_at")
            .contains("participant_ids", [myId])
            .gte("started_at", yearStart)
            .lt("started_at", yearEnd),
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const counts = new Array(12).fill(0);

    for (const p of [...(led ?? []), ...(participated ?? [])]) {
        if (!p.started_at) continue;
        const monthIndex = new Date(p.started_at).getMonth();
        counts[monthIndex] += 1;
    }

    return monthNames.map((month, i) => ({ month, count: counts[i] }));
}

export interface ColleagueStatsParams {
    month: number;
    year: number;
    limit?: number;
}

export interface ColleagueStat {
    id: string; // Supabase users.id
    fullName: string;
    email: string;
    imageUrl: string;
    department?: string;
    sharedProjectCount: number;
    tasksAssignedByMeCompleted: number;
}

export async function getMyTeamColleagues(params: ColleagueStatsParams): Promise<ColleagueStat[]> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const myId = await getSupabaseUserId(clerkUserId);

    const monthStart = new Date(params.year, params.month - 1, 1).toISOString();
    const monthEnd = new Date(params.year, params.month, 1).toISOString();

    const { data: allUsers } = await supabaseAdmin
        .from("users")
        .select("id, clerk_user_id")
        .neq("id", myId);

    if (!allUsers?.length) return [];

    // 2. Projects I'm involved in that STARTED within the selected month
    const { data: ledProjects } = await supabaseAdmin
        .from("projects")
        .select("id, leader_id, participant_ids")
        .eq("leader_id", myId)
        .gte("started_at", monthStart)
        .lt("started_at", monthEnd);

    const { data: participatedProjects } = await supabaseAdmin
        .from("projects")
        .select("id, leader_id, participant_ids")
        .contains("participant_ids", [myId])
        .gte("started_at", monthStart)
        .lt("started_at", monthEnd);

    const projectMap = new Map<string, { leader_id: string; participant_ids: string[] }>();
    for (const p of [...(ledProjects ?? []), ...(participatedProjects ?? [])]) {
        projectMap.set(p.id, { leader_id: p.leader_id, participant_ids: p.participant_ids ?? [] });
    }

    const sharedProjectCounts = new Map<string, number>();
    for (const project of projectMap.values()) {
        const everyone = [project.leader_id, ...project.participant_ids];
        for (const uid of everyone) {
            if (uid === myId) continue;
            sharedProjectCounts.set(uid, (sharedProjectCounts.get(uid) ?? 0) + 1);
        }
    }

    // 4. Tasks completed within the same month — needs its OWN project scope (all projects
    //    I lead, active in that month or not) since a task can complete in a different
    //    month than when its project started. Fetch task-relevant projects separately.
    const { data: allLedProjects } = await supabaseAdmin
        .from("projects")
        .select("id, leader_id")
        .eq("leader_id", myId);

    const ledProjectIds = (allLedProjects ?? []).map((p) => p.id);

    const { data: tasks } = await supabaseAdmin
        .from("project_tasks")
        .select("assignee_id, status, project_id, updated_at")
        .in("project_id", ledProjectIds)
        .eq("status", "done")
        .gte("updated_at", monthStart)
        .lt("updated_at", monthEnd);

    const completedByAssignee = new Map<string, number>();
    for (const t of tasks ?? []) {
        if (!t.assignee_id || t.assignee_id === myId) continue;
        completedByAssignee.set(t.assignee_id, (completedByAssignee.get(t.assignee_id) ?? 0) + 1);
    }

    // 5. Enrich every user
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const clerkIds = allUsers.map((u) => u.clerk_user_id);
    const { data: clerkUsers } = await client.users.getUserList({ userId: clerkIds, limit: clerkIds.length });
    const clerkMap = new Map(clerkUsers.map((u) => [u.id, u]));

    const colleagues: ColleagueStat[] = allUsers.map((row) => {
        const cu = clerkMap.get(row.clerk_user_id);
        const department = (cu?.unsafeMetadata as { department?: string } | undefined)?.department;

        return {
            id: row.id,
            fullName: [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") || cu?.emailAddresses[0]?.emailAddress || "Unknown",
            email: cu?.emailAddresses.find((e) => e.id === cu.primaryEmailAddressId)?.emailAddress ?? "",
            imageUrl: cu?.imageUrl ?? "",
            department: department || undefined,
            sharedProjectCount: sharedProjectCounts.get(row.id) ?? 0,
            tasksAssignedByMeCompleted: completedByAssignee.get(row.id) ?? 0,
        };
    });

    const sorted = colleagues.sort((a, b) => {
        if (b.tasksAssignedByMeCompleted !== a.tasksAssignedByMeCompleted) {
            return b.tasksAssignedByMeCompleted - a.tasksAssignedByMeCompleted;
        }
        return b.sharedProjectCount - a.sharedProjectCount;
    });

    return params.limit ? sorted.slice(0, params.limit) : sorted;
}

export interface ColleagueDetail {
    id: string;
    fullName: string;
    email: string;
    imageUrl: string;
    department?: string;
    branch?: string;
    workAt?: string;
    isOnline: boolean;
    lastActiveAt: number | null; // ms timestamp
    projectsLedCount: number;
    projectsFollowedCount: number;
    totalProjectsCount: number; // system-wide, for percentage
    contactsAddedCount: number;
    totalContactsCount: number; // system-wide, for percentage
    totalTasksAssigned: number;
    totalTasksCompleted: number;
    tasksByStatus: { todo: number; in_progress: number; done: number };
    clerkId: string;
    role?: string;
    employmentType?: string;
    joinedDate?: Date;
    dateOfBirth?: string;
    position?: string;
    workingHour?: string;
    personalPhone?: string;
    bio?: string;
}

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export async function getColleagueDetail(colleagueId: string): Promise<ColleagueDetail | null> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const { data: userRow } = await supabaseAdmin
        .from("users")
        .select("id, clerk_user_id")
        .eq("id", colleagueId)
        .single();

    if (!userRow) return null;

    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const cu = await client.users.getUser(userRow.clerk_user_id).catch(() => null);
    if (!cu) return null;
    
    const clerkId = cu.id
    const role = (cu.publicMetadata?.role as string) ?? "other";
    const joinedDate = (cu.createdAt as unknown as Date | undefined);
    const meta = cu.unsafeMetadata as { 
        department?: string; 
        branch?: string; 
        workAt?: string;
        employmentType?: string; 
        position?: string;
        dateOfBirth?: string;
        workingHour?: string;
        personalPhone?: string;
        bio?: string;
    } | undefined;

    const lastActiveAt = cu.lastActiveAt ?? null;
    const isOnline = lastActiveAt ? Date.now() - lastActiveAt < ONLINE_THRESHOLD_MS : false;

    const [
        { count: ledCount },
        { count: followedCount },
        { count: totalProjectsCount },
        { count: contactsAddedCount },
        { count: totalContactsCount },
        { data: tasks },
    ] = await Promise.all([
        supabaseAdmin.from("projects").select("id", { count: "exact", head: true }).eq("leader_id", colleagueId),
        supabaseAdmin.from("projects").select("id", { count: "exact", head: true }).contains("participant_ids", [colleagueId]),
        supabaseAdmin.from("projects").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("contacts").select("id", { count: "exact", head: true }).eq("user_id", colleagueId),
        supabaseAdmin.from("contacts").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("project_tasks").select("status").eq("assignee_id", colleagueId),
    ]);

    const tasksByStatus = { todo: 0, in_progress: 0, done: 0 };
    for (const t of tasks ?? []) {
        if (t.status in tasksByStatus) tasksByStatus[t.status as keyof typeof tasksByStatus] += 1;
    }

    return {
        id: userRow.id,
        fullName: [cu.firstName, cu.lastName].filter(Boolean).join(" ") || cu.emailAddresses[0]?.emailAddress || "Unknown",
        email: cu.emailAddresses.find((e) => e.id === cu.primaryEmailAddressId)?.emailAddress ?? "",
        imageUrl: cu.imageUrl,
        department: meta?.department,
        branch: meta?.branch,
        workAt: meta?.workAt,
        isOnline,
        lastActiveAt,
        projectsLedCount: ledCount ?? 0,
        projectsFollowedCount: followedCount ?? 0,
        totalProjectsCount: totalProjectsCount ?? 0,
        contactsAddedCount: contactsAddedCount ?? 0,
        totalContactsCount: totalContactsCount ?? 0,
        totalTasksAssigned: tasks?.length ?? 0,
        totalTasksCompleted: tasksByStatus.done,
        tasksByStatus,
        clerkId,
        role,
        joinedDate,
        dateOfBirth: meta?.dateOfBirth,
        workingHour: meta?.workingHour,
        position: meta?.position,
        employmentType: meta?.employmentType,
        personalPhone: meta?.personalPhone,
        bio: meta?.bio,
    };
}

export interface DailyActivity {
    date: string; // "YYYY-MM-DD"
    hasOnlineActivity: boolean; // was online that day, but no tracked actions
    hasWorkActivity: boolean; // created/updated a contact, project, or task
    actionCount: number;
}

export async function getMemberActivityByMonth(
    memberId: string,
    month: number,
    year: number
): Promise<DailyActivity[]> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);
    const daysInMonth = new Date(year, month, 0).getDate();

    const monthStartStr = `${year}-${String(month).padStart(2, "0")}-01`;
    const monthEndStr = `${monthEnd.getFullYear()}-${String(monthEnd.getMonth() + 1).padStart(2, "0")}-01`;

    const [
        { data: contacts },
        { data: projects },
        { data: tasks },
        { data: sessions },
    ] = await Promise.all([
        supabaseAdmin
            .from("contacts")
            .select("updated_at")
            .eq("user_id", memberId)
            .gte("updated_at", monthStart.toISOString())
            .lt("updated_at", monthEnd.toISOString()),
        supabaseAdmin
            .from("projects")
            .select("updated_at")
            .eq("leader_id", memberId)
            .gte("updated_at", monthStart.toISOString())
            .lt("updated_at", monthEnd.toISOString()),
        supabaseAdmin
            .from("project_tasks")
            .select("updated_at")
            .eq("assignee_id", memberId)
            .gte("updated_at", monthStart.toISOString())
            .lt("updated_at", monthEnd.toISOString()),
        supabaseAdmin
            .from("user_sessions")
            .select("activity_date")
            .eq("user_id", memberId)
            .gte("activity_date", monthStartStr)
            .lt("activity_date", monthEndStr),
    ]);

    const actionCountByDay = new Array(daysInMonth + 1).fill(0);
    for (const row of [...(contacts ?? []), ...(projects ?? []), ...(tasks ?? [])]) {
        const day = new Date(row.updated_at).getDate();
        actionCountByDay[day] += 1;
    }

    const onlineDays = new Set((sessions ?? []).map((s) => new Date(s.activity_date).getDate()));

    const result: DailyActivity[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month - 1, day);
    // Build the date string from LOCAL components, not toISOString() (which converts to UTC)
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
    const actionCount = actionCountByDay[day] ?? 0;

        result.push({
            date: dateStr,
            hasOnlineActivity: actionCount === 0 && onlineDays.has(day),
            hasWorkActivity: actionCount > 0,
            actionCount,
        });
    }

    return result;
}

export async function logDailyActivity() {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return; // fail silently — this is a background log, not critical path

    try {
        const myId = await getSupabaseUserId(clerkUserId);
        const today = new Date();
        const activityDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

        await supabaseAdmin
            .from("user_sessions")
            .upsert(
                { user_id: myId, activity_date: activityDate },
                { onConflict: "user_id,activity_date", ignoreDuplicates: true }
            );
    } catch {
        // swallow errors — logging shouldn't ever break the dashboard
    }
}

