import prisma from "../prismaClient";

export async function calculateAlignment(clientId: number) {
  const wallet = await prisma.wallet.findFirst({ where: { clientId } });
  const goals = await prisma.goal.findMany({ where: { clientId } });

  if (!wallet || goals.length === 0) return null;

  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetValue, 0);
  const alignment = totalTarget / wallet.totalValue;

  let category: string;
  if (alignment > 0.9) category = "verde";
  else if (alignment > 0.7) category = "amarelo-claro";
  else if (alignment > 0.5) category = "amarelo-escuro";
  else category = "vermelho";

  return {
    alignment: Number((alignment * 100).toFixed(2)),
    category,
  };
}
