import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export async function authPlugin(app: FastifyInstance) {
  app.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        reply.code(401).send({ message: "Token inválido ou ausente" });
      }
    }
  );
}
