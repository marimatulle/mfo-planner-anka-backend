import { FastifyInstance } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";

export async function swaggerPlugin(app: FastifyInstance) {
  await app.register(swagger, {
    swagger: {
      info: { title: "API MFO Planner", version: "1.0.0" },
      consumes: ["application/json"],
      produces: ["application/json"],
    },
  });

  await app.register(swaggerUI, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
    initOAuth: {},
  });
}
