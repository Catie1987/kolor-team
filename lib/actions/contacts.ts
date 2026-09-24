// lib/contacts.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import { enrichWithClerkUser } from "@/lib/clerk/clerk-user-cache";

export type BusinessType = "epe" | "non-epe";

function mapContact(row: any): Contact {
    return {
        id: row.id,
        type: row.type,
        name: row.name,
        shortName: row.short_name,
        taxId: row.tax_id,
        businessType: row.business_type,
        region: row.region,
        provinceCity: row.province_city,
        industrialZone: row.industrial_zone,
        fullAddress: row.full_address,
        phoneNumber: row.phone_number,
        information: row.information,
        user_id: row.user_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        users: row.users,
    };
}

export type ContactType = "customers" | "suppliers" | "forwarders";

export interface ContactInput {
    type: ContactType;
    name: string;
    shortName: string;
    taxId?: string;
    businessType?: BusinessType;
    region?: string;
    provinceCity?: string;
    industrialZone?: string;
    fullAddress?: string;
    phoneNumber?: string;
    information?: string;
}

export interface Contact extends ContactInput {
    id: string;
    user_id: string;
    created_at: string;
    updated_at: string;
    users?: {
        clerk_user_id: string;
    };
    creator?: {
        id: string;
        fullName: string;
        email: string;
        imageUrl: string;
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

export async function createContact(input: ContactInput) {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const userId = await getSupabaseUserId(clerkUserId);

    const { data, error } = await supabaseAdmin
        .from("contacts")
        .insert({
            type: input.type,
            name: input.name,
            short_name: input.shortName,
            tax_id: input.taxId || null,
            business_type: input.type === "customers" ? input.businessType ?? null : null,
            region: input.region || null,
            province_city: input.provinceCity || null,
            industrial_zone: input.industrialZone || null,
            full_address: input.fullAddress || null,
            phone_number: input.phoneNumber || null,
            information: input.information || null,
            user_id: userId,
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return mapAndEnrich(data);
}

export async function getContacts(type: ContactType) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const { data, error } = await supabaseAdmin
        .from("contacts")
        .select("*, users(clerk_user_id)")
        .eq("type", type)
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const rows = (data ?? []).map((row) => ({
        ...mapContact(row),
        clerk_user_id: row.users?.clerk_user_id,
    }));

    return enrichWithClerkUser(rows, "clerk_user_id", "creator") as Promise<Contact[]>;
}

export async function updateContact(id: string, input: Partial<ContactInput>) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const { data, error } = await supabaseAdmin
        .from("contacts")
        .update({
            ...(input.name !== undefined && { name: input.name }),
            ...(input.shortName !== undefined && { short_name: input.shortName }),
            ...(input.taxId !== undefined && { tax_id: input.taxId }),
            ...(input.businessType !== undefined && { business_type: input.businessType }),
            ...(input.region !== undefined && { region: input.region }),
            ...(input.provinceCity !== undefined && { province_city: input.provinceCity }),
            ...(input.industrialZone !== undefined && { industrial_zone: input.industrialZone }),
            ...(input.fullAddress !== undefined && { full_address: input.fullAddress }),
            ...(input.phoneNumber !== undefined && { phone_number: input.phoneNumber }),
            ...(input.information !== undefined && { information: input.information }),
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*, users(clerk_user_id)") // ← join, same as getContacts
        .single();

    if (error) throw new Error(error.message);

    return mapAndEnrich(data);
}

export async function deleteContact(id: string) {
    const { userId: clerkUserId, sessionClaims } = (await auth()) as {
        userId: string | null;
        sessionClaims?: {
            metadata?: {
                role?: string;
            };
        };
    };
    if (!clerkUserId) throw new Error("Unauthorized");

    const role = sessionClaims?.metadata?.role;
    const isAdmin = role === "admin";

    if (!isAdmin) {
        // Non-admins can only delete their own contacts
        const userId = await getSupabaseUserId(clerkUserId);
        const { data: contact } = await supabaseAdmin
            .from("contacts")
            .select("user_id")
            .eq("id", id)
            .single();

        if (!contact || contact.user_id !== userId) {
            throw new Error("You don't have permission to delete this contact.");
        }
    }

    const { error } = await supabaseAdmin.from("contacts").delete().eq("id", id);
    if (error) throw new Error(error.message);
}

async function mapAndEnrich(row: any): Promise<Contact> {
    const mapped = { ...mapContact(row), clerk_user_id: row.users?.clerk_user_id };
    const [enriched] = await enrichWithClerkUser([mapped], "clerk_user_id", "creator");
    return enriched as Contact;
}