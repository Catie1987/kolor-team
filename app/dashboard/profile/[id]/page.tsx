import { auth, clerkClient } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { SetBreadcrumb } from "@/components/set-breadcrumb";
import PublicProfileView from "../public-profile-view";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId: currentUserId } = await auth();

  // Viewing your own profile via [id]? Just show your normal editable page.
  const client = await clerkClient();
  const targetUser = await client.users.getUser(id).catch(() => null);
  if (!targetUser) notFound();
  const displayName = [targetUser.firstName, targetUser.lastName].filter(Boolean).join(" ") || targetUser.id;
  return (
    <div className="@container/main flex flex-1 flex-col h-full py-2 md:py-4 overflow-y-auto no-scrollbar h-screen-main">
      <SetBreadcrumb segment={id} label={displayName} />
      <PublicProfileView user={targetUser} isOwner={currentUserId === id} />
    </div>
  );
}