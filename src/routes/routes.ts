import { FastifyInstance } from "fastify";
import { authRoutes } from "../controllers/authController";
import { clientRoutes } from "../controllers/clientController";
import { goalRoutes } from "../controllers/goalController";
import { walletRoutes } from "../controllers/walletController";
import { eventRoutes } from "../controllers/eventController";
import { simulationRoutes } from "../controllers/simulationController";

export async function registerRoutes(app: FastifyInstance) {
  await authRoutes(app);
  await clientRoutes(app);
  await goalRoutes(app);
  await walletRoutes(app);
  await eventRoutes(app);
  await simulationRoutes(app);
}
