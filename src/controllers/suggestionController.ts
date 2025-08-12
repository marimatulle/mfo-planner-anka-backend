import { FastifyInstance } from "fastify";
import { suggestionQuerySchema } from "../schemas/suggestionSchemas";
import { generateClientSuggestions } from "../services/suggestionService";

export async function suggestionRoutes(app: FastifyInstance) {
  app.get(
    "/clients/:id/suggestions",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const clientId = Number(id);

      const queryValidation = suggestionQuerySchema.safeParse(request.query);
      const months = queryValidation.success
        ? queryValidation.data.months ?? 24
        : 24;

      const suggestions = await generateClientSuggestions(clientId, months);
      return reply.send(suggestions);
    }
  );
}
