import prisma from "../prismaClient";
import { InsuranceInput } from "../schemas/insuranceSchemas";

type Insurance = Awaited<ReturnType<typeof prisma.insurance.findFirst>>;

export async function createInsurance(clientId: number, data: InsuranceInput) {
  return prisma.insurance.create({
    data: { ...data, clientId },
  });
}

export async function getInsurances(clientId: number) {
  return prisma.insurance.findMany({ where: { clientId } });
}

export async function getInsuranceDistribution(clientId: number) {
  const insurances = await prisma.insurance.findMany({ where: { clientId } });

  const total = insurances.reduce(
    (sum: number, i: Insurance) => sum + (i?.coverageValue ?? 0),
    0
  );

  const life = insurances
    .filter((i: Insurance) => i?.type === "LIFE")
    .reduce((sum: number, i: Insurance) => sum + (i?.coverageValue ?? 0), 0);

  const disability = total - life;

  return {
    total,
    life,
    disability,
    lifePercent: Number(((life / total) * 100).toFixed(2)),
    disabilityPercent: Number(((disability / total) * 100).toFixed(2)),
  };
}
