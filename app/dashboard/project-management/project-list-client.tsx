"use client"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Plus, Search } from "lucide-react";
import { ProjectListView, statusConfig } from "./project-list-view";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { DialogProject } from "./dialog-project";
import { useUser } from "@clerk/nextjs";
import { getCurrentSupabaseUserId } from "@/lib/actions/users";
import { Project } from "@/lib/actions/projects";
import { DialogDeleteProject } from "./dialog-delete-project";
import { cn } from "@/lib/utils";

export function ProjectListClient() {
    const { user } = useUser();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
    const [deletingProject, setDeletingProject] = useState<Project | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [projectDialogOpen, setProjectDialogOpen] = useState(false);
    const [resultCount, setResultCount] = useState(0);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (user) {
            getCurrentSupabaseUserId().then(setCurrentUserId);
        }
    }, [user]);

    const handleNewProject = () => {
        setProjectDialogOpen(true);
    };
    

    const isAdmin = (user?.publicMetadata?.role as string | undefined) === "admin";
    const currentUserName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";
    return (
        <div className="@container/main flex flex-col w-full h-full pb-4">
                <div className="flex flex-1 items-center gap-2 p-4 pb-2">
                    <InputGroup className="w-full bg-card shadow-sm">
                        <InputGroupInput 
                            placeholder="Search ID, Customer or Description,..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)} 
                        />
                        <InputGroupAddon>
                            <Search />
                        </InputGroupAddon>
                        <InputGroupAddon align="inline-end">
                            {resultCount} {resultCount === 1 ? "result" : "results"}
                        </InputGroupAddon>
                    </InputGroup>
                    <Button size="lg" onClick={handleNewProject} className="shadow-sm">
                        <Plus className="size-4" />
                        <span className="@xl/main:inline-flex hidden">New Project</span>
                    </Button>
                </div>
                <div className="flex items-center gap-2 px-4 pb-2 flex-wrap">
                    <Button
                        variant={statusFilter === "all" ? "default" : "outline"}
                        size="default"
                        onClick={() => setStatusFilter("all")}
                        className={cn("rounded-sm shadow-sm", statusFilter !== "all" && "bg-card")}
                    >
                        All
                    </Button>
                    {Object.entries(statusConfig).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                            <Button
                                key={key}
                                variant={statusFilter === key ? "default" : "outline"}
                                size="default"
                                className={cn("rounded-sm shadow-sm", statusFilter !== key && "bg-card")}
                                onClick={() => setStatusFilter(key)}
                                >
                                <Icon className={cn("mr-1 h-4 w-4", config.className, statusFilter === key && "text-card")} />
                                {config.label}
                            </Button>
                        );
                    })}
                </div>
                <div className="w-full h-full px-4">
                    <ProjectListView
                        search={search}
                        statusFilter={statusFilter}
                        refreshKey={refreshKey}
                        onSelectProject={(project) => {
                            // setSelectedProject(project);
                            // setDialogOpen(true);
                        }}
                        onEditProject={(project) => {
                            setEditingProject(project);
                            setProjectDialogOpen(true);
                        }}
                        onDeleteProject={(project) => {
                            setDeletingProject(project);
                            setDeleteDialogOpen(true);
                        }}
                        onResultCountChange={setResultCount}
                        currentUserId={currentUserId ?? ""}
                        isAdmin={isAdmin}
                    />
                </div>
            <DialogProject 
                project={editingProject}
                open={projectDialogOpen} 
                onOpenChange={(open) => {
                    setProjectDialogOpen(open);
                    if (!open) setEditingProject(undefined);
                }}
                currentUserId={currentUserId ?? ""}
                currentUserName={currentUserName}
                isAdmin={isAdmin}
                onSaved={() => {
                    setRefreshKey((k) => k + 1); // ← actually call it
                }}
            />
            <DialogDeleteProject
                project={deletingProject}
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    setDeleteDialogOpen(open);
                    if (!open) setDeletingProject(null);
                }}
                onDeleted={() => setRefreshKey((k) => k + 1)}
            />
        </div>
    )
}