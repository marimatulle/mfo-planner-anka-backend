import prisma from "../prismaClient";
import { goalSchema } from "../schemas/goalSchemas";
import { walletSchema } from "../schemas/walletSchemas";
import { insuranceSchema } from "../schemas/insuranceSchemas";
import { eventSchema } from "../schemas/eventSchemas";
import { z } from "zod";

const goalWithIdSchema = goalSchema.extend({ id: z.number() });
const walletWithIdSchema = walletSchema.extend({ id: z.number() });
const insuranceWithIdSchema = insuranceSchema.extend({ id: z.number() });
const eventWithIdSchema = eventSchema.extend({ id: z.number() });

type GoalParsed = z.infer<typeof goalWithIdSchema>;
type WalletParsed = z.infer<typeof walletWithIdSchema>;
type InsuranceParsed = z.infer<typeof insuranceWithIdSchema>;
type EventParsed = z.infer<typeof eventWithIdSchema>;

const suggestionSchema = z.object({
  goalId: z.number(),
  type: z.string(),
  target: z.number(),
  current: z.number(),
  monthlySuggestion: z.number().optional(),
  message: z.string(),
});

export type Suggestion = z.infer<typeof suggestionSchema>;

export async function generateClientSuggestions(
  clientId: number,
  months: number = 24
): Promise<Suggestion[]> {
  const goalsRaw = await prisma.goal.findMany({ where: { clientId } });
  const goals = goalsRaw.map(
    (g: unknown): GoalParsed => goalWithIdSchema.parse(g)
  );

  if (goals.length === 0) {
    return [
      { message: "Nenhuma meta encontrada para este cliente." },
    ] as Suggestion[];
  }

  const walletsRaw = await prisma.wallet.findMany({ where: { clientId } });
  const wallets = walletsRaw.map(
    (w: unknown): WalletParsed => walletWithIdSchema.parse(w)
  );
  const currentValue = wallets.reduce(
    (sum: number, w: WalletParsed): number => sum + w.totalValue,
    0
  );

  const insurancesRaw = await prisma.insurance.findMany({
    where: { clientId },
  });
  const insurances = insurancesRaw.map(
    (i: unknown): InsuranceParsed => insuranceWithIdSchema.parse(i)
  );
  const insuranceValue = insurances.reduce(
    (sum: number, i: InsuranceParsed): number => sum + i.coverageValue,
    0
  );

  const eventsRaw = await prisma.event.findMany({ where: { clientId } });
  const events = eventsRaw.map(
    (e: unknown): EventParsed => eventWithIdSchema.parse(e)
  );
  const monthlyImpact = events.reduce((sum: number, e: EventParsed): number => {
    if (e.frequency === "MONTHLY") return sum + e.value;
    if (e.frequency === "ANNUAL") return sum + e.value / 12;
    return sum;
  }, 0);

  const totalCurrent = currentValue + insuranceValue;

  const suggestions = goals.map((goal: GoalParsed): Suggestion => {
    const gap = goal.targetValue - totalCurrent;

    if (gap <= 0) {
      return suggestionSchema.parse({
        goalId: goal.id,
        type: goal.type,
        target: goal.targetValue,
        current: totalCurrent,
        message: `Meta "${goal.type}" já foi atingida.`,
      });
    }

    const monthlySuggestion = Math.ceil(
      (gap - monthlyImpact * months) / months
    );

    return suggestionSchema.parse({
      goalId: goal.id,
      type: goal.type,
      target: goal.targetValue,
      current: totalCurrent,
      monthlySuggestion,
      message: `Para a meta "${goal.type}", invista R$ ${monthlySuggestion}/mês por ${months} meses.`,
    });
  });

  return suggestions;
}
