// lib/clerk-user-cache.ts
import { clerkClient } from "@clerk/nextjs/server";

export interface ClerkUserSummary {
    id: string;
    fullName: string;
    email: string;
    imageUrl: string;
    role?: string;
}

/**
 * Batch-fetches Clerk user details for a list of Clerk user IDs.
 * Returns a Map for O(1) lookup by clerk_user_id — use this instead of
 * calling clerkClient() individually per row.
 */
export async function getClerkUsersMap(clerkUserIds: string[]): Promise<Map<string, ClerkUserSummary>> {
    const uniqueIds = [...new Set(clerkUserIds.filter(Boolean))];
    if (uniqueIds.length === 0) return new Map();

    const client = await clerkClient();
    const { data } = await client.users.getUserList({ userId: uniqueIds, limit: uniqueIds.length });

    const map = new Map<string, ClerkUserSummary>();
    for (const user of data) {
        map.set(user.id, {
            id: user.id,
            fullName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.emailAddresses[0]?.emailAddress || "Unknown",
            email: user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ?? "",
            imageUrl: user.imageUrl,
            role: user.publicMetadata?.role as string | undefined,
        });
    }
    return map;
}

// lib/clerk-user-cache.ts (continued)

/**
 * Enriches an array of Supabase rows with Clerk user data (name, avatar, email)
 * for one field containing a clerk_user_id, e.g. `created_by`, `assigned_to`, `owner_id`.
 *
 * Usage:
 *   const enriched = await enrichWithClerkUser(projects, "owner_clerk_id", "owner");
 *   // each row now has row.owner = { id, fullName, email, imageUrl, role }
 */
export async function enrichWithClerkUser<T extends Record<string, any>>(
    rows: T[],
    clerkIdField: keyof T,
    outputField: string
): Promise<(T & Record<string, ClerkUserSummary | undefined>)[]> {
    const ids = rows.map((row) => row[clerkIdField] as string).filter(Boolean);
    const usersMap = await getClerkUsersMap(ids);

    return rows.map((row) => ({
        ...row,
        [outputField]: usersMap.get(row[clerkIdField] as string),
    }));
}

export async function enrichWithClerkUsers<T extends Record<string, any>>(
    rows: T[],
    clerkIdsField: keyof T,
    outputField: string
): Promise<(T & Record<string, ClerkUserSummary[]>)[]> {
    const allIds = rows.flatMap((row) => (row[clerkIdsField] as string[]) ?? []);
    const usersMap = await getClerkUsersMap(allIds);

    return rows.map((row) => ({
        ...row,
        [outputField]: ((row[clerkIdsField] as string[]) ?? [])
            .map((id) => usersMap.get(id))
            .filter((u): u is ClerkUserSummary => !!u),
    }));
}