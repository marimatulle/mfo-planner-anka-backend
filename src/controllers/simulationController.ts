import { FastifyInstance } from "fastify";
import { simulateWealthCurve } from "../services/simulationService";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

export async function simulationRoutes(app: FastifyInstance) {
  app.get(
    "/clients/:id/simulation",
    { preHandler: [app.authenticate] },
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
