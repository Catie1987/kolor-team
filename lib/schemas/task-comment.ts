import { z } from "zod";

export const taskCommentSchema = z.object({
    taskId: z.uuid(),
    content: z.string().min(1, "Comment cannot be empty").max(2000, "Comment is too long"),
});

export type TaskCommentInput = z.infer<typeof taskCommentSchema>;