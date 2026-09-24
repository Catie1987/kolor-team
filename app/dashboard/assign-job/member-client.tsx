"use client";

import type { UserMember } from "@/lib/actions/users";
import {
  InputGroup, InputGroupAddon, InputGroupInput,
} from "@/components/ui/input-group";
import { useLoadingRouter } from "@/hooks/use-loading-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Pencil, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  FlexRender,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type Row,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DialogEditMember } from "./dialog-edit-member";
import { employmentTypeOptions } from "@/lib/helper";

const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
})


const columnHelper = createColumnHelper<typeof features, UserMember>();

interface MemberProps {
    members: UserMember[];
}

function FilterTableRow({
  row,
}: {
  row: Row<typeof features, UserMember>
}) {
  return (
    <TableRow
      className="relative z-0"
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} className={cn(cell.column.id === "email" && "whitespace-normal")}>
          <FlexRender cell={cell} />
        </TableCell>
      ))}
    </TableRow>
  )
}

export function MemberClient({members}: MemberProps) {
    const router = useLoadingRouter();
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState<UserMember[]>(members);
    const [editingMember, setEditingMember] = useState<UserMember | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const handleEdit = (member: UserMember) => {
        setEditingMember(member);
        setEditDialogOpen(true);
    };
    
    const onRefresh = (updatedMember: UserMember) => {
        setUsers((prev) =>
            prev.map((user) =>
            user.id === updatedMember.id
            ? updatedMember
            : user
            )
        );
    };

    const filteredUsers = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return users;
        return users.filter(
            (u) =>
                u.fullName.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q)
        );
    }, [users, search]);

    const columns = useMemo(
        () => columnHelper.columns([
            columnHelper.display({
                id: "userId",
                header: () => null,
                cell: ({ row }) => <span className="sr-only">{row.original.id}</span>,
            }),
            columnHelper.accessor("role", {
                id: "role",
                header: () => (
                        <div className="pl-2">
                            Role
                        </div>
                    ),
                cell: ({ row }) => (
                    <div className={cn("border px-3 rounded-full w-full flex justify-center select-none", row.original.role === "admin" ? "bg-primary text-card border-none": "bg-card")}>
                        <span className="capitalize text-[14px]">{row.original.role}</span>
                    </div>
                )
            }),
            columnHelper.accessor("email", {
                id: "email",
                header: () => (
                        <div className="pl-2 min-w-60 w-full">
                            User
                        </div>
                    ),
                cell: ({ row }) => (
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="">
                            <AvatarImage src={row.original.imageUrl} alt={row.original.fullName ?? ""} />
                            <AvatarFallback className="rounded-lg">K</AvatarFallback>
                        </Avatar>
                        <div className="grid text-left text-sm leading-tight select-none">
                            <span className="truncate font-medium">{row.original.fullName}</span>
                            <span className="truncate text-xs text-muted-foreground">
                                {row.original.email}
                            </span>
                        </div>
                    </div>
                )
            }),
            columnHelper.accessor("employmentType", {
                header: "Employment Type",
                cell: ({ row }) => {
                    const option = employmentTypeOptions.find(
                        (item) => item.value === row.original.employmentType
                    );

                    return (
                    <div className="text-sm">
                        {option ? (
                            <span className="text-foreground">
                                {option.label}
                            </span>
                        ) : (
                            <span className="text-muted-foreground">Not assigned yet</span>
                        )}
                    </div>
                    )}
            }),
            columnHelper.accessor("position", {
                header: "Position",
                cell: ({ row }) => (
                    <div className="text-sm">
                        {row.original.position ? (
                        <span className="text-foreground">
                             {row.original.position}
                        </span>
                        ) : (
                        <span className="text-muted-foreground">
                             Not assigned yet
                        </span>
                        )}
                    </div>
                )
            }),
            columnHelper.accessor("workingHour", {
                header: "Working Hour",
                cell: ({ row }) => (
                    <div className="text-sm">
                        {row.original.workingHour ? (
                            <span className="text-foreground">{row.original.workingHour}</span>
                        ): (
                            <span className="text-muted-foreground">-- : --</span>
                        )}
                    </div>
                )
            }),
            columnHelper.display({
                id: "actions",
                cell: ({row}) => (
                    <Button 
                        variant="outline" size="icon-sm" className="bg-card hover:bg-muted"
                        onClick={() => handleEdit(row.original)}
                    >
                        <Pencil/>
                    </Button>
                ),
            })
        ]), [])

        const table = useTable({
            features,
            data: filteredUsers,
            columns,
            getRowId: (row) => row.id.toString(),
        })
    return (
        <div className="flex flex-col w-full h-full gap-4">
            <div className="flex items-center gap-2 bg-background w-full">
                <Button variant={"outline"} className="gap-1 group hover:cursor-pointer border-none w-fit" onClick={() => router.back()}>
                    <ChevronLeft className="w-4 h-4 aspect-square group-hover:-translate-x-1 transform transition"/>
                    <p className="text-sm">Back</p>
                </Button>
                <InputGroup className="w-full bg-card shadow-sm">
                    <InputGroupInput
                        placeholder="Search name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <InputGroupAddon>
                        <Search />
                    </InputGroupAddon>
                    <InputGroupAddon align="inline-end">
                        {users.length} {users.length === 1 ? "user" : "users"}
                    </InputGroupAddon>
                </InputGroup>
            </div>
            <div className="min-h-20 w-full bg-card border rounded-lg shadow-md overflow-hidden">
                <Table>
                    <TableHeader className="sticky top-0 z-10">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="hover:bg-primary/20 bg-primary/10">
                            {headerGroup.headers.map((header) => {
                                return (
                                <TableHead key={header.id} colSpan={header.colSpan} 
                                    className={cn(
                                    header.column.id === "userId" ? "w-1" : "",
                                    header.column.id === "role" ? "w-22" : "",
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
                    <TableBody className="">
                        {table.getRowModel().rows?.length ? (
                            <>
                            {table.getRowModel().rows.map((row) => (
                                    <FilterTableRow key={row.id} row={row}/>
                                ))}
                            </>
                        ): (
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
            <DialogEditMember
                member={editingMember}
                open={editDialogOpen}
                onOpenChange={(open) => {
                    setEditDialogOpen(open);
                    if (!open) setEditingMember(null);
                }}
                onSaved={onRefresh}
            />
        </div>
    )
}