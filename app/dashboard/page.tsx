
import { DashboardClient } from "@/components/dashboard-components/dashboard-client";
import { logDailyActivity } from "@/lib/actions/dashboard";
import { getCurrentSupabaseUserId } from "@/lib/actions/users";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Overview",
};

export default async function DashBoard() {
  const { userId: clerkUserId, sessionClaims } = await auth();
  if (!clerkUserId) return null;

  const role = (sessionClaims?.metadata as any)?.role;

  const supabaseUserId = await getCurrentSupabaseUserId();
  logDailyActivity();

  return (
    <DashboardClient/>
  )
}