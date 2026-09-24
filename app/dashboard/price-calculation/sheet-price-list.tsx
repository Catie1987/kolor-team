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
import { FeeItem, shipmentFeesByTransport } from "@/lib/shipment-fee-config";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"

interface SheetPriceListProps {
    trigger: React.ReactElement;
    transportType: string;
    onApply?: (total: number) => void;
}

export function SheetPriceList({ 
    trigger,
    transportType,
    onApply
 }: SheetPriceListProps) {
    const [open, setOpen] = useState(false);
    const feeSet = shipmentFeesByTransport[transportType] ?? shipmentFeesByTransport.air;
    const caseKeys = Object.keys(feeSet.cases);

    const [selectedCase, setSelectedCase] = useState(caseKeys[0]);
    const [isDG, setIsDG] = useState(false);
    const [cbm, setCbm] = useState("");
    const [coolWeight, setCoolWeight] = useState("");
    const [coolDays, setCoolDays] = useState("");
    const handleApply = () => {
        onApply?.(total);
        setOpen(false);
    };

    const getLineCost = (fee: FeeItem): number => {
        if (fee.label === "CFS fee" && fee.ratePerUnit) {
            return fee.ratePerUnit * (Number(cbm) || 0);
        }
        if (fee.label === "Cold storage fee" && fee.ratePerUnit) {
            return fee.ratePerUnit * (Number(coolWeight) || 0) * (Number(coolDays) || 0);
        }
        return fee.cost ?? 0;
    };

    const activeCase = feeSet.cases[selectedCase] ?? feeSet.cases[caseKeys[0]];
    const activeFees = isDG && feeSet.dgFees
        ? [...activeCase.fees, ...feeSet.dgFees]
        : activeCase.fees;

    const total = useMemo(
        () => activeFees.reduce((sum, fee) => sum + getLineCost(fee), 0),
        [activeFees, cbm, coolWeight, coolDays]
    );
    return (
        <Sheet
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);
                if (nextOpen) setSelectedCase(caseKeys[0]);
            }}
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
                    <div className="flex justify-between gap-2">
                        {caseKeys.length > 1 && (
                            <Tabs value={selectedCase} onValueChange={(v) => v && setSelectedCase(v)}>
                                <TabsList className="w-fit">
                                    {caseKeys.map((key) => (
                                        <TabsTrigger key={key} value={key} className="flex-1">
                                            {feeSet.cases[key].label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                        )}
                        <div className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                                id="isDG"
                                checked={isDG}
                                onCheckedChange={(checked) => setIsDG(checked === true)}
                                className="rounded-[4px]"
                            />
                            <Label htmlFor="isDG" className="cursor-pointer">
                                DG Cargo
                            </Label>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        {activeFees.map((fee, i) => {
                            const isCFS = fee.label === "CFS fee";
                            const isColdStorage = fee.label === "Cold storage fee";
                            const lineCost = getLineCost(fee);
                            return (
                            <div key={fee.label + i}>
                                {isCFS ? (
                                    <div className="flex items-center gap-3 py-2">
                                        <span className="text-sm">{fee.label}</span>
                                        <InputGroup className="w-20">
                                                <InputGroupInput 
                                                type="number"
                                                min={0}
                                                placeholder="0"
                                                className='no-spinner'
                                                value={cbm}
                                                onChange={(e) => setCbm(e.target.value)}
                                                />
                                            <InputGroupAddon align="inline-end">
                                                <InputGroupText className="text-xs mt-1">CBM</InputGroupText>
                                            </InputGroupAddon>
                                        </InputGroup>
                                        <span className="text-sm font-medium whitespace-nowrap ml-auto">
                                            ${lineCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            <span className="text-xs text-muted-foreground font-normal ml-1">
                                                (${fee.ratePerUnit}/CBM)
                                            </span>
                                        </span>
                                    </div>
                                ): isColdStorage ? (
                                    <div className="flex flex-col gap-1 py-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm">{fee.label}</span>
                                                <span className="text-xs text-muted-foreground">{fee.description}</span>
                                            </div>
                                            <div className="flex flex-col mb-auto mt-0.5 shrink-0">
                                                <span className="text-xs text-muted-foreground font-normal">${fee.ratePerUnit} {fee.unit}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <InputGroup className="w-20">
                                                <InputGroupInput
                                                    type="number"
                                                    min={0}
                                                    placeholder="0"
                                                    className='no-spinner'
                                                    value={coolWeight}
                                                    onChange={(e) => setCoolWeight(e.target.value)}
                                                />
                                                <InputGroupAddon align="inline-end">
                                                    <InputGroupText className="text-xs mt-1">kg</InputGroupText>
                                                </InputGroupAddon>
                                            </InputGroup>
                                            <span className="text-sm text-muted-foreground">×</span>
                                            <InputGroup className="w-20">
                                                <InputGroupInput
                                                    type="number"
                                                    min={0}
                                                    placeholder="0"
                                                    className='no-spinner'
                                                    value={coolDays}
                                                    onChange={(e) => setCoolDays(e.target.value)}
                                                />
                                                <InputGroupAddon align="inline-end">
                                                    <InputGroupText className="text-xs mt-1">days</InputGroupText>
                                                </InputGroupAddon>
                                            </InputGroup>
                                            <span className="text-sm font-medium whitespace-nowrap ml-auto">
                                                ${lineCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                <span className="text-xs text-muted-foreground font-normal ml-1">
                                                    at cost
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                ):(
                                    <div className="flex items-start justify-between gap-3 py-2">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm">{fee.label}</span>
                                            <span className="text-xs text-muted-foreground">{fee.description}</span>
                                        </div>
                                        <div className="flex flex-col items-end shrink-0">
                                            <span className="text-sm font-medium whitespace-nowrap">
                                                {fee.cost !== undefined ? `$${fee.cost.toLocaleString()}` : "—"}
                                                <span className="text-xs text-muted-foreground font-normal">{fee.unit}</span>
                                            </span>
                                        </div>
                                    </div>
                                )}
                                
                                {i < activeFees.length - 1 && <div className="shrink-0 w-full h-[0.5px] bg-border"/>}
                            </div>
                            )
                        })}
                    </div>
                </div>
                <SheetFooter>
                    <div className="">
                        <div className="shrink-0 w-full h-[0.5px] bg-border"/>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-base">Estimated total</span>
                            <span className="text-lg font-semibold">${total.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button onClick={handleApply}>Apply Fee</Button>
                        <SheetClose render={<Button variant="outline" className="flex-1">Cancel</Button>} />
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}