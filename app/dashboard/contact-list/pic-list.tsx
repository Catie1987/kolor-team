"use client";
import { useState, useEffect, useMemo } from "react";
import {
  useTable,
  createColumnHelper,
  tableFeatures,
  FlexRender,
  columnVisibilityFeature,
  type ColumnVisibilityState,
  type Row,
} from "@tanstack/react-table";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button";
import { GripVertical, Pencil, Trash2, Mail, Phone, Plus, ChevronDown, Columns3, EllipsisVertical, Copy, Check } from "lucide-react";
import { getPics, deletePic, reorderPics, type Pic } from "@/lib/actions/pics";
import { DialogPic } from "./dialog-pic";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";

interface PicTableProps {
    contactId: string;
    contactName: string;
    refreshKey: number;
    onEdit: (pic: Pic) => void;
}

const features = tableFeatures({
    columnVisibilityFeature,
});
const columnHelper = createColumnHelper<typeof features, Pic>();

function DragHandle({ id }: { id: string }) {
    const { attributes, listeners } = useSortable({ id });
    return (
        <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground touch-none"
        >
            <GripVertical className="size-4 mt-1.5" />
            <span className="sr-only">Drag to reorder</span>
        </button>
    );
}

function DraggableRow({
  row,
}: {
  row: Row<typeof features, Pic>;
}) {
  const {
    transform,
    transition,
    setNodeRef,
    isDragging,
  } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      ref={setNodeRef}
      data-dragging={isDragging}
      className="data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
    {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          <FlexRender cell={cell} />
        </TableCell>
    ))}
    </TableRow>
  );
}

