// lib/schemas/project.ts
import { z } from "zod";

export const pricingModelEnum = z.enum(["monthly", "yearly", "one_time"]);
export const statusEnum = z.enum(["just_started", "in_progress", "success", "pending", "drop"]);
export const priorityEnum = z.enum(["high", "medium", "low"]);

export const projectSchema = z.object({
    customerId: z.uuid().optional(),
    description: z.string().optional(),
    pricingModel: pricingModelEnum,
    pricingValue: z.number().min(0, "Value must be positive"),
    currency: z.string().default("USD"),
    status: statusEnum.default("just_started"),
    priority: priorityEnum.default("medium"),
    leaderId: z.uuid(),
    participantIds: z.array(z.uuid()).default([]),
    startedAt: z.string().optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;