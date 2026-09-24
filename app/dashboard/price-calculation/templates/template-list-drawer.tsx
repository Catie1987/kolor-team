"use client"
import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CalculationTemplate, CalculationTemplateData, deleteCalculationTemplate, getCalculationTemplates } from "@/lib/actions/calculation-templates";
import { FileText, Trash2, ArrowBigRight, Plus, Equal, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user-components/user-avatar";
import { computeTemplateMetrics } from "@/lib/actions/template-metrics";

const PAGE_SIZE = 10;

interface LoadTemplateDrawerProps {
    onApply: (data: CalculationTemplateData) => void;
}

export function TemplateListDrawer({ onApply }: LoadTemplateDrawerProps) {
    const { userId: currentUserId } = useAuth();
    const [open, setOpen] = useState(false);
    const [templates, setTemplates] = useState<CalculationTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [memberFilter, setMemberFilter] = useState("all");
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (open) {
            setLoading(true);
            getCalculationTemplates()
                .then(setTemplates)
                .finally(() => setLoading(false));
        }
    }, [open]);
    useEffect(() => {
        setPage(1);
    }, [memberFilter]);
    const members = useMemo(() => {
        const map = new Map<string, { id: string; fullName: string; imageUrl: string }>();
        for (const t of templates) {
            if (t.creator && !map.has(t.creator.id)) {
                map.set(t.creator.id, {
                    id: t.creator.id,
                    fullName: t.creator.fullName,
                    imageUrl: t.creator.imageUrl,
                });
            }
        }
        return Array.from(map.values());
    }, [templates]);

    const filteredTemplates = useMemo(() => {
        if (memberFilter === "all") return templates;
        return templates.filter((t) => t.creator?.id === memberFilter);
    }, [templates, memberFilter]);

    const totalPages = Math.max(Math.ceil(filteredTemplates.length / PAGE_SIZE), 1);
    const paginatedTemplates = filteredTemplates.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleApply = (template: CalculationTemplate) => {
        onApply(template.data);
        setOpen(false);
    };

    const handleDelete = async (id: string) => {
        await deleteCalculationTemplate(id);
        setTemplates((prev) => prev.filter((t) => t.id !== id));
    };
    
    return (
        <Drawer showSwipeHandle open={open} onOpenChange={setOpen}>
            <DrawerTrigger render={
                <Button variant="outline">
                    <FileText/>
                    View template
                </Button>
            } />
            <DrawerContent>
                <DrawerHeader>
                    <div className="flex justify-between mb-2 sm:flex-row flex-col gap-y-1">
                        <div className="flex items-center flex-col">
                                <span className="text-primary text-base font-medium">Saved Template</span>
                                <span className="text-muted-foreground">Shared calculation across your team</span>
                        </div>
                        {totalPages > 1 && (
                            <div className="flex item-center">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                            className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <PaginationItem key={i}>
                                            <PaginationLink
                                                isActive={page === i + 1}
                                                onClick={() => setPage(i + 1)}
                                                className="cursor-pointer"
                                            >
                                                {i + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                            className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                            </div>
                        )}
                    </div>
                </DrawerHeader>
                <div className="px-4 pb-4 overflow-y-auto h-[90vh]">
                    {loading && <p className="text-sm text-muted-foreground py-4 mx-auto text-center">Loading...</p>}
                    {!loading && templates.length === 0 && (
                        <p className="text-sm text-muted-foreground py-4 max-auto text-center">No templates saved yet.</p>
                    )}
                    {!loading && templates.length > 0 && (
                        <Table className="mb-5">
                            <TableHeader>
                                <TableRow className="bg-muted hover:bg-muted border">
                                    <TableHead className="w-10">
                                        <Select value={memberFilter} onValueChange={(v) => v && setMemberFilter(v)}>
                                            <SelectTrigger className="h-7 w-auto border-none shadow-none px-1"/>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectItem value="all">All members</SelectItem>
                                                    {members.map((m) => (
                                                        <SelectItem key={m.id} value={m.id}>
                                                            {m.fullName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>                                        
                                    </TableHead>
                                    <TableHead className="w-36 border-r">Template</TableHead>
                                    <TableHead className="border-r">Item</TableHead>
                                    <TableHead className="w-14 border-r">Buying</TableHead>
                                    <TableHead className="w-14 border-r">Qty</TableHead>
                                    <TableHead className="text-center w-40 border-r">Route</TableHead>
                                    <TableHead className="text-center">Cost of Goods</TableHead>
                                    <TableHead className="text-right w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="border-b">
                                {paginatedTemplates.map((template) => {
                                    const metrics = computeTemplateMetrics(template.data);
                                    const isOwner = template.creator?.id === currentUserId;
                                    return(
                                    <TableRow key={template.id} className="hover:bg-transparent">
                                        <TableCell className="border-l">
                                            <UserAvatar user={template.creator} size="sm" />
                                        </TableCell>
                                        <TableCell className="border-r select-none">
                                            <Button variant={"link"} onClick={() => handleApply(template)} className="text-foreground w-fit text-left p-0 h-5">
                                                {template.name}
                                            </Button>
                                            
                                            {template.description && (
                                                <p className="text-xs text-muted-foreground truncate w-30">{template.description}</p>
                                            )}
                                        </TableCell>
                                        <TableCell className="border-r select-none">
                                            <div className="flex items-center gap-1.5">
                                                <Button variant={"link"}
                                                onClick={() => handleApply(template)} 
                                                className="text-sm font-medium text-foreground w-fit text-left p-0 h-5">
                                                    {metrics.firstItemName}
                                                </Button>
                                                {metrics.extraItemCount > 0 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{metrics.extraItemCount}
                                                    </Badge>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {template.data.planType === "single" && "One item with many MOQ"}
                                                {template.data.planType === "multiple" && "Many items in one shipment"}
                                                {template.data.planType === "combine" && "Combine with other shipment"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right text-sm border-r">
                                            ${metrics.firstItemPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-right border-r">
                                            {metrics.quantityLabel}
                                        </TableCell>
                                        <TableCell className="border-r">
                                            <div className="flex items-center gap-1.5">
                                                <p>
                                                    {template.data.origin ? template.data.origin : "Oversea"} 
                                                </p>
                                                <ArrowBigRight className="w-4 h-4 aspect-square text-primary fill-primary"/>
                                                <Badge variant="secondary" className="capitalize text-xs">
                                                    {template.data.transportType} · {template.data.incoterm.toUpperCase()}
                                                </Badge>
                                                <ArrowBigRight className="w-4 h-4 aspect-square text-primary fill-primary"/>
                                                <Badge variant="outline" className="capitalize text-xs">
                                                    {template.data.warehouseType} Warehouse
                                                </Badge>
                                                <ArrowBigRight className="w-4 h-4 aspect-square text-primary fill-primary"/>
                                                <p className="text-xs">
                                                    {template.data.customerType === "epe" ? "EPE customer" : "Non-EPE customer"} 
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col gap-1 text-xs items-center">
                                                    <span className="text-muted-foreground">Freight & Import</span>
                                                    <p>${metrics.firstItemIncotermShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                </div>
                                                <Plus className="text-primary/70 w-4 h-4 aspect-square stroke-3"/>
                                                <div className="flex flex-col gap-1 text-xs items-center">
                                                    <span className="text-muted-foreground">Warehouse In & Charges</span>
                                                    <p>${metrics.firstItemWarehouseInOperation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                </div>
                                                <Equal className="text-primary/70 w-4 h-4 aspect-square stroke-3"/>
                                                <p className="text-primary">
                                                    ${metrics.firstItemCOG.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right border-r w-10">
                                            <div className="flex items-center justify-center w-10">
                                                {isOwner && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(template.id)}
                                                    className="text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    )
}