// components/select-term.tsx
"use client"
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Ship, Plane, Truck } from 'lucide-react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

export const transportTypes = [
    { label: "Air", value: "air", icon: Plane },
    { label: "Sea", value: "sea", icon: Ship },
    { label: "Truck", value: "truck", icon: Truck },
];

export const incotermTypes = [
    { label: "EX WORKS", value: "exw" },
    { label: "FCA/FOB/FAS", value: "fob" },
    { label: "CIF/CFR/CPT/CIP", value: "cif" },
    { label: "DAP/DPU/DDP", value: "ddp" },
]

interface SelectTermProps {
    transportType: string;
    onTransportTypeChange: (value: string) => void;
}

export function SelectTerm({ transportType, onTransportTypeChange }: SelectTermProps) {
    const selected = transportTypes.find((t) => t.value === transportType);

    return (
            <div className="flex flex-col w-full items-start gap-2 @[500px]/card:flex-row @[500px]/card:w-fit">
                <Select
                    value={transportType}
                    onValueChange={(newValue) => {
                        if (newValue) onTransportTypeChange(newValue);
                    }}
                >
                    <SelectTrigger>
                        <div className="flex items-center gap-2 capitalize w-20">
                            {selected && <selected.icon className="size-4" />}
                            <SelectValue />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {transportTypes.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <SelectItem key={item.value} value={item.value}>
                                        <div className="flex items-center gap-2">
                                            <Icon className="size-4" />
                                            {item.label}
                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <TabsList className="flex-wrap group-data-horizontal/tabs:h-auto">
                    {incotermTypes.map((item) => (
                        <TabsTrigger key={item.value} value={item.value}>
                            {item.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>
    )
}