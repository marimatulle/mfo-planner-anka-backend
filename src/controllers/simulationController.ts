import { FastifyInstance } from "fastify";
import { simulateWealthCurve } from "../services/simulationService";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export async function simulationRoutes(app: FastifyInstance) {
  const queryJsonSchema = {
    type: "object",
    properties: {
      rate: { type: "string" },
    },
  };

  const paramsJsonSchema = {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  };

  const responseJsonSchema = {
    type: "object",
    properties: {
      curve: {
        type: "array",
        items: {
          type: "object",
          properties: {
            date: { type: "string", format: "date-time" },
            value: { type: "number" },
          },
        },
      },
    },
  };

  app.get(
    "/clients/:id/simulation",
    {
      preHandler: [app.authenticate],
      schema: {
        params: paramsJsonSchema,
        querystring: queryJsonSchema,
        response: {
          200: responseJsonSchema,
          404: { type: "object", properties: { message: { type: "string" } } },
        },
        tags: ["Simulation"],
      },
    },
    async (request, reply) => {
      const querySchema = z.object({
        rate: z.string().optional(),
      });

      const paramsSchema = z.object({
        id: z.string(),
      });

      const { id } = paramsSchema.parse(request.params);
      const { rate } = querySchema.parse(request.query);

      const clientId = Number(id);
      const parsedRate = Number(rate) || 0.04;

      const wallet = await prisma.wallet.findFirst({ where: { clientId } });

      if (!wallet) {
        return reply.code(404).send({ message: "Carteira não encontrada" });
      }

      const events = await prisma.event.findMany({ where: { clientId } });

      const curve = simulateWealthCurve(wallet.totalValue, events, parsedRate);

      return reply.send({ curve });
    }
  );
}
