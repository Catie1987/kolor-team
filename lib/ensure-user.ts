// lib/ensure-user.ts
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function ensureUserInSupabase() {
  const user = await currentUser();
  if (!user) return null;

  const email = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress ?? "";

  const role = (user.publicMetadata?.role as string) ?? "user";

  const { data, error } = await supabaseAdmin
    .from("users")
    .upsert(
      {
        clerk_user_id: user.id,
        email,
        first_name: user.firstName,
        last_name: user.lastName,
        role,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "clerk_user_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Failed to upsert Supabase user:", error);
    return null;
  }

  return data;
}