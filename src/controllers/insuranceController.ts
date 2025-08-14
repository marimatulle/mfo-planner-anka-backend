import { FastifyInstance } from "fastify";
import { insuranceSchema } from "../schemas/insuranceSchemas";
import * as insuranceService from "../services/insuranceService";

export async function insuranceRoutes(app: FastifyInstance) {
  const insuranceJsonSchema = {
    type: "object",
    required: ["provider", "policyNumber", "coverage"],
    properties: {
      provider: { type: "string", minLength: 1 },
      policyNumber: { type: "string", minLength: 1 },
      coverage: { type: "string" },
    },
  };

  app.post(
    "/clients/:id/insurances",
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        body: insuranceJsonSchema,
        response: {
          201: insuranceJsonSchema,
          400: {
            type: "object",
            properties: {
              message: { type: "string" },
              errors: { type: "object" },
            },
          },
        },
        tags: ["Insurances"],
      },
    },
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
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        response: {
          200: { type: "array", items: insuranceJsonSchema },
        },
        tags: ["Insurances"],
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const clientId = Number(id);

      const insurances = await insuranceService.getInsurances(clientId);
      return reply.send(insurances);
    }
  );

  app.get(
    "/clients/:id/insurance-distribution",
    {
      preHandler: [app.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string" } },
        },
        response: {
          200: {
            type: "array",
            items: { type: "object", additionalProperties: true },
          },
        },
        tags: ["Insurances"],
      },
    },
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
