"use client"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { useMemo, useState } from "react";
import { categoryLabels, WarehouseFeeItem, warehouseFeesByType } from "@/lib/warehouse-fee-config";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface SheetWarehouseCostProps {
    trigger: React.ReactElement;
    onApply?: (result: { inboundTotal: number; operationTotal: number }) => void;
    warehouseType: string;
    transportType: string;
}

const relevantCategories = ["inbound", "operation"] as const;

export function SheetWarehouseCost({ 
    trigger,
    onApply,
    warehouseType,
    transportType
 }: SheetWarehouseCostProps) {
    const [open, setOpen] = useState(false);
    const [enabledOptional, setEnabledOptional] = useState<Record<string, boolean>>({});
    const [inputValues, setInputValues] = useState<Record<string, string>>({});

    const feeSet = warehouseFeesByType[warehouseType] ?? warehouseFeesByType.bonded;

    const getLineCost = (fee: WarehouseFeeItem): number => {
        if (fee.costByTransport) {
            return fee.costByTransport[transportType] ?? 0;
        }
        if (fee.inputs && fee.ratePerUnit) {
            const anyEntered = fee.inputs.some((_, idx) => inputValues[`${fee.label}-${idx}`]);
            if (!anyEntered) return 0;
            const product = fee.inputs.reduce(
                (acc, _, idx) => acc * (Number(inputValues[`${fee.label}-${idx}`]) || 0),
                1
            );
            return fee.ratePerUnit * product;
        }
        return fee.cost ?? 0;
    };
    

    const inboundTotal = useMemo(
        () => feeSet.categories.inbound.reduce((sum, fee) => sum + getLineCost(fee), 0),
        [feeSet, transportType, inputValues]
    );

    const operationTotal = useMemo(() => {
        let sum = feeSet.categories.operation.reduce((s, fee) => s + getLineCost(fee), 0);
        for (const fee of feeSet.categories.optional) {
            if (enabledOptional[fee.label]) sum += getLineCost(fee);
        }
        return sum;
    }, [feeSet, transportType, inputValues, enabledOptional]);

    const grandTotal = inboundTotal + operationTotal;

    const handleApply = () => {
        onApply?.({ inboundTotal, operationTotal });
        setOpen(false);
    };
    
    return (
        <Sheet 
        open={open}
        onOpenChange={setOpen}
        >
            <SheetTrigger render={trigger} />
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>{feeSet.title}</SheetTitle>
                    <SheetDescription>
                        {feeSet.description}
                    </SheetDescription>
                </SheetHeader>
                <div className="px-4 flex flex-col gap-4 flex-1 overflow-y-auto">
                    {relevantCategories.map((cat) => (
                        <div key={cat} className="flex flex-col gap-2">
                            <div className="w-full flex items-center justify-between">
                                <Badge className="tracking-wide">
                                    {categoryLabels[cat]}
                                </Badge>
                            </div>
                            <div className="flex flex-col gap-1">
                                {feeSet.categories[cat].map((fee, i) => {
                                    const lineCost = getLineCost(fee);
                                    return (
                                        <div key={fee.label + i}>
                                            <div className="flex items-start justify-between gap-3 py-2 flex-wrap">
                                                <div className={cn("flex flex-col gap-0.5")}>
                                                    <span className="text-sm">{fee.label}</span>
                                                    {fee.description && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {fee.description}
                                                        </span>
                                                    )}
                                                    {fee.inputs && (
                                                        <div className="flex items-center gap-4 relative">
                                                            <span className="absolute text-sm text-muted-foreground left-21">×</span>
                                                            {fee.inputs.map((dim, idx) => (
                                                                <InputGroup key={dim.label} className="w-20">
                                                                    <InputGroupInput
                                                                        type="number"
                                                                        min={0}
                                                                        placeholder="0"
                                                                        className="no-spinner"
                                                                        value={inputValues[`${fee.label}-${idx}`] ?? ""}
                                                                        onChange={(e) =>
                                                                            setInputValues((prev) => ({
                                                                                ...prev,
                                                                                [`${fee.label}-${idx}`]: e.target.value,
                                                                            }))
                                                                        }
                                                                    />
                                                                    <InputGroupAddon align="inline-end">
                                                                        <InputGroupText className="text-xs mt-0.5">
                                                                            {dim.unit}
                                                                        </InputGroupText>
                                                                    </InputGroupAddon>
                                                                </InputGroup>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                {fee.inputs ? (
                                                    <div className="flex flex-col mb-auto mt-0.5 shrink-0 gap-3">
                                                        <span className="text-xs text-muted-foreground font-normal">${fee.ratePerUnit} {fee.unit}</span>
                                                        <span className="text-sm font-medium whitespace-nowrap ml-auto">
                                                            ${lineCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            <span className="text-xs text-muted-foreground font-normal ml-1">
                                                                at cost
                                                            </span>
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-end shrink-0">
                                                        <span className="text-sm font-medium whitespace-nowrap">
                                                            {fee.costByTransport ? (
                                                                <>
                                                                    ${lineCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                    <span className="text-xs text-muted-foreground font-normal ml-1 capitalize">
                                                                        ({transportType})
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    ${lineCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                    <span className="text-xs text-muted-foreground font-normal">
                                                                        {fee.unit}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {i < feeSet.categories[cat].length - 1 && <div className="shrink-0 w-full h-[0.5px] bg-border"/>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                    <div className="flex flex-col gap-2">
                        <Badge className="tracking-wide">
                            {categoryLabels.optional}
                        </Badge>
                        <div className="flex flex-col gap-1 mt-2">
                            {feeSet.categories.optional.map((fee, i) => {
                                const isChecked = !!enabledOptional[fee.label];
                                const lineCost = getLineCost(fee);
                                return (
                                    <div key={fee.label}>
                                        <div className="flex flex-col gap-1 py-1">
                                            <div className="flex flex-row gap-2 items-center">
                                                <Checkbox
                                                    id={fee.label}
                                                    checked={isChecked}
                                                    onCheckedChange={(checked) =>
                                                        setEnabledOptional((prev) => ({
                                                            ...prev,
                                                            [fee.label]: checked === true,
                                                        }))
                                                    }
                                                    className="rounded-[4px]"
                                                />
                                                <Label htmlFor={fee.label} className="text-sm flex-1 min-w-32">{fee.label}</Label>
                                                {fee.inputs ? (
                                                    <span className="whitespace-nowrap text-muted-foreground text-xs">
                                                        ${fee.ratePerUnit}{fee.unit}
                                                    </span>
                                                ):( isChecked ? (
                                                    <span className="text-sm font-medium whitespace-nowrap ml-auto">
                                                        {fee.cost !== undefined ? `$${fee.cost.toLocaleString()}` : "—"}
                                                        <span className="text-xs text-muted-foreground font-normal">{fee.unit}</span>
                                                    </span>
                                                    ) : (
                                                        <span className="text-sm font-medium whitespace-nowrap ml-auto">—</span>
                                                    )
                                                )}
                                            </div>
                                            {fee.inputs ? (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        {fee.inputs.map((dim, idx) => (
                                                        <InputGroup key={dim.label} className="w-20">
                                                            <InputGroupInput
                                                                type="number"
                                                                min={0}
                                                                placeholder="0"
                                                                className="no-spinner"
                                                                disabled={!isChecked}
                                                                value={inputValues[`${fee.label}-${idx}`] ?? ""}
                                                                onChange={(e) =>
                                                                    setInputValues((prev) => ({
                                                                        ...prev,
                                                                        [`${fee.label}-${idx}`]: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                            <InputGroupAddon align="inline-end">
                                                                <InputGroupText className="text-xs">
                                                                    {dim.unit}
                                                                </InputGroupText>
                                                            </InputGroupAddon>
                                                        </InputGroup>
                                                    ))}
                                                    </div>
                                                    <span className="text-sm font-medium whitespace-nowrap ml-auto">
                                                        {isChecked ? `$${lineCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
                                                        {isChecked && (<span className="text-xs text-muted-foreground font-normal"> at cost</span>)}
                                                    </span>
                                                </div>
                                            ) : null}
                                            {i < feeSet.categories.optional.length - 1 && (
                                                <div className="shrink-0 w-full h-[0.5px] bg-border mt-2"/>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
                <SheetFooter>
                    <div>
                        <div className="shrink-0 w-full h-[0.5px] bg-border"/>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-base">Estimated total</span>
                            <span className="text-lg font-semibold">${grandTotal.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button onClick={handleApply}>Apply Cost</Button>
                        <SheetClose render={<Button variant="outline" className="flex-1">Cancel</Button>} />
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}