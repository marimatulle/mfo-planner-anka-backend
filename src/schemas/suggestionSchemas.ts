import { z } from "zod";

export const suggestionQuerySchema = z.object({
  months: z.coerce.number().positive().optional(),
});

export type SuggestionQuery = z.infer<typeof suggestionQuerySchema>;
