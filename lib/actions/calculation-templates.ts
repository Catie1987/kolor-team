// lib/calculation-templates.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { ShipmentItem } from "@/app/dashboard/price-calculation/item-list-field";
import { enrichWithClerkUser } from "@/lib/clerk/clerk-user-cache";

export type SaveTemplateResult =
    | { success: true; template: CalculationTemplate }
    | { success: false; reason: "limit_reached"; count: number };

export interface CalculationTemplateData {
    transportType: string;
    incoterm: string;
    planType: string;
    customerType: string;
    warehouseType: string;
    origin: string;
    items: ShipmentItem[];
    sharedName: string;
    combineQuantity: string;
    costs: Record<string, string>; 
    warehouseIn: string;
    warehouseOperation: string;
    warehouseOut: string;
}

export interface CalculationTemplate {
    id: string;
    name: string;
    description: string | null;
    user_id: string;
    data: CalculationTemplateData;
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
        role?: string;
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

export async function saveCalculationTemplate(
    name: string,
    description: string,
    data: CalculationTemplateData
): Promise<SaveTemplateResult> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const userId = await getSupabaseUserId(clerkUserId);

    const { count, error: countError } = await supabaseAdmin
        .from("calculation_templates")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

    if (countError) throw new Error(countError.message);

    if ((count ?? 0) >= 10) {
        return { success: false, reason: "limit_reached", count: count ?? 0 };
    }

    const { data: saved, error } = await supabaseAdmin
        .from("calculation_templates")
        .insert({ name, description: description || null, user_id: userId, data })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return { success: true, template: saved as CalculationTemplate };
}

export async function getCalculationTemplates() {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const { data, error } = await supabaseAdmin
        .from("calculation_templates")
        .select("*, users(clerk_user_id)")
        .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const rows = data.map((row) => ({ ...row, clerk_user_id: row.users?.clerk_user_id }));
    return enrichWithClerkUser(rows, "clerk_user_id", "creator") as Promise<CalculationTemplate[]>;
}

export async function deleteCalculationTemplate(id: string) {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const userId = await getSupabaseUserId(clerkUserId);

    const { error } = await supabaseAdmin
        .from("calculation_templates")
        .delete()
        .eq("id", id)
        .eq("user_id", userId); // only allow deleting your own templates
    
    if (error) throw new Error(error.message);
}