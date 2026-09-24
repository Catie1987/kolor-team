// lib/template-metrics.ts
import type { CalculationTemplateData } from "./calculation-templates";
import { incotermResponsibility } from "../incoterm-rules";


export interface TemplateMetrics {
    firstItemName: string;
    extraItemCount: number;
    firstItemPrice: number;
    firstItemCOG: number;          // price + incoterm share + inbound share (excludes outbound)
    firstItemWarehouseOutShare: number; // outbound share only
    firstItemIncotermShare: number;
    firstItemWarehouseInOperation: number;
    quantityLabel: string;
}

export function computeTemplateMetrics(data: CalculationTemplateData): TemplateMetrics {
    const {
        items = [],
        planType = "single",
        incoterm = "exw",
        costs = {},
        warehouseIn = "",
        warehouseOperation = "",
        warehouseOut = "",
        combineQuantity = "",
    } = data;

    const responsibility = incotermResponsibility[incoterm] ?? incotermResponsibility.exw;

    // Incoterm landed cost (destinationFees, freight, insurance, exportCustoms — buyer-responsible only)
    const flatCostKeys = ["exportCustoms", "freight", "insurance", "destinationFees"] as const;
    const landedCost = flatCostKeys.reduce(
        (sum, key) => sum + (responsibility[key] ? Number(costs[key]) || 0 : 0),
        0
    );

    const inboundOperationCost = (Number(warehouseIn) || 0) + (Number(warehouseOperation) || 0);
    const outboundCost = Number(warehouseOut) || 0;

    const grandTotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const totalOutboundQuantity = items.reduce((sum, item) => sum + (Number(item.outbound) || 0), 0);

    const firstItem = items[0];
    const firstItemName = firstItem?.name || "Untitled";
    const extraItemCount = Math.max(items.length - 1, 0);
    const firstItemPrice = Number(firstItem?.price) || 0;
    const unit = firstItem?.unit || "";

    const combineTotal = grandTotal + (Number(combineQuantity) || 0);
    const quantityLabel =
        planType === "single"
            ? `${firstItem?.quantity || 0} ${unit}`
            : planType === "combine"
                ? `${combineTotal.toLocaleString()} ${unit}`
                : `${grandTotal.toLocaleString()} ${unit}`; // multiple

    if (!firstItem) {
        return {
            firstItemName,
            extraItemCount,
            firstItemPrice: 0,
            firstItemCOG: 0,
            firstItemIncotermShare: 0,
            firstItemWarehouseInOperation: 0,
            firstItemWarehouseOutShare: 0,
            quantityLabel: `0`,
        };
    }
    const incotermShare =
        planType === "single"
            ? Number(firstItem.quantity) > 0
                ? landedCost / Number(firstItem.quantity)
                : 0
            : grandTotal > 0
                ? landedCost / grandTotal
                : 0;

    const inboundShare =
        planType === "single"
            ? Number(firstItem.quantity) > 0
                ? inboundOperationCost / Number(firstItem.quantity)
                : 0
            : grandTotal > 0
                ? inboundOperationCost / grandTotal
                : 0;

    const outboundShare = totalOutboundQuantity > 0 ? outboundCost / totalOutboundQuantity : 0;

    const firstItemCOG = firstItemPrice + incotermShare + inboundShare;

    return {
        firstItemName,
        extraItemCount,
        firstItemPrice,
        firstItemCOG,
        firstItemWarehouseOutShare: outboundShare,
        firstItemIncotermShare: incotermShare,
        firstItemWarehouseInOperation: inboundShare,
        quantityLabel,
    };
}