import { FastifyInstance } from "fastify";
import { goalSchema } from "../schemas/goalSchemas";
import * as goalService from "../services/goalService";

export async function goalRoutes(app: FastifyInstance) {
  app.post(
    "/clients/:id/goals",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const clientId = Number(id);

      const result = goalSchema.safeParse(request.body);
      if (!result.success) {
        return reply.code(400).send({
          message: "Dados da meta inválidos",
          errors: result.error.flatten().fieldErrors,
        });
      }

      const goal = await goalService.createGoal(clientId, result.data);
      return reply.code(201).send(goal);
    }
  );

  app.get(
    "/clients/:id/goals",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const clientId = Number(id);

      const goals = await goalService.getGoals(clientId);
      return reply.send(goals);
    }
  );

  app.put(
    "/goals/:id",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const goalId = Number(id);

      const result = goalSchema.partial().safeParse(request.body);
      if (!result.success) {
        return reply.code(400).send({
          message: "Dados inválidos para atualização",
          errors: result.error.flatten().fieldErrors,
        });
      }

      const updated = await goalService.updateGoal(goalId, result.data);
      return reply.send(updated);
    }
  );

  app.delete(
    "/goals/:id",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const goalId = Number(id);

      await goalService.deleteGoal(goalId);
      return reply.code(204).send();
    }
  );
}
