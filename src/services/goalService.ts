import prisma from "../prismaClient";
import { GoalInput } from "../schemas/goalSchemas";

export async function createGoal(clientId: number, data: GoalInput) {
  return prisma.goal.create({
    data: { ...data, clientId },
  });
}

export async function getGoals(clientId: number) {
  return prisma.goal.findMany({ where: { clientId } });
}

export async function getGoalById(id: number) {
  return prisma.goal.findUnique({ where: { id } });
}

export async function updateGoal(id: number, data: Partial<GoalInput>) {
  return prisma.goal.update({ where: { id }, data });
}

export async function deleteGoal(id: number) {
  return prisma.goal.delete({ where: { id } });
}
