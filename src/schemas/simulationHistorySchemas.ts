import { z } from "zod";

export const simulationHistorySchema = z.object({
  rate: z.coerce.number().optional(),
});

export type SimulationHistoryInput = z.infer<typeof simulationHistorySchema>;
