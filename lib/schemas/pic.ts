// lib/schemas/pic.ts
import { z } from "zod";

export const picSchema = z.object({
    contactId: z.string().uuid(),
    title: z.string().optional(),
    fullName: z.string().min(1, "Full name is required"),
    department: z.string().optional(),
    position: z.string().optional(),
    mobileNumbers: z.array(z.string().min(1, "Mobile number cannot be empty")).default([]),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
});

export type PicInput = z.infer<typeof picSchema>;