export function PicList({ contactId, contactName, refreshKey, onEdit }: PicTableProps) {
    const [pics, setPics] = useState<Pic[]>([]);
    const [loading, setLoading] = useState(true);
    const [picDialogOpen, setPicDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [editingPic, setEditingPic] = useState<Pic | undefined>(undefined);
    const [pendingDeletePic, setPendingDeletePic] = useState<Pic | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [picRefreshKey, setPicRefreshKey] = useState(0);
    const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({
        department: false,
        position: false,
    });
    
    const handleAddPic = () => {
        setEditingPic(undefined);
        setPicDialogOpen(true);
    };
    const handleEditPic = (pic: Pic) => {
        setEditingPic(pic);
        setPicDialogOpen(true);
    };
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    useEffect(() => {
        setLoading(true);
        getPics(contactId)
            .then(setPics)
            .finally(() => setLoading(false));
    }, [contactId, refreshKey, picRefreshKey]);

    const handleDelete = async (id: string) => {
        try {
            await deletePic(id);
            setPics((prev) => prev.filter((p) => p.id !== id));
            toast.add({
                type: "warning",
                title: "Deleted",
                description: "PIC removed successfully.",
            });
        } catch {
            toast.add({
                type: "error",
                title: "Error",
                description: "Could not remove PIC. Please try again.",
            });
        }
    };
    const handleCopyEmail = async (id: string, email?: string) => {
        if (!email) return;
        try {
            await navigator.clipboard.writeText(email);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
            toast.add({
                type: "success",
                title: "Success",
                description: `${email} copied to clipboard. You can paste it anywhere.`,
            });
        } catch {
            toast.add({
                type: "error",
                title: "Error",
                description: `Failed to copy ${email} to clipboard.`,
            });
        }
    };

    const columns = useMemo(
        () =>
            columnHelper.columns([
                columnHelper.display({
                    id: "drag",
                    header: () => null,
                    cell: ({ row }) => <DragHandle id={row.original.id} />,
                    enableHiding: false,
                }),
                columnHelper.accessor("title", {
                    header: "Title",
                    cell: ({ row }) => row.original.title || "—",
                }),
                columnHelper.accessor("fullName", {
                    header: "Full Name",
                    cell: ({ row }) => <span className="font-medium">{row.original.fullName}</span>,
                    enableHiding: false,
                }),
                columnHelper.accessor("department", {
                    header: "Department",
                    cell: ({ row }) => row.original.department || "—",
                }),
                columnHelper.accessor("position", {
                    header: "Position",
                    cell: ({ row }) => row.original.position || "—",
                }),
                columnHelper.accessor("mobileNumbers", {
                    header: "Mobile",
                    cell: ({ row }) => {
                        const numbers = row.original.mobileNumbers;
                        if (!numbers?.length) return "—";
                        return (
                            <div className="flex flex-col gap-1">
                                {numbers.map((num, i) => (
                                    <span key={i} className="text-xs flex items-center gap-1">
                                        <Phone className="size-3 text-muted-foreground" />
                                        {num}
                                    </span>
                                ))}
                            </div>
                        );
                    },
                }),
                columnHelper.accessor("email", {
                    header: "Email",
                    cell: ({ row }) => {
                        const email = row.original.email;
                        if (!email) return "—";
                        return (
                            <span className="text-xs flex items-center gap-1">
                                <Mail className="size-3 text-muted-foreground" />
                                {email}
                            </span>
                        );
                    },
                    enableHiding: false,
                }),
                columnHelper.display({
                    id: "actions",
                    cell: ({ row }) => {
                        const isCopied = copiedId === row.original.id;
                        return(
                        <DropdownMenu>
                            <DropdownMenuTrigger render={
                                <Button
                                    variant="ghost"
                                    className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
                                    size="icon"
                                >
                                    <EllipsisVertical />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            }/>
                            <DropdownMenuContent align="end" className="w-32">
                                <DropdownMenuItem onClick={() => handleCopyEmail(row.original.id, row.original.email)}>
                                {isCopied ? (
                                    <>
                                        <Check className="size-4 text-green-600" />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy className="size-4" />
                                        Copy Email
                                    </>
                                )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditPic(row.original)}>
                                    <Pencil className="size-4" />Edit PIC
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {/* <DropdownMenuItem variant="destructive" onClick={() => handleDelete(row.original.id)}>
                                    <Trash2 className="size-4" />Delete
                                </DropdownMenuItem> */}
                                <DropdownMenuItem variant="destructive" onClick={(e) => {
                                    e.preventDefault();
                                    setPendingDeletePic(row.original);
                                    setDeleteDialogOpen(true);
                                }}>
                                    <Trash2 className="size-4" />Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        )
                    },
                    enableHiding: false,
                }),
            ]),
        [onEdit, copiedId]
    );

    const table = useTable<typeof features, Pic>({
        features,
        columns,
        data: pics,
        getRowId: (row) => row.id,
        state: {
            columnVisibility,
        },
        onColumnVisibilityChange: setColumnVisibility,
    });

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = pics.findIndex((p) => p.id === active.id);
        const newIndex = pics.findIndex((p) => p.id === over.id);
        const reordered = arrayMove(pics, oldIndex, newIndex);

        setPics(reordered);

        try {
            await reorderPics(reordered.map((p) => p.id));
        } catch {
            // toast.error("Could not save new order.");
            setPics(pics);
        }
    };

    if (!contactId) return null;

    return (
        <div className="@container/card border rounded-lg shadow-sm min-h-40 bg-card p-4 flex flex-col">
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-normal">Person In Charge</h3>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger render={
                            <Button variant="outline" size="sm">
                                <Columns3 className="size-4" />
                                <span className="hidden lg:inline">Show Columns</span>
                                <span className="lg:hidden">Columns</span>
                                <ChevronDown className="size-4" />
                            </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-48">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                    >
                                        {column.columnDef.header as string}
                                    </DropdownMenuCheckboxItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="sm" variant="outline" onClick={handleAddPic}>
                        <Plus className="size-4" />
                        Add PIC
                    </Button>
                </div>
                <DialogPic
                    contactId={contactId}
                    contactName={contactName}
                    pic={editingPic}
                    open={picDialogOpen}
                    onOpenChange={setPicDialogOpen}
                    onSaved={() => setPicRefreshKey((k) => k + 1)}
                />
                <AlertDialog
                    open={deleteDialogOpen}
                    onOpenChange={(open) => {
                        setDeleteDialogOpen(open);
                        if (!open) setPendingDeletePic(null); // clear when dismissed/cancelled
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone and it will delete{" "}
                                <span className="font-medium text-foreground">{pendingDeletePic?.fullName}</span>
                                {pendingDeletePic?.email && (
                                    <> ({pendingDeletePic.email})</>
                                )}{" "}
                                from the PIC list.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                disabled={deleting}
                                onClick={async () => {
                                    if (!pendingDeletePic) return;
                                    setDeleting(true);
                                    try {
                                        await handleDelete(pendingDeletePic.id);
                                        setDeleteDialogOpen(false);
                                        setPendingDeletePic(null);
                                    } finally {
                                        setDeleting(false);
                                    }
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
            {loading ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    Loading...
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border mt-2">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <Table>
                        <TableHeader className="sticky top-0 z-10 bg-muted select-none">
                            {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder ? null : (
                                            <FlexRender header={header} />
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                        </TableHeader>
                        <SortableContext items={pics.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                            <TableBody className="**:data-[slot=table-cell]:first:w-8 **:data-[slot=table-cell]:last:w-8">
                                {table.getRowModel().rows.length > 0 ? (
                                    table.getRowModel().rows.map((row) => (
                                    <DraggableRow
                                        key={row.id}
                                        row={row}
                                    />
                                ))
                                ) : (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell
                                            colSpan={table.getAllColumns().length}
                                            className="h-24 text-center text-sm text-muted-foreground"
                                        >
                                            No PICs found. Click "Add PIC" to create one.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </SortableContext>
                    </Table>
                </DndContext>
                </div>
            )}
        </div>
    )
}

