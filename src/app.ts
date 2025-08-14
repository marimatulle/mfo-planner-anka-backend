import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import jwt from "@fastify/jwt";
import dotenv from "dotenv";
import { registerRoutes } from "./routes/routes";
import { swaggerPlugin } from "./plugins/swagger";

dotenv.config();

export async function buildApp() {
  const app = Fastify({ logger: true });

  app.register(jwt, { secret: process.env.JWT_SECRET || "supersecret" });

  await swaggerPlugin(app);

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

  app.get("/", async () => ({ hello: "world" }));

  await registerRoutes(app);

  return app;
}
