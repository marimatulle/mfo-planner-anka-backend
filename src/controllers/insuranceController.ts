import { FastifyInstance } from "fastify";
import { insuranceSchema } from "../schemas/insuranceSchemas";
import * as insuranceService from "../services/insuranceService";

export async function insuranceRoutes(app: FastifyInstance) {
  app.post(
    "/clients/:id/insurances",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const clientId = Number(id);

      const result = insuranceSchema.safeParse(request.body);
      if (!result.success) {
        return reply.code(400).send({
          message: "Dados inválidos do seguro",
          errors: result.error.flatten().fieldErrors,
        });
      }

      const insurance = await insuranceService.createInsurance(
        clientId,
        result.data
      );
      return reply.code(201).send(insurance);
    }
  );

  app.get(
    "/clients/:id/insurances",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const clientId = Number(id);

      const insurances = await insuranceService.getInsurances(clientId);
      return reply.send(insurances);
    }
  );

  app.get(
    "/clients/:id/insurance-distribution",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const clientId = Number(id);

      const distribution = await insuranceService.getInsuranceDistribution(
        clientId
      );
      return reply.send(distribution);
    }
  );
}
