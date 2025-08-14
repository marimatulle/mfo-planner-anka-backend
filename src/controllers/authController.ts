import { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcrypt";
import prisma from "../prismaClient";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADVISOR", "VIEWER"]).default("VIEWER"),
});
type RegisterBody = z.infer<typeof registerSchema>;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
type LoginBody = z.infer<typeof loginSchema>;

interface JwtUser {
  id: string;
  role: "ADVISOR" | "VIEWER";
}

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: RegisterBody }>(
    "/register",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", minLength: 1 },
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
            role: {
              type: "string",
              enum: ["ADVISOR", "VIEWER"],
              default: "VIEWER",
            },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              email: { type: "string", format: "email" },
              role: { type: "string", enum: ["ADVISOR", "VIEWER"] },
            },
          },
          409: {
            type: "object",
            properties: { message: { type: "string" } },
          },
        },
        tags: ["Auth"],
      },
    },
    async (request, reply) => {
      const { name, email, password, role } = registerSchema.parse(
        request.body
      );

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return reply.code(409).send({ message: "Email já cadastrado" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { name, email, password: hashedPassword, role },
      });

      return reply
        .code(201)
        .send({ id: user.id, email: user.email, role: user.role });
    }
  );

  app.post<{ Body: LoginBody }>(
    "/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: { token: { type: "string" } },
          },
          401: {
            type: "object",
            properties: { message: { type: "string" } },
          },
        },
        tags: ["Auth"],
      },
    },
    async (request, reply) => {
      const { email, password } = loginSchema.parse(request.body);
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return reply.code(401).send({ message: "Credenciais inválidas" });
      }

      const token = app.jwt.sign(
        { id: user.id, role: user.role },
        { expiresIn: "1h" }
      );
      return { token };
    }
  );

  app.get(
    "/me",
    {
      preHandler: [app.authenticate],
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  role: { type: "string", enum: ["ADVISOR", "VIEWER"] },
                },
              },
            },
          },
          401: {
            type: "object",
            properties: { message: { type: "string" } },
          },
        },
        tags: ["Auth"],
      },
    },
    async (request) => {
      const user = request.user as JwtUser;
      return { user };
    }
  );
}
