import prisma from "../prismaClient";
import {
  createInsurance,
  getInsurances,
  getInsuranceDistribution,
} from "../services/insuranceService";
import type { Insurance, Prisma } from "@prisma/client";
import type { InsuranceInput } from "../schemas/insuranceSchemas";

const mockCreate = jest.fn<Promise<Insurance>, [Prisma.InsuranceCreateArgs]>();
const mockFindMany = jest.fn<
  Promise<Insurance[]>,
  [Prisma.InsuranceFindManyArgs?]
>();

(prisma.insurance.create as unknown) = mockCreate;
(prisma.insurance.findMany as unknown) = mockFindMany;

describe("insuranceService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve criar um seguro corretamente", async () => {
    const input: InsuranceInput = {
      type: "LIFE",
      coverageValue: 100000,
    };

    const createdInsurance: Insurance = {
      id: 1,
      clientId: 1,
      type: "LIFE",
      coverageValue: 100000,
      createdAt: new Date(),
    };

    mockCreate.mockResolvedValue(createdInsurance);

    const resultado = await createInsurance(1, input);
    expect(resultado).toEqual(createdInsurance);
    expect(mockCreate).toHaveBeenCalledWith({
      data: { ...input, clientId: 1 },
    });
  });

  it("deve retornar todos os seguros de um cliente", async () => {
    const insurances: Insurance[] = [
      {
        id: 1,
        type: "LIFE",
        coverageValue: 100000,
        clientId: 1,
        createdAt: new Date(),
      },
      {
        id: 2,
        type: "DISABILITY",
        coverageValue: 50000,
        clientId: 1,
        createdAt: new Date(),
      },
    ];

    mockFindMany.mockResolvedValue(insurances);

    const resultado = await getInsurances(1);
    expect(resultado).toEqual(insurances);
    expect(mockFindMany).toHaveBeenCalledWith({ where: { clientId: 1 } });
  });

  it("deve calcular a distribuição de seguros corretamente", async () => {
    const insurances: Insurance[] = [
      {
        id: 1,
        type: "LIFE",
        coverageValue: 100000,
        clientId: 1,
        createdAt: new Date(),
      },
      {
        id: 2,
        type: "DISABILITY",
        coverageValue: 50000,
        clientId: 1,
        createdAt: new Date(),
      },
    ];

    mockFindMany.mockResolvedValue(insurances);

    const resultado = await getInsuranceDistribution(1);

    expect(resultado.total).toBe(150000);
    expect(resultado.life).toBe(100000);
    expect(resultado.disability).toBe(50000);
    expect(resultado.lifePercent).toBeCloseTo(66.67, 2);
    expect(resultado.disabilityPercent).toBeCloseTo(33.33, 2);

    expect(mockFindMany).toHaveBeenCalledWith({ where: { clientId: 1 } });
  });
});
