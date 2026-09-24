import { z } from "zod";

export const notificationTypeEnum = z.enum([
    "project_join_request",
    "project_join_approved",
    "project_join_rejected",
    "task_assigned",
    "task_status_changed",
    "project_status_changed",
    "general",
]);

export const notificationSchema = z.object({
    type: notificationTypeEnum,
    description: z.string().min(1),
    senderId: z.uuid(),
    receiverId: z.uuid(),
    relatedProjectId: z.uuid().optional(),
    actionRequired: z.boolean().default(false),
});

export type NotificationInput = z.infer<typeof notificationSchema>;