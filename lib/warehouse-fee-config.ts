// lib/warehouse-fee-config.ts
import { inlandDeliveryRates } from "./inland-delivery-rates";

export interface WarehouseFeeItem {
    label: string;
    description?: string;
    cost?: number;
    ratePerUnit?: number;
    unit: string;
    costByTransport?: Record<string, number>;
    inputs?: { label: string; unit: string }[];
    requiresCustomerType?: "epe" | "non-epe"; // only applies when customer matches
    useInlandDeliveryRates?: boolean; // true = pull tiers from the shared table
    coolTruckSurchargePercent?: number;
    isOptionalCheckbox?: boolean;
}

export interface DeliveryTier {
    weightClass: string; // e.g. "Under 1 ton", "1 ton", "2.5 ton"
    ranges: { minKm: number; maxKm: number; cost: number }[];
}

export type WarehouseCategory = "inbound" | "operation" | "outbound" | "optional";

export interface WarehouseFeeSet {
    title: string;
    description: string;
    categories: Record<WarehouseCategory, WarehouseFeeItem[]>;
}

export const categoryLabels: Record<WarehouseCategory, string> = {
    inbound: "Inbound",
    operation: "Operation",
    outbound: "Outbound",
    optional: "Other Fee",
};

export const warehouseFeesByType: Record<string, WarehouseFeeSet> = {
    bonded: {
        title: "Bonded Warehouse",
        description: "Purpose for temporary importation and re-exportation.",
        categories: {
            inbound: [
                {
                    label: "Inland transport",
                    description: "Transport from port/airport to warehouse",
                    unit: " flat",
                    costByTransport: { air: 80, sea: 120, truck: 60 },
                },
                { label: "Unloading Fee", cost: 30, unit: " flat" },
                { label: "Put-away Fee", cost: 25, unit: " flat" },
                { label: "Bonded Entry Processing", cost: 50, unit: " flat" },
            ],
            operation: [
                {
                    label: "Storage Fee",
                    ratePerUnit: 0.5,
                    unit: "per CBM/day",
                    inputs: [{ label: "CBM", unit: "CBM" }, { label: "Days", unit: "days" }],
                },
                { label: "Customs Inventory Control", cost: 40, unit: " flat" },
                { label: "WMS Fee", cost: 20, unit: "/shipment" },
                { label: "Cycle Count", cost: 15, unit: " flat" },
            ],
            outbound: [
                { label: "Picking Fee", cost: 25, unit: " flat" },
                { label: "Bonded-out customs fee", cost: 50, unit: "/shipment" },
                { label: "Loading Fee", cost: 30, unit: " flat" },
                {
                    label: "Customs Declaration",
                    description: "Required for selling in term DDP for EPE Customer",
                    cost: 50,
                    unit: "/shipment",
                    requiresCustomerType: "epe",
                    isOptionalCheckbox: true,
                },
                {
                    label: "Delivery Fee",
                    description: "Based on truck weight class and delivery distance",
                    unit: "tiered",
                    useInlandDeliveryRates: true,
                    coolTruckSurchargePercent: 20,
                },
            ],
            optional: [
                { label: "Partial Release Fee", cost: 35, unit: " flat" },
                { 
                    label: "Relabeling", 
                    ratePerUnit: 0.2, 
                    unit: "/pcs",
                    inputs :[{label: "Items", unit: "pcs"}] 
                },
                { label: "Lot Tracking", cost: 20, unit: " flat" },
                { label: "DG Storage", cost: 100, unit: " flat" },
                {
                    label: "Cold Storage",
                    ratePerUnit: 0.3,
                    unit: " per kg/day",
                    inputs: [{ label: "Weight", unit: "kg" }, { label: "Days", unit: "days" }],
                },
            ],
        },
    },
    normal: {
        title: "Normal Warehouse",
        description: "Standard fee breakdown for handling and storage fee in local warehouse.",
        categories: {
            inbound: [
                {
                    label: "Inland transport",
                    description: "Transport from port/airport to warehouse",
                    unit: " flat",
                    costByTransport: { air: 80, sea: 120, truck: 60 },
                },
                { label: "Unloading Fee", cost: 25, unit: " flat" },
                { label: "Put-away Fee", cost: 20, unit: " flat" },
            ],
            operation: [
                {
                    label: "Storage Fee",
                    ratePerUnit: 0.35,
                    unit: "per CBM/day",
                    inputs: [{ label: "CBM", unit: "CBM" }, { label: "Days", unit: "days" }],
                },
                { label: "WMS Fee", cost: 15, unit: "per shipment" },
                { label: "Cycle Count", cost: 15, unit: " flat" },
            ],
            outbound: [
                { label: "Picking Fee", cost: 20, unit: " flat" },
                { label: "Loading Fee", cost: 25, unit: " flat" },
                {
                    label: "Delivery Fee",
                    description: "Based on truck weight class and delivery distance",
                    unit: "tiered",
                    useInlandDeliveryRates: true,
                    coolTruckSurchargePercent: 20,
                },
            ],
            optional: [
                { label: "Relabeling", cost: 0.2, unit: "per unit" },
                { label: "Lot Tracking", cost: 20, unit: " flat" },
                { label: "DG Storage", cost: 100, unit: " flat" },
                {
                    label: "Cold Storage",
                    ratePerUnit: 0.3,
                    unit: "per kg/day",
                    inputs: [{ label: "Weight", unit: "kg" }, { label: "Days", unit: "days" }],
                },
            ],
        },
    },
};