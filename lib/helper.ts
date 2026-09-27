export function generateShortName(name: string): string {
    const words = name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3); // first 3 words only

    return words
        .map((word) => word[0]?.toUpperCase() ?? "")
        .join("");
}

export function formatUsername(fullName: string): string {
    return "@" + fullName.trim().toLowerCase().replace(/\s+/g, "");
}

export function formatProjectId(projectNumber: number): string {
    return `PRJ-${String(projectNumber).padStart(4, "0")}`;
}

export const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];
export const weekdays = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
];

export interface MonthSelection {
    month: number; // 1-12
    year: number;
}

export const employmentTypeOptions = [
    { value: "full_time", label: "Full-time" },
    { value: "part_time", label: "Part-time" },
    { value: "contract", label: "Contract" },
    { value: "intern", label: "Intern" },
];

export function generateTimeOptions(): string[] {
    const times: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
        for (const minute of [0, 30]) {
            times.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
        }
    }
    return times;
}

export const timeOptions = generateTimeOptions();
