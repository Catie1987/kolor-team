"use client"
import { getProjects, Project, updateProject } from "@/lib/actions/projects";
import {
  useTable,
  createColumnHelper,
  tableFeatures,
  FlexRender,
  columnVisibilityFeature,
  type Row,
  columnFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  SortingState,
  sortFn_alphanumeric,
  sortFn_text,
  sortFn_datetime,
  filterFn_includesString,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { TriangleAlert, TriangleDashed, Triangle, Rocket, Loader, CheckCircle2, Clock, XCircle, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, ArrowUp, ArrowDown, ArrowUpDown, EllipsisVertical } from "lucide-react";
import { toast } from "@/components/ui/toast";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-components/user-avatar";
import { GroupAvatar } from "@/components/user-components/group-avatar";
import { format } from "date-fns";
import { formatProjectId } from "@/lib/helper";
import { useLoadingRouter } from "@/hooks/use-loading-router";
import { DialogTask } from "./dialog-task";
import { requestToJoinProject, getMyPendingJoinRequestProjectIds } from "@/lib/actions/notifications";


interface ProjectListViewProps {
    search: string;
    refreshKey: number;
    statusFilter: string;
    onSelectProject: (project: Project) => void;
    onEditProject: (project: Project) => void;
    onDeleteProject: (project: Project) => void;
    onResultCountChange: (count: number) => void;
    currentUserId: string;
    isAdmin: boolean;
}

const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    datetime: sortFn_datetime,
  },
  filterFns: {
    includesString: filterFn_includesString,
  },
})
const columnHelper = createColumnHelper<typeof features, Project>();

export const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
    just_started: {
        label: "Just Started",
        icon: Rocket,
        className: "text-blue-600",
    },
    in_progress: {
        label: "In Progress",
        icon: Loader,
        className: "text-muted-foreground",
    },
    success: {
        label: "Success",
        icon: CheckCircle2,
        className: "text-green-600",
    },
    pending: {
        label: "Pending",
        icon: Clock,
        className: "text-amber-600",
    },
    drop: {
        label: "Drop",
        icon: XCircle,
        className: "text-red-600",
    },
};


const priorityConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
    high: { label: "High", icon: TriangleAlert, className: "text-red-600 bg-red-50 border-red-200 hover:bg-red-100 hover:text-red-600 data-popup-open:bg-red-100 data-popup-open:text-red-600" },
    medium: { label: "Medium", icon: Triangle, className: "text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100 hover:text-orange-600 data-popup-open:bg-orange-100 data-popup-open:text-orange-600" },
    low: { label: "Low", icon: TriangleDashed, className: "text-muted-foreground bg-card border-border hover:border-muted-foreground/50 data-popup-open:bg-card data-popup-open:text-muted-foreground" },
};

const pricingLabels: Record<string, string> = {
    monthly: "/month",
    yearly: "/year",
    one_time: " one-time",
};

function FilterTableRow({
  row,
}: {
  row: Row<typeof features, Project>
}) {
  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} className={cn(cell.column.id === "description" && "whitespace-normal")}>
          <FlexRender cell={cell} />
        </TableCell>
      ))}
    </TableRow>
  )
}

function buildTeamMembers(project: Project) {
    const members: { id: string; fullName: string; email: string; imageUrl: string }[] = [];
    if (project.leader) {
        members.push({
            id: project.leaderId,
            fullName: project.leader.fullName,
            email: project.leader.email,
            imageUrl: project.leader.imageUrl,
        });
    }
    project.participants?.forEach((p, i) => {
        members.push({
            id: project.participantIds[i],
            fullName: p.fullName,
            email: p.email,
            imageUrl: p.imageUrl,
        });
    });
    return members;
}

