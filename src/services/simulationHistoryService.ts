import prisma from "../prismaClient";
import { SimulationHistoryInput } from "../schemas/simulationHistorySchemas";
import { simulateWealthCurve } from "./simulationService";

export async function createSimulation(
  clientId: number,
  data: SimulationHistoryInput
) {
  const wallet = await prisma.wallet.findFirst({ where: { clientId } });
  if (!wallet) throw new Error("Carteira não encontrada");

  const events = await prisma.event.findMany({ where: { clientId } });
  const rate = data.rate ?? 0.04;
  const curve = simulateWealthCurve(wallet.totalValue, events, rate);

  const simulationData = {
    rate,
    initialValue: wallet.totalValue,
    curve,
  };

  return prisma.simulation.create({
    data: {
      clientId,
      data: simulationData,
    },
  });
}

export async function getSimulations(clientId: number) {
  return prisma.simulation.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSimulationById(id: number) {
  return prisma.simulation.findUnique({ where: { id } });
}
