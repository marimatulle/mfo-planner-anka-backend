import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
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
  app.post(
    "/register",
    async (
      request: FastifyRequest<{ Body: RegisterBody }>,
      reply: FastifyReply
    ) => {
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

  app.post(
    "/login",
    async (
      request: FastifyRequest<{ Body: LoginBody }>,
      reply: FastifyReply
    ) => {
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
    { preHandler: [app.authenticate] },
    async (request: FastifyRequest) => {
      const user = request.user as JwtUser;
      return { user };
    }
  );
}
