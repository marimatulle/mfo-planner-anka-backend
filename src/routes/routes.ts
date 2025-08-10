import { FastifyInstance } from "fastify";
import { clientRoutes } from "../controllers/clientController";
import { goalRoutes } from "../controllers/goalController";
import { authRoutes } from "../controllers/authController";

export async function registerRoutes(app: FastifyInstance) {
  await authRoutes(app);
  await clientRoutes(app);
  await goalRoutes(app);
}