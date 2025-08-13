import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import jwt from "@fastify/jwt";
import dotenv from "dotenv";
import { registerRoutes } from "./routes/routes";

dotenv.config();

export async function buildApp() {
  const app = Fastify({ logger: true });

  app.register(swagger, {
    swagger: { info: { title: "API MFO Planner Anka", version: "1.0.0" } },
  });
  app.register(swaggerUI, {
    routePrefix: "/docs",
    uiConfig: { docExpansion: "full", deepLinking: false },
  });
  app.register(jwt, { secret: process.env.JWT_SECRET || "supersecret" });

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
