// lib/shipment-fee-config.ts
export interface FeeInputDimension {
    label: string;
    unit: string;
}

export interface FeeItem {
    label: string;
    description: string;
    cost?: number;
    ratePerUnit?: number;
    unit: string;
    inputs?: FeeInputDimension[];
}

export interface ShipmentCase {
    label: string;
    fees: FeeItem[];
}

export interface TransportFeeSet {
    title: string;
    description: string;
    cases: Record<string, ShipmentCase>;
    dgFees?: FeeItem[]; // added on top of whichever case is active, when DG is checked
}

export const shipmentFeesByTransport: Record<string, TransportFeeSet> = {
    sea: {
        title: "Sea Import",
        description: "Standard fee breakdown for ocean shipments incoming to seaport.",
        cases: {
            fcl20: {
                label: "FCL 20'",
                fees: [
                    { label: "THC", description: "Terminal Handling Charge", cost: 150, unit: "/container" },
                    { label: "D/O", description: "Document Order", cost: 40, unit: "/shipment" },
                    { label: "Bill of lading fee", description: "Document handling charge", cost: 20, unit: " flat" },
                    { label: "Customs clearance", description: "Import clearance service", cost: 50, unit: " flat" },
                ],
            },
            fcl40: {
                label: "FCL 40'",
                fees: [
                    { label: "THC", description: "Terminal Handling Charge", cost: 220, unit: "/container" },
                    { label: "D/O", description: "Document Order", cost: 40, unit: "/shipment" },
                    { label: "Bill of lading fee", description: "Document handling charge", cost: 20, unit: " flat" },
                    { label: "Customs clearance", description: "Import clearance service", cost: 50, unit: " flat" },
                ],
            },
            lcl: {
                label: "LCL",
                fees: [
                    { label: "THC", description: "Terminal Handling Charge", cost: 150, unit: "/shipment" },
                    { label: "D/O", description: "Document Order", cost: 40, unit: "/shipment" },
                    { label: "Bill of lading fee", description: "Document handling charge", cost: 20, unit: " flat" },
                    { label: "Customs clearance", description: "Import clearance service", cost: 50, unit: " flat" },
                    {
                        label: "CFS fee",
                        description: "Container freight station handling",
                        ratePerUnit: 8,
                        unit: "/CBM",
                        inputs: [{ label: "CBM", unit: "CBM" }],
                    },
                ],
            },
        },
        dgFees: [
            { label: "DG Surcharge", description: "Dangerous goods handling surcharge", cost: 300, unit: "flat" },
            { label: "DG Documentation", description: "Dangerous goods documentation fee", cost: 50, unit: "flat" },
        ],
    },
    air: {
        title: "Air Import",
        description: "Standard fee breakdown for air shipments.",
        cases: {
            standard: {
                label: "Standard",
                fees: [
                    { label: "Airway bill fee", description: "Document handling charge", cost: 30, unit: " flat" },
                    { label: "Terminal handling", description: "Cargo terminal processing", cost: 100, unit: "/shipment" },
                    { label: "Customs clearance", description: "Import clearance service", cost: 50, unit: " flat" },
                ],
            },
            coolStorage: {
                label: "Cool Storage",
                fees: [
                    { label: "Airway bill fee", description: "Document handling charge", cost: 30, unit: " flat" },
                    { label: "Terminal handling", description: "Cargo terminal processing", cost: 100, unit: "/shipment" },
                    { label: "Cold storage handling", description: "Cold chain handling fee", cost: 150, unit: " flat" },
                    {
                        label: "Cold storage fee",
                        description: "Refrigerated storage charge",
                        ratePerUnit: 0.3,
                        unit: "per kg/day",
                        inputs: [
                            { label: "Weight", unit: "kg" },
                            { label: "Days", unit: "days" },
                        ],
                    },
                    { label: "Customs clearance", description: "Import clearance service", cost: 50, unit: " flat" },
                ],
            },
        },
        dgFees: [
            { label: "DG Surcharge", description: "Dangerous goods handling surcharge", cost: 300, unit: " flat" },
            { label: "DG Documentation", description: "Dangerous goods documentation fee", cost: 50, unit: " flat" },
        ],
    },
    truck: {
        title: "Truck Import",
        description: "Standard fee breakdown for road/land shipments.",
        cases: {
            standard: {
                label: "Standard",
                fees: [
                    { label: "Border crossing fee", description: "Cross-border processing", cost: 60, unit: " flat" },
                    { label: "Customs clearance", description: "Import clearance service", cost: 50, unit: " flat" },
                ],
            },
        },
        dgFees: [
            { label: "DG Surcharge", description: "Dangerous goods handling surcharge", cost: 300, unit: " flat" },
            { label: "DG Documentation", description: "Dangerous goods documentation fee", cost: 50, unit: " flat" },
        ],
    },
};