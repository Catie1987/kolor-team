// lib/inland-delivery-rates.ts
export interface DeliveryRange {
    minKm: number;
    maxKm: number;
    cost: number;
}

export interface DeliveryTier {
    weightClass: string;
    ranges: DeliveryRange[];
}

export const inlandDeliveryRates: DeliveryTier[] = [
    {
        weightClass: "500kg and under (Van)",
        ranges: [
            { minKm: 0, maxKm: 20, cost: 22 },
            { minKm: 21, maxKm: 50, cost: 32 },
            { minKm: 51, maxKm: 100, cost: 45 },
            { minKm: 101, maxKm: 150, cost: 65 },
            { minKm: 151, maxKm: 300, cost: 80 },
            { minKm: 301, maxKm: 500, cost: 110 },
            { minKm: 501, maxKm: 800, cost: 160 },
            { minKm: 801, maxKm: 1200, cost: 240 },
            { minKm: 1201, maxKm: 1600, cost: 310 },
            { minKm: 1601, maxKm: 2000, cost: 400 },
        ],
    },
    {
        weightClass: "Up to 4 pallets (1.25T truck)",
        ranges: [
            { minKm: 0, maxKm: 20, cost: 25 },
            { minKm: 21, maxKm: 50, cost: 35 },
            { minKm: 51, maxKm: 100, cost: 50 },
            { minKm: 101, maxKm: 150, cost: 70 },
            { minKm: 151, maxKm: 300, cost: 90 },
            { minKm: 301, maxKm: 500, cost: 130 },
            { minKm: 501, maxKm: 800, cost: 180 },
            { minKm: 801, maxKm: 1200, cost: 260 },
            { minKm: 1201, maxKm: 1600, cost: 340 },
            { minKm: 1601, maxKm: 2000, cost: 430 },
        ],
    },
    {
        weightClass: "Up to 6 pallets (1.5T truck)",
        ranges: [
            { minKm: 0, maxKm: 20, cost: 30 },
            { minKm: 21, maxKm: 50, cost: 45 },
            { minKm: 51, maxKm: 100, cost: 60 },
            { minKm: 101, maxKm: 150, cost: 85 },
            { minKm: 151, maxKm: 300, cost: 110 },
            { minKm: 301, maxKm: 500, cost: 160 },
            { minKm: 501, maxKm: 800, cost: 220 },
            { minKm: 801, maxKm: 1200, cost: 320 },
            { minKm: 1201, maxKm: 1600, cost: 420 },
            { minKm: 1601, maxKm: 2000, cost: 530 },
        ],
    },
    {
        weightClass: "Up to 8 pallets (2.5T truck)",
        ranges: [
            { minKm: 0, maxKm: 20, cost: 40 },
            { minKm: 21, maxKm: 50, cost: 55 },
            { minKm: 51, maxKm: 100, cost: 80 },
            { minKm: 101, maxKm: 150, cost: 105 },
            { minKm: 151, maxKm: 300, cost: 140 },
            { minKm: 301, maxKm: 500, cost: 200 },
            { minKm: 501, maxKm: 800, cost: 280 },
            { minKm: 801, maxKm: 1200, cost: 400 },
            { minKm: 1201, maxKm: 1600, cost: 520 },
            { minKm: 1601, maxKm: 2000, cost: 650 },
        ],
    },
    {
        weightClass: "Up to 10 pallets (3.5T truck)",
        ranges: [
            { minKm: 0, maxKm: 20, cost: 50 },
            { minKm: 21, maxKm: 50, cost: 70 },
            { minKm: 51, maxKm: 100, cost: 95 },
            { minKm: 101, maxKm: 150, cost: 125 },
            { minKm: 151, maxKm: 300, cost: 165 },
            { minKm: 301, maxKm: 500, cost: 240 },
            { minKm: 501, maxKm: 800, cost: 330 },
            { minKm: 801, maxKm: 1200, cost: 470 },
            { minKm: 1201, maxKm: 1600, cost: 620 },
            { minKm: 1601, maxKm: 2000, cost: 780 },
        ],
    },
    {
        weightClass: "Up to 12 pallets (5T truck)",
        ranges: [
            { minKm: 0, maxKm: 20, cost: 60 },
            { minKm: 21, maxKm: 50, cost: 85 },
            { minKm: 51, maxKm: 100, cost: 115 },
            { minKm: 101, maxKm: 150, cost: 150 },
            { minKm: 151, maxKm: 300, cost: 200 },
            { minKm: 301, maxKm: 500, cost: 290 },
            { minKm: 501, maxKm: 800, cost: 400 },
            { minKm: 801, maxKm: 1200, cost: 570 },
            { minKm: 1201, maxKm: 1600, cost: 760 },
            { minKm: 1601, maxKm: 2000, cost: 950 },
        ],
    },
    {
        weightClass: "Up to 16 pallets (8T truck)",
        ranges: [
            { minKm: 0, maxKm: 20, cost: 80 },
            { minKm: 21, maxKm: 50, cost: 110 },
            { minKm: 51, maxKm: 100, cost: 150 },
            { minKm: 101, maxKm: 150, cost: 195 },
            { minKm: 151, maxKm: 300, cost: 260 },
            { minKm: 301, maxKm: 500, cost: 380 },
            { minKm: 501, maxKm: 800, cost: 520 },
            { minKm: 801, maxKm: 1200, cost: 740 },
            { minKm: 1201, maxKm: 1600, cost: 980 },
            { minKm: 1601, maxKm: 2000, cost: 1230 },
        ],
    },
    {
        weightClass: "Up to 18 pallets (10T truck)",
        ranges: [
            { minKm: 0, maxKm: 20, cost: 95 },
            { minKm: 21, maxKm: 50, cost: 130 },
            { minKm: 51, maxKm: 100, cost: 180 },
            { minKm: 101, maxKm: 150, cost: 235 },
            { minKm: 151, maxKm: 300, cost: 310 },
            { minKm: 301, maxKm: 500, cost: 450 },
            { minKm: 501, maxKm: 800, cost: 620 },
            { minKm: 801, maxKm: 1200, cost: 880 },
            { minKm: 1201, maxKm: 1600, cost: 1170 },
            { minKm: 1601, maxKm: 2000, cost: 1470 },
        ],
    },
    {
        weightClass: "20FT Container (10-11 pallets)",
        ranges: [
            { minKm: 0, maxKm: 20, cost: 100 },
            { minKm: 21, maxKm: 50, cost: 140 },
            { minKm: 51, maxKm: 100, cost: 190 },
            { minKm: 101, maxKm: 150, cost: 250 },
            { minKm: 151, maxKm: 300, cost: 330 },
            { minKm: 301, maxKm: 500, cost: 480 },
            { minKm: 501, maxKm: 800, cost: 660 },
            { minKm: 801, maxKm: 1200, cost: 940 },
            { minKm: 1201, maxKm: 1600, cost: 1250 },
            { minKm: 1601, maxKm: 2000, cost: 1570 },
        ],
    },
    {
        weightClass: "40FT Container (20-21 pallets)",
        ranges: [
            { minKm: 0, maxKm: 20, cost: 130 },
            { minKm: 21, maxKm: 50, cost: 180 },
            { minKm: 51, maxKm: 100, cost: 250 },
            { minKm: 101, maxKm: 150, cost: 330 },
            { minKm: 151, maxKm: 300, cost: 430 },
            { minKm: 301, maxKm: 500, cost: 620 },
            { minKm: 501, maxKm: 800, cost: 850 },
            { minKm: 801, maxKm: 1200, cost: 1210 },
            { minKm: 1201, maxKm: 1600, cost: 1610 },
            { minKm: 1601, maxKm: 2000, cost: 2020 },
        ],
    },
];

export function getDeliveryCost(
    weightClass: string,
    km: number,
    isCoolTruck: boolean,
    coolTruckSurchargePercent: number = 0
): number {
    const tier = inlandDeliveryRates.find((t) => t.weightClass === weightClass);
    if (!tier) return 0;

    const range = tier.ranges.find((r) => km >= r.minKm && km <= r.maxKm);
    if (!range) return 0;

    const base = range.cost;
    return isCoolTruck ? base * (1 + coolTruckSurchargePercent / 100) : base;
}