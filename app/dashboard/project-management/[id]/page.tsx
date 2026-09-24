import { SetBreadcrumb } from "@/components/set-breadcrumb";
import { getProjectById } from "@/lib/actions/projects";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProjectKanban } from "./project-kanban";
import { auth } from "@clerk/nextjs/server";
import { getCurrentSupabaseUserId } from "@/lib/actions/users";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const project = await getProjectById(id).catch(() => null);

    if (!project?.contacts) {
        return { title: "Project Board" };
    }

    return {
        title: `${project.contacts.short_name} - ${project.contacts.name}`,
    };
}
export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { userId, sessionClaims } = await auth();
    if (!userId) redirect("/");
    const role = (sessionClaims?.metadata as { role?: string })?.role;
    const isAdmin = role === "admin";
    const currentUserId = await getCurrentSupabaseUserId();
    if (!currentUserId) redirect("/");
    const project = await getProjectById(id).catch(() => null);
    if (!project) notFound();

    return (
        <div className="@container/main flex-1 h-full py-2 gap-4 md:py-4 px-2 lg:px-4">
            <SetBreadcrumb segment={id} label={project.contacts?.short_name ?? "Project"} />
            <ProjectKanban project={project} isAdmin={isAdmin} currentUserId={currentUserId}/>
        </div>
    );
}
