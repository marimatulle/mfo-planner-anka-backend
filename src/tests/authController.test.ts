import request from "supertest";
import { FastifyInstance } from "fastify";
import { buildApp } from "../app";
import prisma from "../prismaClient";

describe("Auth Controller", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    await prisma.client.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve registrar um novo usuário", async () => {
    const res = await request(app.server)
      .post("/register")
      .send({
        name: "Usuário Teste",
        email: "teste@example.com",
        password: "123456",
        role: "VIEWER",
      })
      .expect(201);

    expect(res.body).toMatchObject({
      email: "teste@example.com",
      role: "VIEWER",
    });
  });

  it("deve logar com credenciais válidas e receber token", async () => {
    const res = await request(app.server)
      .post("/login")
      .send({
        email: "teste@example.com",
        password: "123456",
      })
      .expect(200);

    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
  });

  it("deve retornar 401 ao logar com credenciais inválidas", async () => {
    const res = await request(app.server)
      .post("/login")
      .send({
        email: "teste@example.com",
        password: "senhaErrada",
      })
      .expect(401);

    expect(res.body).toHaveProperty("message", "Credenciais inválidas");
  });
});
