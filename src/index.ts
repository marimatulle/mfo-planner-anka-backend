import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import jwt from "@fastify/jwt";
import prisma from "./prismaClient";
import { z } from "zod";

const app = Fastify();

app.register(swagger, {
  swagger: { info: { title: "API MFO Planner", version: "1.0.0" } },
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

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADVISOR", "VIEWER"]).default("VIEWER"),
});
type RegisterBody = z.infer<typeof registerSchema>;

app.post(
  "/register",
  async (
    request: FastifyRequest<{ Body: RegisterBody }>,
    reply: FastifyReply
  ) => {
    const { name, email, password, role } = registerSchema.parse(request.body);

    const user = await prisma.user.create({
      data: { name, email, password, role },
    });

    return reply
      .code(201)
      .send({ id: user.id, email: user.email, role: user.role });
  }
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
type LoginBody = z.infer<typeof loginSchema>;

app.post(
  "/login",
  async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    const { email, password } = loginSchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.password !== password) {
      return reply.code(401).send({ message: "Credenciais inválidas" });
    }

    const token = app.jwt.sign(
      { id: user.id, role: user.role },
      { expiresIn: "1h" }
    );

    return { token };
  }
);

interface JwtUser {
  id: string;
  role: "ADVISOR" | "VIEWER";
}

app.get(
  "/me",
  { preHandler: [app.authenticate] },
  async (request: FastifyRequest) => {
    const user = request.user as JwtUser;
    return { user };
  }
);

app.get("/", async () => ({ hello: "world" }));

app.listen({ port: 3000, host: "0.0.0.0" }).then(() => {
  console.log("Servidor rodando em http://localhost:3000");
  console.log("Docs em http://localhost:3000/docs");
});
