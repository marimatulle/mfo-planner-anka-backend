import { FastifyInstance } from "fastify";
import { simulationHistorySchema } from "../schemas/simulationHistorySchemas";
import * as simulationHistoryService from "../services/simulationHistoryService";

export async function simulationHistoryRoutes(app: FastifyInstance) {
  const simulationJsonSchema = {
    type: "object",
    required: ["name", "parameters", "result"],
    properties: {
      name: { type: "string", minLength: 1 },
      parameters: { type: "object", additionalProperties: true },
      result: { type: "object", additionalProperties: true },
    },
  };

  app.post(
    "/clients/:id/simulations",
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        body: simulationJsonSchema,
        response: {
          201: simulationJsonSchema,
          400: {
            type: "object",
            properties: {
              message: { type: "string" },
              errors: { type: "object" },
            },
          },
        },
        tags: ["SimulationHistory"],
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const clientId = Number(id);

      const result = simulationHistorySchema.safeParse(request.body);
      if (!result.success) {
        return reply.code(400).send({
          message: "Dados inválidos da simulação",
          errors: result.error.flatten().fieldErrors,
        });
      }

      const simulation = await simulationHistoryService.createSimulation(
        clientId,
        result.data
      );
      return reply.code(201).send(simulation);
    }
  );

  app.get(
    "/clients/:id/simulations",
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        response: {
          200: { type: "array", items: simulationJsonSchema },
          404: { type: "object", properties: { message: { type: "string" } } },
        },
        tags: ["SimulationHistory"],
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const clientId = Number(id);

      const simulations = await simulationHistoryService.getSimulations(
        clientId
      );
      if (!simulations || simulations.length === 0) {
        return reply
          .code(404)
          .send({ message: "Nenhuma simulação encontrada" });
      }

      return reply.send(simulations);
    }
  );

  app.get(
    "/simulations/:id",
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        response: {
          200: simulationJsonSchema,
          404: { type: "object", properties: { message: { type: "string" } } },
        },
        tags: ["SimulationHistory"],
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const simulationId = Number(id);

      const simulation = await simulationHistoryService.getSimulationById(
        simulationId
      );
      if (!simulation) {
        return reply.code(404).send({ message: "Simulação não encontrada" });
      }

      return reply.send(simulation);
    }
  );
}
