// lib/incoterm-rules.ts
export type CostKey = "exportCustoms" | "freight" | "insurance" | "importDuty" | "destinationFees";

export const costLabels: Record<CostKey, string> = {
    exportCustoms: "Export customs clearance",
    freight: "Main freight (sea/air/truck)",
    insurance: "Cargo insurance",
    importDuty: "Import duty & taxes",
    destinationFees: "Destination handling",
};

// true = buyer (you, the importer) must pay this on top of product cost
// false = already included in the seller's quoted price
export const incotermResponsibility: Record<string, Record<CostKey, boolean>> = {
    exw: {
        exportCustoms: true,
        freight: true,
        insurance: true,
        importDuty: true,
        destinationFees: true,
    },
    fob: {
        exportCustoms: false, // seller handles export clearance + delivery to port
        freight: true,
        insurance: true,
        importDuty: true,
        destinationFees: true,
    },
    cif: {
        exportCustoms: false,
        freight: false,      // seller pays main freight
        insurance: false,    // seller pays insurance (CIF/CIP)
        importDuty: true,
        destinationFees: true,
    },
    ddp: {
        exportCustoms: false,
        freight: false,
        insurance: false,
        importDuty: false,   // seller handles everything, including duty
        destinationFees: false, // unloading at destination is usually still buyer's, varies
    },
};