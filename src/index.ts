import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import jwt from "@fastify/jwt";
import dotenv from "dotenv";
import chalk from "chalk";
import { registerRoutes } from "./routes/routes";

dotenv.config();

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

(async () => {
  await registerRoutes(app);

  console.log(chalk.cyan("\n=== Rotas registradas ===\n"));
  app
    .printRoutes()
    .split("\n")
    .forEach((line) => {
      if (line.includes("POST")) console.log(chalk.green(line));
      else if (line.includes("GET")) console.log(chalk.blue(line));
      else console.log(line);
    });
  console.log(chalk.cyan("\n========================\n"));

  app.listen({ port: 3001, host: "0.0.0.0" }).then(() => {
    console.log(chalk.yellow("Servidor rodando em http://localhost:3001"));
    console.log(chalk.yellow("Docs em http://localhost:3001/docs"));
  });
})();
