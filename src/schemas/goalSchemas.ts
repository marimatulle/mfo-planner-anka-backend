import { z } from "zod";

export const goalSchema = z.object({
  type: z.string().min(1),
  targetValue: z.number().positive(),
  targetDate: z.string().datetime(),
});

export type GoalInput = z.infer<typeof goalSchema>;