export function ProjectListView({ 
    search, 
    statusFilter,
    refreshKey,
     onSelectProject, 
     onEditProject,
     onDeleteProject,
     onResultCountChange, 
     currentUserId, 
     isAdmin 
    }: ProjectListViewProps){
    const router = useLoadingRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [sorting, setSorting] = useState<SortingState>([
        { id: "startedAt", desc: true },
    ]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    })
    const [quickTaskProject, setQuickTaskProject] = useState<Project | null>(null);
    const [quickTaskDialogOpen, setQuickTaskDialogOpen] = useState(false);
    const [pendingRequestIds, setPendingRequestIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        setLoading(true);
        getProjects()
            .then(setProjects)
            .finally(() => setLoading(false));
    }, [refreshKey]);

    // Reset to page 1 whenever search changes
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
            return projects.filter((p) => {
                const matchesSearch =!q ||
                [
                    formatProjectId(p.projectNumber),
                    p.contacts?.name,
                    p.contacts?.short_name,
                    p.description,
                    p.leader?.fullName,
                ]
                .filter(Boolean)
                .some((field) => field!.toLowerCase().includes(q));
                const matchesStatus =
                statusFilter === "all" ||
                p.status === statusFilter;
                return matchesSearch && matchesStatus;
            });
    }, [projects, search, statusFilter]);

    useEffect(() => {
        onResultCountChange?.(filtered.length);
    }, [filtered.length, onResultCountChange]);

    useEffect(() => {
        getMyPendingJoinRequestProjectIds().then((ids) => setPendingRequestIds(new Set(ids)));
    }, [refreshKey]);

    const handlePriorityChange = async (projectId: string, newPriority: string) => {
        const previous = projects;
        // Optimistic update
        setProjects((prev) =>
            prev.map((p) => (p.id === projectId ? { ...p, priority: newPriority as any } : p))
        );
        try {
            await updateProject(projectId, { priority: newPriority as any });
            toast.add({
                type: "info",
                title: "Priority Change",
                description: `Your project's priority has been set to ${newPriority}.`,
            });
        } catch (err) {
            setProjects(previous); // revert on failure
            // toast.error("Could not update priority.");
        }
    };

    const handleStatusChange = async (projectId: string, newStatus: string) => {
        const previous = projects;
        setProjects((prev) =>
            prev.map((p) => (p.id === projectId ? { ...p, status: newStatus as any } : p))
        );
        try {
            await updateProject(projectId, { status: newStatus as any });
            // toast.success("Status updated.");
        } catch (err) {
            setProjects(previous);
            // toast.error("Could not update status.");
        }
    };

    const handleRequestToJoin = async (projectId: string) => {
        try {
            await requestToJoinProject(projectId);
            setPendingRequestIds((prev) => new Set(prev).add(projectId));
            toast.add({ type: "success", title: "Request sent", description: "The project leader will review your request." });
        } catch (err) {
            toast.add({ type: "error", title: "Error", description: err instanceof Error ? err.message : "Could not send request." });
        }
    };

    const columns = useMemo(
        () => columnHelper.columns([
        
        columnHelper.accessor((row) => formatProjectId(row.projectNumber), {
            id: "projectId",
            // header: "Project ID",
            header: () => (
                <div className="w-14">
                    Project ID
                </div>
            ),
            cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
            enableHiding: false,
        }),
        columnHelper.accessor((row) => row.contacts?.name, {
            id: "customer",
            header: ({column}) => {
                const sorted = column.getIsSorted();
                return(
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto text-sm p-0 hover:bg-transparent"
                        onClick={() => column.toggleSorting(sorted === "asc")}
                    >
                        Customer
                        {sorted === "asc" ? (
                            <ArrowUp className="ml-1 size-3.5" />
                        ) : sorted === "desc" ? (
                            <ArrowDown className="ml-1 size-3.5" />
                        ) : (
                            <ArrowUpDown className="ml-1 size-3.5 text-muted-foreground" />
                        )}
                    </Button>
                )
            },
            cell: (info) => {
                const contact = info.row.original.contacts;
                if (!contact) return "—";
                return (
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm truncate max-w-60">{contact.name}</span>
                    </div>
                );
            },
            sortFn: 'alphanumeric', 
        }),
        columnHelper.accessor("description", {
            id: "description",
            header: "Description",
            cell: (info) => (
                <p className="text-xs text-muted-foreground w-56 overflow-hidden">
                    <span className="line-clamp-2">
                        {info.getValue() || "—"}
                    </span>
                </p>
            ),
        }),
        columnHelper.display({
            id: "value",
            header: "Value",
            cell: (info) => {
                const p = info.row.original;
                return (
                    <div className="flex flex-col">
                        <p className="text-xs font-medium whitespace-nowrap">
                            {p.currency} {p.pricingValue.toLocaleString()}
                        </p>
                        <span className="text-xs text-muted-foreground font-normal">
                            {pricingLabels[p.pricingModel]}
                        </span>
                    </div>
                );
            },
        }),
        columnHelper.accessor("priority", {
            header: "Priority",
            cell: ({ row, getValue }) => {
                const value = getValue();
                const config = priorityConfig[value];
                const Icon = config.icon;
                const leaderId = row.original.leaderId;
                const isOwner = currentUserId === leaderId;
                const canManageProject = isOwner || isAdmin;
                return (
                    <div className="w-24">
                        {canManageProject ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger className="" render={
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn("h-7 gap-1.5 border hover:shadow-xs", config.className)}
                                >
                                    <Icon className="size-3.5" />
                                    {config.label}
                                </Button>
                            } />
                            <DropdownMenuContent align="start">
                                {Object.entries(priorityConfig).map(([key, cfg]) => {
                                    const ItemIcon = cfg.icon;
                                    return (
                                        <DropdownMenuItem
                                            key={key}
                                            onClick={() => {
                                                if (key !== value) handlePriorityChange(row.original.id, key);
                                            }}
                                        >
                                            <ItemIcon className="size-3.5" />
                                            {cfg.label}
                                        </DropdownMenuItem>
                                    );
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        ) : (
                            <div className={cn("bg-card select-none flex gap-1.5 h-7 text-xs items-center px-2 rounded-md",
                                value === "high" && "text-red-600 bg-red-50",
                                value === "medium" && "text-orange-600 bg-orange-50",
                                value === "low" && "text-muted-foreground bg-muted",
                            )}>
                                <Icon className="size-3.5" />
                                {config.label}
                            </div>    
                        )}
                    </div>
                );
            },
        }),
        columnHelper.accessor("status", {
            header: "Status",
            cell: ({ row, getValue }) => {
                const value = getValue();
                const config = statusConfig[value];
                const Icon = config.icon;
                const leaderId = row.original.leaderId;
                const isOwner = currentUserId === leaderId;
                const canManageProject = isOwner || isAdmin;
                return (
                    <div className="w-30">
                    {canManageProject ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger render={
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn("h-7 gap-1.5 border rounded-full px-3 bg-card hover:bg-muted/50")}
                                >
                                    <Icon className={cn("size-3.5", config.className)} />
                                    <span className='text-muted-foreground'>{config.label}</span>
                                </Button>
                            } />
                            <DropdownMenuContent align="start">
                                {Object.entries(statusConfig).map(([key, cfg]) => {
                                    const ItemIcon = cfg.icon;
                                    return (
                                        <DropdownMenuItem
                                            key={key}
                                            onClick={() => {
                                                if (key !== value) handleStatusChange(row.original.id, key);
                                            }}
                                        >
                                            <ItemIcon className="size-3.5" />
                                            {cfg.label}
                                        </DropdownMenuItem>
                                    );
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="bg-card select-none flex gap-1.5 h-7 text-xs items-center px-2 rounded-full">
                            <Icon className={cn("size-3.5", config.className)} />
                            <span className='text-muted-foreground -mt-[1px]'>{config.label}</span>
                        </div>
                    )}
                    </div>
                );
            },
            filterFn: (row, columnId, value) => {
                if (value === "all") return true;
                return row.getValue(columnId) === value;
            },
        }),
        columnHelper.display({
            id: "teamAndDate",
            header: "Project Team",
            cell: ({ row }) => {
                const leader = row.original.leader;
                const participants = row.original.participants ?? [];
                return (
                    <div className="w-24">
                        <div className="flex items-end gap-2">
                            {leader && (
                                <UserAvatar
                                    user={leader}
                                    size="md"
                                    className="ring-2 aspect-square ring-primary ring-offset-1 ring-offset-background rounded-full size-8"
                                />
                            )}
                            {participants.length > 0 && (
                                <div className="-translate-x-3">
                                    <GroupAvatar users={participants} max={2} size="sm" />
                                </div>
                            )}
                            {participants.length === 0 && (
                                <span className="text-muted-foreground text-xs">—</span>
                            )}
                        </div>
                    </div>
                )
            }
        }),
        columnHelper.accessor("startedAt", {
            header: ({ column }) => {
                const sorted = column.getIsSorted(); // false | "asc" | "desc"
                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto text-sm p-0 hover:bg-transparent"
                        onClick={() => column.toggleSorting(sorted === "asc")}
                    >
                        Date
                        {sorted === "asc" ? (
                            <ArrowUp className="ml-1 size-3.5" />
                        ) : sorted === "desc" ? (
                            <ArrowDown className="ml-1 size-3.5" />
                        ) : (
                            <ArrowUpDown className="ml-1 size-3.5 text-muted-foreground" />
                        )}
                    </Button>
                );
            },
            cell: ({ getValue }) => {
                const value = getValue();
                if (!value) return <span className="text-muted-foreground text-xs">—</span>;
                return (
                    <div className="flex flex-col">
                        <p className='text-xs font-medium'>Date start</p>
                        {value && (
                            <span className="text-xs text-muted-foreground">
                                {format(new Date(value), "dd-MMM-yyyy")}
                            </span>
                        )}
                    </div>
                );
            },
            sortFn: 'datetime',
        }),
        columnHelper.display({
            id: "actions",
            cell: ({ row }) => {
                const project = row.original;
                const leaderId = row.original.leaderId;
                const isOwner = currentUserId === leaderId;
                const isParticipant = project.participantIds.includes(currentUserId);
                const canManageProject = isOwner || isAdmin;
                const canAddTask = isOwner || isAdmin || isParticipant;
                return (
                <DropdownMenu>
                    <DropdownMenuTrigger render={
                        <Button
                            variant="ghost"
                            className="flex size-8 text-muted-foreground data-[state=open]:bg-muted rounded-sm"
                            size="icon"
                        >
                            <EllipsisVertical />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    }/>
                    <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/project-management/${row.original.id}`)}>
                            View Detail
                        </DropdownMenuItem>
                        {canAddTask && (
                            <DropdownMenuItem
                                onClick={() => {
                                    setQuickTaskProject(project);
                                    setQuickTaskDialogOpen(true);
                                }}
                            >
                                Quick Task
                            </DropdownMenuItem>
                        )}
                        {!canManageProject && !isParticipantOrLeader(row.original, currentUserId) && (
                            <DropdownMenuItem
                                disabled={pendingRequestIds.has(row.original.id)}
                                onClick={() => handleRequestToJoin(row.original.id)}
                            >
                                {pendingRequestIds.has(row.original.id) ? "Request Pending" : "Request to Join"}
                            </DropdownMenuItem>
                        )}
                        
                        {canManageProject && (
                            <>
                                <DropdownMenuItem onClick={() => onEditProject(row.original)}>
                                    Edit Project
                                </DropdownMenuItem>
                                <DropdownMenuSeparator/>
                                <DropdownMenuItem variant="destructive" onClick={() => onDeleteProject(row.original)}>Delete</DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>  
                </DropdownMenu>
            )}
        }),
    ]), [projects, currentUserId, isAdmin, onSelectProject, onEditProject, onDeleteProject, pendingRequestIds])

    const table = useTable({
        features,
        data: filtered,
        columns,
        state: {
            sorting,
            // columnVisibility,
            // rowSelection,
            columnFilters,
            pagination,
        },
        getRowId: (row) => row.id.toString(),
        enableRowSelection: true,
        // onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        // onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
    })

    // const pageCount = table.getPageCount();

    return (
        <div className="min-h-32 w-full relative overflow-hidden flex flex-col">
            <div className="overflow-hidden border rounded-lg shadow-sm bg-card">
            <Table>
                <TableHeader className="sticky top-0 z-10 bg-card bg-muted/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-primary/20 bg-primary/10">
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan} 
                            className={cn(
                            header.column.id === "projectId" ? "w-20" : "",
                            header.column.id === "select" ? "w-8": "",
                            )}
                        >
                          {header.isPlaceholder ? null : (
                            <FlexRender header={header} />
                          )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {loading ? (
                    <TableRow className="hover:bg-transparent">
                        <TableCell
                            colSpan={columns.length}
                            className="h-20 text-center text-muted-foreground text-sm"
                        >
                            Loading...
                        </TableCell>
                    </TableRow>
                ): table.getRowModel().rows?.length ? (
                    <>
                        {table.getRowModel().rows.map((row) => (
                            <FilterTableRow key={row.id} row={row} />
                        ))}
                    </>
                ) : (
                    <TableRow className="hover:bg-transparent">
                        <TableCell
                            colSpan={columns.length}
                            className="h-20 text-center text-muted-foreground text-sm"
                        >
                            No results matched this search.
                        </TableCell>
                    </TableRow>
                )}
                
              </TableBody>
            </Table>
            </div>
            <div className="flex justify-between pt-4 gap-4 lg:px-6 px-0">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex bg-card hover:bg-card/30 rounded-sm shadow-sm"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">Go to first page</span>
                        <ChevronsLeft />
                    </Button>
                    <Button
                        variant="outline"
                        className="size-8 bg-card hover:bg-card/30 rounded-sm shadow-sm"
                        size="icon"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft />
                    </Button>
                    <Button
                        variant="outline"
                        className="size-8 bg-card hover:bg-card/30 rounded-sm shadow-sm"
                        size="icon"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight />
                    </Button>
                    <Button
                        variant="outline"
                        className="hidden size-8 lg:flex bg-card hover:bg-card/30 rounded-sm shadow-sm"
                        size="icon"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">Go to last page</span>
                        <ChevronsRight />
                    </Button>
                </div>
                <div className="flex w-fit items-center justify-center text-sm font-medium">
                    Page {table.state.pagination.pageIndex + 1} of{" "}
                    {/* {table.getPageCount()} */}
                    {table.getRowModel().rows.length === 0 ? 1 : table.getPageCount()}
                </div>
            </div>
            {quickTaskProject && (
                <DialogTask
                    projectId={quickTaskProject.id}
                    leaderId={quickTaskProject.leaderId}
                    teamMembers={buildTeamMembers(quickTaskProject)}
                    defaultStatus="todo"
                    open={quickTaskDialogOpen}
                    onOpenChange={(open) => {
                        setQuickTaskDialogOpen(open);
                        if (!open) setQuickTaskProject(null);
                    }}
                    onSaved={() => {
                        setQuickTaskDialogOpen(false);
                        setQuickTaskProject(null);
                        // No task list to refresh here since this is the project LIST view,
                        // not the kanban board — task is just created silently in the background
                    }}
                />
            )}
        </div>
    )
}

function isParticipantOrLeader(project: Project, userId: string) {
    return project.leaderId === userId || project.participantIds.includes(userId);
}