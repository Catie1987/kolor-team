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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useState } from "react";
import { WarehouseFeeItem, warehouseFeesByType } from "@/lib/warehouse-fee-config";
import { customerTypes } from "./receiver-field";
import { inlandDeliveryRates, getDeliveryCost } from "@/lib/inland-delivery-rates";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SheetOutboundCost {
    trigger: React.ReactElement;
    onApply?: (total: number) => void;
    warehouseType: string;
    transportType: string;
    customerType: string;
}

export function SheetOutboundCost({ 
    trigger,
    warehouseType,
    transportType,
    customerType,
    onApply
 }: SheetOutboundCost){
  const [open, setOpen] = useState(false);
  const [weightClass, setWeightClass] = useState<string>("");
  const [selectedRangeIndex, setSelectedRangeIndex] = useState<string>("");
  const [enabledOtherFee, setEnabledOtherFee] = useState<Record<string, boolean>>({});
  const [isCoolTruck, setIsCoolTruck] = useState(false);
  const feeSet = warehouseFeesByType[warehouseType] ?? warehouseFeesByType.bonded;
  const deliveryFee = feeSet.categories.outbound.find((f) => f.label === "Delivery Fee");
  const tiers = deliveryFee?.useInlandDeliveryRates ? inlandDeliveryRates : [];
  const selectedTier = tiers.find((t) => t.weightClass === weightClass);
  const selectedRange = selectedTier?.ranges[Number(selectedRangeIndex)];
  const customer = customerTypes.find((item) => item.value === customerType)
  const [isDeliveryEnabled, setIsDeliveryEnabled] = useState(true); // default true, adjust if you want it off by default

  const deliveryCost = useMemo(() => {
      if (!weightClass || !selectedRange) return 0;
      return getDeliveryCost(
          weightClass,
          selectedRange.minKm, // or pass actual km if you switch to a manual km input instead of range dropdown
          isCoolTruck,
          deliveryFee?.coolTruckSurchargePercent ?? 0
      );
  }, [weightClass, selectedRange, isCoolTruck, deliveryFee]);

  // Other outbound fees — flat/simple ones, filtered by customer type eligibility
    const otherFees = feeSet.categories.outbound.filter(
        (fee) =>
            fee.label !== "Delivery Fee" &&
            (!fee.requiresCustomerType || fee.requiresCustomerType === customerType)
    );

    const getLineCost = (fee: WarehouseFeeItem): number => fee.cost ?? 0;

    

    const handleApply = () => {
        onApply?.(total);
        setOpen(false);
    };
    useEffect(() => {
      if (!selectedTier || selectedTier.ranges.length === 0) {
          setSelectedRangeIndex("");
          return;
      }

      const currentIdx = Number(selectedRangeIndex);
      const isValidForNewTier =
          selectedRangeIndex !== "" && currentIdx >= 0 && currentIdx < selectedTier.ranges.length;

      if (!isValidForNewTier) {
          setSelectedRangeIndex("0");
      }
  }, [weightClass]);
    const otherFeesTotal = otherFees.reduce((sum, fee) => {
      if (fee.isOptionalCheckbox) {
          return enabledOtherFee[fee.label] ? sum + getLineCost(fee) : sum;
      }
      return sum + getLineCost(fee);
  }, 0);
    const total = otherFeesTotal + (isDeliveryEnabled ? deliveryCost : 0);
  return (
    <Sheet 
      open={open}
      onOpenChange={setOpen}
    >
      <SheetTrigger render={trigger} />
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Warehouse out & Delivery Charges</SheetTitle>
          <div className="flex items-center gap-2">
            <Badge variant={"outline"} className="text-muted-foreground">{feeSet.title}</Badge>
            <ArrowRight className="w-4 h-4 aspect-square text-muted-foreground"/>
            <Badge>{customer?.label ?? customerType}</Badge>
          </div>
        </SheetHeader>
        <div className="px-4 flex flex-col gap-4 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-1">
            {otherFees.map((fee, i) => {
              const isCheckedOther = !!enabledOtherFee[fee.label];
              return (
               <div key={fee.label}>
                  <div className="flex items-start justify-between py-2">
                    <div className="flex flex-col gap-0.5">
                      {fee.isOptionalCheckbox ? (
                        <div className="flex gap-2 items-center">
                          <Checkbox
                            id={fee.label}
                            checked={isCheckedOther}
                            onCheckedChange={(checked) =>
                              setEnabledOtherFee((prev) => ({
                                ...prev,
                                [fee.label]: checked === true,
                              }))
                            }
                            className="rounded-[4px]"
                          />
                          <Label htmlFor={fee.label} className="text-sm font-normal flex-1 min-w-32">{fee.label}</Label>
                        </div>
                      ):(
                        <span className="text-sm">{fee.label}</span>
                      )}
                      {fee.description && (
                        <span className="text-xs text-muted-foreground max-w-50">{fee.description}</span>
                      )}
                    </div>
                    {fee.isOptionalCheckbox ? (
                      <span className="text-sm font-medium whitespace-nowrap">
                        {isCheckedOther ? `$${(fee.cost ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
                        {isCheckedOther && (<span className="text-xs text-muted-foreground font-normal">{fee.unit}</span>)}
                      </span>
                    ):(
                      <span className="text-sm font-medium">
                        ${(fee.cost ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="text-muted-foreground text-xs font-normal">{fee.unit}</span>
                      </span>  
                    )}
                                      
                  </div>       
                  {i < otherFees.length - 1 && <div className="shrink-0 w-full h-[0.5px] bg-border"/>}           
               </div>
               )
            })}
          </div>
          <div className="shrink-0 w-full h-[0.5px] bg-border"/>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="deliveryCheck"
                  checked={isDeliveryEnabled}
                  onCheckedChange={(checked) => setIsDeliveryEnabled(checked === true)}
                  className="rounded-[4px]"
                />
                <Label htmlFor="deliveryCheck" className="text-sm font-normal">Delivery Fee</Label>
              </div>
              <span className="text-sm font-semibold">
                {isDeliveryEnabled ? `$${deliveryCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
                {isDeliveryEnabled  && <span className="text-muted-foreground font-normal text-xs"> at cost</span>}
              </span>
            </div>
            <div className="w-full flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground max-w-50">
                Only neccesary if customer request to delivery to their destination
              </span>
              {isDeliveryEnabled  && (
              <div className={cn("flex gap-2 items-start border rounded-sm px-2 py-1", isCoolTruck && "bg-primary/10 border-primary/20")}>
                <Checkbox
                  id="coolTruck"
                  checked={isCoolTruck}
                  onCheckedChange={(checked) => setIsCoolTruck(checked === true)}
                  className="rounded-[4px]"
                />
                <Label htmlFor="coolTruck" className="text-xs font-normal w-16">Cool Truck 
                  (+{deliveryFee?.coolTruckSurchargePercent ?? 0}%)
                </Label>
              </div>
              )}
            </div>
            <div className="grid gap-2 mt-1">
              <div className="flex gap-2 items-center">
                <Badge variant="secondary" className="min-w-20">Truck type</Badge>
                <Select
                    value={weightClass}
                    onValueChange={(v) => v && setWeightClass(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select truck type"/>
                  </SelectTrigger>
                  <SelectContent className=''>
                      <SelectGroup>
                        {tiers.map((tier) => (
                            <SelectItem key={tier.weightClass} value={tier.weightClass}>
                              {tier.weightClass}
                            </SelectItem>
                        ))}
                      </SelectGroup>
                  </SelectContent>
                  </Select>
              </div>
              <div className="flex gap-2 items-center">
                <Badge variant="secondary" className="min-w-20">Distance</Badge>
                <Select
                  value={selectedRangeIndex}
                  onValueChange={(v) => v && setSelectedRangeIndex(v)}
                  disabled={!selectedTier}
                >
                  <SelectTrigger className="w-full">
                    {selectedRange
                    ? `${selectedRange.minKm}~${selectedRange.maxKm} km`
                    : "Select distance range"}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {selectedTier?.ranges.map((range, idx) => (
                        <SelectItem key={idx} value={String(idx)}>
                          {range.minKm}–{range.maxKm} km
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
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