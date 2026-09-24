// lib/actions/users.ts
"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export interface TeamMember {
    id: string; // Supabase users.id
    fullName: string;
    email: string;
    imageUrl: string;
}

export async function getTeamMembers(): Promise<TeamMember[]> {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const { data: userRows, error } = await supabaseAdmin
        .from("users")
        .select("id, clerk_user_id");

    if (error) throw new Error(error.message);
    if (!userRows?.length) return [];

    const client = await clerkClient();
    const clerkIds = userRows.map((u) => u.clerk_user_id);
    const { data: clerkUsers } = await client.users.getUserList({ userId: clerkIds, limit: clerkIds.length });

    const clerkMap = new Map(clerkUsers.map((u) => [u.id, u]));

    return userRows
        .map((row) => {
            const cu = clerkMap.get(row.clerk_user_id);
            if (!cu) return null;
            return {
                id: row.id,
                fullName: [cu.firstName, cu.lastName].filter(Boolean).join(" ") || cu.emailAddresses[0]?.emailAddress || "Unknown",
                email: cu.emailAddresses.find((e) => e.id === cu.primaryEmailAddressId)?.emailAddress ?? "",
                imageUrl: cu.imageUrl,
            };
        })
        .filter((u): u is TeamMember => !!u);
}

export async function getCurrentSupabaseUserId(): Promise<string | null> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return null;

    const { data } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("clerk_user_id", clerkUserId)
        .single();

    return data?.id ?? null;
}

export async function isCurrentUser(clerkUserId: string): Promise<boolean> {
    const { userId } = await auth();
    if (!userId) return false;

    return userId === clerkUserId;
}

export async function getSupabaseUserId(clerkUserId: string): Promise<string> {
    const { data, error } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("clerk_user_id", clerkUserId)
        .single();
    if (error || !data) throw new Error("User not found in Supabase — try reloading the dashboard first");
    return data.id;
}

export type UserMember = {
    id: string;
    fullName: string;
    email: string;
    imageUrl: string;
    position: string;
    workingHour: string;
    employmentType: string;
    role: string;
};

export async function getAllMembers(): Promise<UserMember[]> {
    const client = await clerkClient();

    const users = await client.users.getUserList({
    limit: 500,
    });

    return users.data.map((user) => {
        const unsafeMetadata = user.unsafeMetadata as {
        position?: string;
        workingHour?: string;
        employmentType?: string;
        };
        const publicMetadata = user.publicMetadata as {
        role?: string;
    };
    return {
        id: user.id,
        fullName:
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.emailAddresses[0]?.emailAddress ||
        "Unknown",
        email:
            user.emailAddresses.find(
            (e) => e.id === user.primaryEmailAddressId
            )?.emailAddress ?? "",
        imageUrl: user.imageUrl,
        role: publicMetadata.role ?? "staff",
        position: unsafeMetadata.position ?? "",
        workingHour: unsafeMetadata.workingHour ?? "",
        employmentType: unsafeMetadata.employmentType ?? "",
    };
    });
}

export interface UpdateMemberInput {
    userId: string; // Clerk user ID
    position?: string;
    workingHour?: string;
    employmentType?: string;
}

// export async function updateMemberInfo(input: UpdateMemberInput) {
//     const { sessionClaims } = await auth();
//     const isAdmin = (sessionClaims?.metadata as any)?.role === "admin";
//     if (!isAdmin) throw new Error("Only admins can edit other members.");

//     const client = await clerkClient();
//     const targetUser = await client.users.getUser(input.userId);

//     await client.users.updateUser(input.userId, {
//         unsafeMetadata: {
//             ...targetUser.unsafeMetadata,
//             position: input.position,
//             workingHour: input.workingHour,
//             employmentType: input.employmentType,
//         },
//     });
// }

export async function updateMemberInfo(input: UpdateMemberInput) {
    const { sessionClaims } = await auth();

    const isAdmin =
        (sessionClaims?.metadata as any)?.role === "admin";

    if (!isAdmin) {
        throw new Error("Only admins can edit other members.");
    }

    const client = await clerkClient();

    const targetUser = await client.users.getUser(input.userId);

    const updatedUser = await client.users.updateUser(input.userId, {
        unsafeMetadata: {
            ...targetUser.unsafeMetadata,
            position: input.position,
            workingHour: input.workingHour,
            employmentType: input.employmentType,
        },
    });

    return {
        id: updatedUser.id,
        fullName:
            `${updatedUser.firstName ?? ""} ${updatedUser.lastName ?? ""}`.trim(),
        email: updatedUser.emailAddresses[0]?.emailAddress ?? "",
        imageUrl: updatedUser.imageUrl,
        role: (updatedUser.publicMetadata?.role as string) ?? "staff",
        position: updatedUser.unsafeMetadata?.position as string | null,
        workingHour: updatedUser.unsafeMetadata?.workingHour as string | null,
        employmentType: updatedUser.unsafeMetadata?.employmentType as string | null,
    };
}