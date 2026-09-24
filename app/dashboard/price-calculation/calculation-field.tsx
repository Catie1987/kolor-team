// components/incoterm-calculator.tsx
"use client"
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { costLabels, incotermResponsibility, type CostKey } from "@/lib/incoterm-rules";
import { ListSortDescending } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { SheetPriceList } from "./sheet-price-list";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";

const flatCostKeys: Exclude<CostKey, "importDuty">[] = [
    "exportCustoms",
    "freight",
    "insurance",
    "destinationFees",
];

interface CalculationFieldProps {
    transportType: string;
    incoterm: string;
    onLandedCostChange?: (landedCost: number) => void;
    costs: Record<Exclude<CostKey, "importDuty">, string>;
    onCostsChange: (costs: Record<Exclude<CostKey, "importDuty">, string>) => void;
}

export function CalculationField({ transportType, incoterm, onLandedCostChange, costs, onCostsChange }: CalculationFieldProps) {
    
    const responsibility = incotermResponsibility[incoterm] ?? incotermResponsibility.exw;

    const flatTotal = flatCostKeys.reduce(
        (sum, key) => sum + (responsibility[key] ? Number(costs[key]) || 0 : 0),
        0
    );
    const landedCost = flatTotal;
    useEffect(() => {
        onLandedCostChange?.(landedCost);
    }, [landedCost, onLandedCostChange]);

    const updateCost = (key: Exclude<CostKey, "importDuty">, value: string) => {
        onCostsChange({ ...costs, [key]: value });
    };

    return (
        <Card className="@container/card w-full p-4 gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm text-muted-foreground">Landed Cost Estimate</h2>
                <Badge className="capitalize">
                    {transportType} · {incoterm.toUpperCase()}
                </Badge>
            </div>
            <div className="grid gap-4 @[400px]/card:grid-cols-2 @[400px]/card:items-end">
                {flatCostKeys.map((key) => {
                    const isBuyerResponsible = responsibility[key];
                    return (
                        <div key={key} className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor={key}>{costLabels[key]}</Label>
                            </div>
                            <div className="flex gap-2">
                                <InputGroup>
                                    {isBuyerResponsible && (
                                        <InputGroupAddon>
                                            <InputGroupText>$</InputGroupText>
                                        </InputGroupAddon>
                                    )}
                                    <FormattedNumberInput
                                        asGroupInput
                                        id={key}
                                        disabled={!isBuyerResponsible}
                                        value={isBuyerResponsible ? costs[key] : ""}
                                        onChange={(value) => updateCost(key, value)}
                                        placeholder={isBuyerResponsible ? "0.00" : "Included by seller"}
                                        className={!isBuyerResponsible ? "opacity-50 select-none" : ""}
                                    />
                                </InputGroup>
                                {key === "destinationFees" && (
                                    <Tooltip>
                                        <TooltipTrigger render={<span/>}>
                                            <SheetPriceList
                                                trigger={
                                                        <Button size="icon-lg" disabled={!isBuyerResponsible}>
                                                            <ListSortDescending/>
                                                        </Button>
                                                }
                                                transportType={transportType}
                                                onApply={(total) => updateCost("destinationFees", String(total))}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent><p>Standard Fees in Vietnam</p></TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}