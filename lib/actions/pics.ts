// lib/actions/pics.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { picSchema, type PicInput } from "@/lib/schemas/pic";

export interface Pic extends PicInput {
    id: string;
    sortOrder: number;
    created_at: string;
    updated_at: string;
}

function mapPic(row: any): Pic {
    return {
        id: row.id,
        contactId: row.contact_id,
        title: row.title,
        fullName: row.full_name,
        department: row.department,
        position: row.position,
        mobileNumbers: row.mobile_numbers ?? [],
        email: row.email,
        sortOrder: row.sort_order,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

export async function getPics(contactId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    if (!contactId) {
        return [];
    }

    const { data, error } = await supabaseAdmin
        .from("pics")
        .select("*")
        .eq("contact_id", contactId)
        .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapPic);
}

export async function createPic(input: PicInput) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const parsed = picSchema.safeParse(input);
    if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid PIC data");
    }
    const data = parsed.data;

    const { count } = await supabaseAdmin
        .from("pics")
        .select("id", { count: "exact", head: true })
        .eq("contact_id", data.contactId);

    const { data: saved, error } = await supabaseAdmin
        .from("pics")
        .insert({
            contact_id: data.contactId,
            title: data.title || null,
            full_name: data.fullName,
            department: data.department || null,
            position: data.position || null,
            mobile_numbers: data.mobileNumbers,
            email: data.email || null,
            sort_order: count ?? 0,
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return mapPic(saved);
}

export async function updatePic(id: string, input: Partial<PicInput>) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const parsed = picSchema.partial().safeParse(input);
    if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid PIC data");
    }
    const data = parsed.data;

    const { data: saved, error } = await supabaseAdmin
        .from("pics")
        .update({
            ...(data.title !== undefined && { title: data.title }),
            ...(data.fullName !== undefined && { full_name: data.fullName }),
            ...(data.department !== undefined && { department: data.department }),
            ...(data.position !== undefined && { position: data.position }),
            ...(data.mobileNumbers !== undefined && { mobile_numbers: data.mobileNumbers }),
            ...(data.email !== undefined && { email: data.email }),
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return mapPic(saved);
}

export async function deletePic(id: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const { error } = await supabaseAdmin.from("pics").delete().eq("id", id);
    if (error) throw new Error(error.message);
}

export async function reorderPics(orderedIds: string[]) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const updates = orderedIds.map((id, index) =>
        supabaseAdmin.from("pics").update({ sort_order: index }).eq("id", id)
    );

    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) throw new Error(failed.error.message);
}

export async function getPicCount(contactId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
        .from("pics")
        .select("id", { count: "exact", head: true })
        .eq("contact_id", contactId);

    if (error) throw new Error(error.message);
    return count ?? 0;
}