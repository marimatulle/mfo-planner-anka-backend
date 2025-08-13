import prisma from "../prismaClient";
import {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
} from "../services/goalService";
import type { Goal, Prisma } from "@prisma/client";
import type { GoalInput } from "../schemas/goalSchemas";

const mockCreate = jest.fn<Promise<Goal>, [Prisma.GoalCreateArgs]>();
const mockFindMany = jest.fn<Promise<Goal[]>, [Prisma.GoalFindManyArgs?]>();
const mockFindUnique = jest.fn<
  Promise<Goal | null>,
  [Prisma.GoalFindUniqueArgs]
>();
const mockUpdate = jest.fn<Promise<Goal>, [Prisma.GoalUpdateArgs]>();
const mockDelete = jest.fn<Promise<Goal>, [Prisma.GoalDeleteArgs]>();

(prisma.goal.create as unknown) = mockCreate;
(prisma.goal.findMany as unknown) = mockFindMany;
(prisma.goal.findUnique as unknown) = mockFindUnique;
(prisma.goal.update as unknown) = mockUpdate;
(prisma.goal.delete as unknown) = mockDelete;

describe("goalService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve criar uma meta corretamente", async () => {
    const input: GoalInput = {
      type: "Investimento",
      targetValue: 5000,
      targetDate: new Date().toISOString(),
    };

    const createdGoal: Goal = {
      id: 1,
      clientId: 1,
      type: input.type,
      targetValue: input.targetValue,
      targetDate: new Date(input.targetDate),
    };

    mockCreate.mockResolvedValue(createdGoal);

    const resultado = await createGoal(1, input);
    expect(resultado).toEqual(createdGoal);
    expect(mockCreate).toHaveBeenCalledWith({
      data: { ...input, clientId: 1 },
    });
  });

  it("deve retornar todas as metas de um cliente", async () => {
    const goals: Goal[] = [
      {
        id: 1,
        type: "Investimento",
        targetValue: 5000,
        targetDate: new Date(),
        clientId: 1,
      },
      {
        id: 2,
        type: "Poupança",
        targetValue: 2000,
        targetDate: new Date(),
        clientId: 1,
      },
    ];

    mockFindMany.mockResolvedValue(goals);

    const resultado = await getGoals(1);
    expect(resultado).toEqual(goals);
    expect(mockFindMany).toHaveBeenCalledWith({ where: { clientId: 1 } });
  });

  it("deve retornar uma meta pelo id", async () => {
    const goal: Goal = {
      id: 1,
      type: "Investimento",
      targetValue: 5000,
      targetDate: new Date(),
      clientId: 1,
    };
    mockFindUnique.mockResolvedValue(goal);

    const resultado = await getGoalById(1);
    expect(resultado).toEqual(goal);
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("deve atualizar uma meta corretamente", async () => {
    const updatedData: Partial<GoalInput> = { targetValue: 6000 };
    const updatedGoal: Goal = {
      id: 1,
      type: "Investimento",
      targetValue: 6000,
      targetDate: new Date(),
      clientId: 1,
    };

    mockUpdate.mockResolvedValue(updatedGoal);

    const resultado = await updateGoal(1, updatedData);
    expect(resultado).toEqual(updatedGoal);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: updatedData,
    });
  });

  it("deve deletar uma meta corretamente", async () => {
    const deletedGoal: Goal = {
      id: 1,
      type: "Investimento",
      targetValue: 5000,
      targetDate: new Date(),
      clientId: 1,
    };

    mockDelete.mockResolvedValue(deletedGoal);

    const resultado = await deleteGoal(1);
    expect(resultado).toEqual(deletedGoal);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
