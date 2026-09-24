// lib/schemas/project-task.ts
import { z } from "zod";

export const taskStatusEnum = z.enum(["todo", "in_progress", "done"]);

export const projectTaskSchema = z.object({
    projectId: z.uuid(),
    detail: z.string().min(1, "Task detail is required"),
    assigneeId: z.uuid().optional(),
    status: taskStatusEnum.default("todo"),
});

export type ProjectTaskInput = z.infer<typeof projectTaskSchema>;