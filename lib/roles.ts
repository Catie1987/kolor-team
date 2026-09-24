// lib/roles.ts
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function requireRole(
  allowed: ("admin" | "staff")[],
  redirectTo: string = "/"
) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as any)?.role;

  if (!userId || !role || !allowed.includes(role)) {
    redirect(redirectTo);
  }

  return { userId, role };
}

export async function requireAdmin(redirectTo: string = "/") {
  return requireRole(["admin"], redirectTo);
}