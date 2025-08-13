import prisma from "../prismaClient";
import { Goal, Wallet, Insurance, Event } from "@prisma/client";

export type Suggestion = {
  goalId: number;
  type: string;
  target: number;
  current: number;
  monthlySuggestion?: number;
  message: string;
};

export async function generateClientSuggestions(
  clientId: number,
  months: number = 24
): Promise<Suggestion[]> {
  const goals: Goal[] = await prisma.goal.findMany({ where: { clientId } });

  if (goals.length === 0) {
    return [
      {
        goalId: 0,
        type: "",
        target: 0,
        current: 0,
        message: "Nenhuma meta encontrada para este cliente.",
      },
    ];
  }

  const wallets: Wallet[] = await prisma.wallet.findMany({
    where: { clientId },
  });
  const currentValue = wallets.reduce((sum, w) => sum + w.totalValue, 0);

  const insurances: Insurance[] = await prisma.insurance.findMany({
    where: { clientId },
  });
  const insuranceValue = insurances.reduce(
    (sum, i) => sum + i.coverageValue,
    0
  );

  const events: Event[] = await prisma.event.findMany({ where: { clientId } });
  const monthlyImpact = events.reduce((sum, e) => {
    if (e.frequency === "MONTHLY") return sum + e.value;
    if (e.frequency === "ANNUAL") return sum + e.value / 12;
    return sum;
  }, 0);

  const totalCurrent = currentValue + insuranceValue;

  const suggestions: Suggestion[] = goals.map((goal) => {
    const gap = goal.targetValue - totalCurrent;

    if (gap <= 0) {
      return {
        goalId: goal.id,
        type: goal.type,
        target: goal.targetValue,
        current: totalCurrent,
        message: `Meta "${goal.type}" já foi atingida.`,
      };
    }

    const monthlySuggestion = Math.ceil(
      (gap - monthlyImpact * months) / months
    );

    return {
      goalId: goal.id,
      type: goal.type,
      target: goal.targetValue,
      current: totalCurrent,
      monthlySuggestion,
      message: `Para a meta "${goal.type}", invista R$ ${monthlySuggestion}/mês por ${months} meses.`,
    };
  });

  return suggestions;
}
