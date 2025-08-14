import { FastifyInstance } from "fastify";
import { goalSchema } from "../schemas/goalSchemas";
import * as goalService from "../services/goalService";

export async function goalRoutes(app: FastifyInstance) {
  const goalJsonSchema = {
    type: "object",
    required: ["title", "targetDate", "description"],
    properties: {
      title: { type: "string", minLength: 1 },
      targetDate: { type: "string", format: "date-time" },
      description: { type: "string" },
    },
  };

  const goalPartialSchema = {
    type: "object",
    properties: {
      title: { type: "string", minLength: 1 },
      targetDate: { type: "string", format: "date-time" },
      description: { type: "string" },
    },
  };

  app.post(
    "/clients/:id/goals",
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        body: goalJsonSchema,
        response: {
          201: goalJsonSchema,
          400: {
            type: "object",
            properties: {
              message: { type: "string" },
              errors: { type: "object" },
            },
          },
        },
        tags: ["Goals"],
      },
    },
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
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        response: {
          200: { type: "array", items: goalJsonSchema },
          404: { type: "object", properties: { message: { type: "string" } } },
        },
        tags: ["Goals"],
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const clientId = Number(id);

      const goals = await goalService.getGoals(clientId);
      if (!goals || goals.length === 0) {
        return reply.code(404).send({ message: "Nenhuma meta encontrada" });
      }

      return reply.send(goals);
    }
  );

  app.get(
    "/goals/:id",
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        response: {
          200: goalJsonSchema,
          404: { type: "object", properties: { message: { type: "string" } } },
        },
        tags: ["Goals"],
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const goalId = Number(id);

      const goal = await goalService.getGoalById(goalId);
      if (!goal)
        return reply.code(404).send({ message: "Meta não encontrada" });

      return reply.send(goal);
    }
  );

  app.put(
    "/goals/:id",
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        body: goalPartialSchema,
        response: {
          200: goalJsonSchema,
          400: {
            type: "object",
            properties: {
              message: { type: "string" },
              errors: { type: "object" },
            },
          },
        },
        tags: ["Goals"],
      },
    },
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
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        response: {
          204: { type: "null" },
          404: { type: "object", properties: { message: { type: "string" } } },
        },
        tags: ["Goals"],
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const goalId = Number(id);

      await goalService.deleteGoal(goalId);
      return reply.code(204).send();
    }
  );
}
