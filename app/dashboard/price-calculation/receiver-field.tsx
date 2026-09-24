"use client"
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {  ListSortDescending,  ArrowLeftRight } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
} from "@/components/ui/input-group";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SheetWarehouseCost } from "./sheet-warehouse-cost";
import { SheetOutboundCost } from "./sheet-outbound-cost";

export type WarehouseType = "normal" | "bonded";
export type CustomerType = "non-epe" | "epe";

export const customerTypes = [
    { label: "Non-EPE Customer", value: "non-epe" },
    { label: "EPE Customer", value: "epe" },
]

interface ReceiverFieldProps {
    transportType: string;
    warehouseType: WarehouseType;
    onWarehouseTypeChange: (type: WarehouseType) => void;
    customerType: string;
    onCustomerTypeChange: (value: string) => void;
    warehouseIn: string;
    onWarehouseInChange: (value: string) => void;
    warehouseOperation: string;
    onWarehouseOperationChange: (value: string) => void;
    warehouseOut: string;
    onWarehouseOutChange: (value: string) => void;
    onInboundOperationCostChange?: (cost: number) => void;
    onOutboundCostChange?: (cost: number) => void;
}

export function ReceiverField({
    transportType,
    warehouseType,
    onWarehouseTypeChange,
    customerType,
    onCustomerTypeChange,
    warehouseIn,
    onWarehouseInChange,
    warehouseOperation,
    onWarehouseOperationChange,
    warehouseOut,
    onWarehouseOutChange,
    onInboundOperationCostChange,
    onOutboundCostChange,
}: ReceiverFieldProps) {
    const total =
        (Number(warehouseIn) || 0) +
        (Number(warehouseOperation) || 0) +
        (Number(warehouseOut) || 0);
    const inboundOperationCost = (Number(warehouseIn) || 0) + (Number(warehouseOperation) || 0);
    const outboundCost = Number(warehouseOut) || 0;
    
    useEffect(() => {
        onWarehouseTypeChange?.(warehouseType);
    }, [warehouseType, onWarehouseTypeChange]);
    useEffect(() => {
        onInboundOperationCostChange?.(inboundOperationCost);
    }, [inboundOperationCost, onInboundOperationCostChange]);

    useEffect(() => {
        onOutboundCostChange?.(outboundCost);
    }, [outboundCost, onOutboundCostChange]);
    
    const toggleWarehouseType = () => {
        onWarehouseTypeChange(warehouseType === "normal" ? "bonded" : "normal");
    };
    return (
        <Card className="@container/card w-full p-4 gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm text-muted-foreground">Warehouse In & Out Cost</h2>
            </div>
            <div className="grid gap-4 @[400px]/card:grid-cols-2 @[400px]/card:items-end -mt-1.5">
                <div className="grid">
                    <div className="flex gap-2 justify-between">
                        <Label className="max-w-40 w-full">Warehouse in:</Label>
                        <Button size="sm" variant="link" onClick={toggleWarehouseType} className="capitalize">
                            {warehouseType}
                            <ArrowLeftRight/>
                        </Button>
                    </div>
                    <InputGroup className="">
                        <InputGroupAddon>
                            <InputGroupText>$</InputGroupText>
                        </InputGroupAddon>
                        <FormattedNumberInput
                            asGroupInput
                            id="warehouseInbound"
                            placeholder="0.00"
                            value={warehouseIn}
                            onChange={onWarehouseInChange}
                        />
                    </InputGroup>
                </div>
                <div className="grid gap-2">
                    <Label className="w-40 flex-none">Warehouse operation:</Label>
                    <div className="flex items-center gap-2">
                        <InputGroup className="">
                            <InputGroupAddon>
                                <InputGroupText>$</InputGroupText>
                            </InputGroupAddon>
                            <FormattedNumberInput
                                asGroupInput
                                id="warehouseOperation"
                                placeholder="0.00"
                                value={warehouseOperation}
                                onChange={onWarehouseOperationChange}
                            />
                        </InputGroup>
                        <Tooltip>
                            <TooltipTrigger render={<span/>}>
                            <SheetWarehouseCost 
                                trigger={
                                    <Button size="icon-lg">
                                        <ListSortDescending/>
                                    </Button>
                                }
                                warehouseType={warehouseType}
                                transportType={transportType}
                                onApply={({ inboundTotal, operationTotal }) => {
                                    onWarehouseInChange(String(inboundTotal));
                                    onWarehouseOperationChange(String(operationTotal));
                                }}
                            />
                            </TooltipTrigger>
                            <TooltipContent><p>{warehouseType === "normal" ? "Normal Warehouse Charges" : "Bonded Warehouse Charges"}</p></TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>
            <div className="shrink-0 w-full h-px bg-border mt-1.5 relative">
                <p className="text-center absolute top-0 left-[50%] text-muted-foreground text-xs -translate-y-[50%] -translate-x-[50%] bg-card px-2">Warehouse out to customer</p>
            </div>
            <div className="grid gap-4 @[400px]/card:grid-cols-2 @[400px]/card:items-end">
                <Select 
                items={customerTypes} 
                value={customerType}
                onValueChange={(newValue) => {
                    if (newValue) onCustomerTypeChange(newValue as string)
                }}
                >
                    <SelectTrigger className="w-full max-w-48">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {customerTypes.map((item)=> {
                                return (
                                    <SelectItem key={item.value} value={item.value}>
                                        {item.label}
                                    </SelectItem>
                                )
                            })}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <div className="grid gap-2">
                    <Label className="w-40 flex-none">Warehouse out:</Label>
                    <div className="flex items-center gap-2">
                        <InputGroup className="">
                            <InputGroupAddon>
                                <InputGroupText>$</InputGroupText>
                            </InputGroupAddon>
                            <FormattedNumberInput
                                asGroupInput
                                id="warehouseOut"
                                placeholder="0.00"
                                value={warehouseOut}
                                onChange={onWarehouseOutChange}
                            />
                        </InputGroup>
                        <Tooltip>
                            <TooltipTrigger render={<span/>}>
                                <SheetOutboundCost 
                                    trigger={
                                        <Button size="icon-lg">
                                            <ListSortDescending/>
                                        </Button>
                                    }
                                    warehouseType={warehouseType}
                                    transportType={transportType}
                                    customerType={customerType}
                                    onApply={(total) => onWarehouseOutChange(String(total))}
                                />
                            </TooltipTrigger>
                            <TooltipContent><p>Delivery cost for {customerType}</p></TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </Card>
    )
}