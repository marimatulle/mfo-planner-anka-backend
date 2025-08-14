import request from "supertest";
import { FastifyInstance } from "fastify";
import { buildApp } from "../app";
import prisma from "../prismaClient";

describe("Client Controller", () => {
  let app: FastifyInstance;
  let advisorToken: string;
  let viewerToken: string;
  let clientId: number;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();

    await request(app.server).post("/register").send({
      name: "Advisor Test",
      email: "advisor@test.com",
      password: "123456",
      role: "ADVISOR",
    });

    await request(app.server).post("/register").send({
      name: "Viewer Test",
      email: "viewer@test.com",
      password: "123456",
      role: "VIEWER",
    });

    const resAdvisorLogin = await request(app.server)
      .post("/login")
      .send({ email: "advisor@test.com", password: "123456" });

    const resViewerLogin = await request(app.server)
      .post("/login")
      .send({ email: "viewer@test.com", password: "123456" });

    advisorToken = resAdvisorLogin.body.token;
    viewerToken = resViewerLogin.body.token;
  });

  afterAll(async () => {
    await prisma.client.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  it("deve permitir que ADVISOR crie um cliente", async () => {
    const res = await request(app.server)
      .post("/clients")
      .set("Authorization", `Bearer ${advisorToken}`)
      .send({
        name: "Cliente Teste",
        email: "cliente@test.com",
        age: 30,
        isActive: true,
        familyProfile: "Família Teste",
      })
      .expect(201);

    clientId = res.body.id;
    expect(res.body).toHaveProperty("email", "cliente@test.com");
  });

  it("não deve permitir que VIEWER crie um cliente", async () => {
    await request(app.server)
      .post("/clients")
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({
        name: "Cliente Viewer",
        email: "clienteviewer@test.com",
        age: 25,
        isActive: true,
        familyProfile: "Família Viewer",
      })
      .expect(403);
  });

  it("deve listar clientes para ADVISOR", async () => {
    const res = await request(app.server)
      .get("/clients")
      .set("Authorization", `Bearer ${advisorToken}`)
      .expect(200);

    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("id", clientId);
  });

  it("não deve listar clientes para VIEWER", async () => {
    await request(app.server)
      .get("/clients")
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(403);
  });

  it("deve obter cliente específico pelo ID para ADVISOR", async () => {
    const res = await request(app.server)
      .get(`/clients/${clientId}`)
      .set("Authorization", `Bearer ${advisorToken}`)
      .expect(200);

    expect(res.body).toHaveProperty("id", clientId);
  });

  it("não deve permitir VIEWER acessar cliente específico", async () => {
    await request(app.server)
      .get(`/clients/${clientId}`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(403);
  });

  it("deve atualizar cliente pelo ADVISOR", async () => {
    const res = await request(app.server)
      .put(`/clients/${clientId}`)
      .set("Authorization", `Bearer ${advisorToken}`)
      .send({ familyProfile: "Família Atualizada" })
      .expect(200);

    expect(res.body).toHaveProperty("familyProfile", "Família Atualizada");
  });

  it("não deve permitir VIEWER atualizar cliente", async () => {
    await request(app.server)
      .put(`/clients/${clientId}`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ familyProfile: "Tentativa de Update" })
      .expect(403);
  });

  it("deve deletar cliente pelo ADVISOR", async () => {
    await request(app.server)
      .delete(`/clients/${clientId}`)
      .set("Authorization", `Bearer ${advisorToken}`)
      .expect(204);
  });

  it("não deve permitir VIEWER deletar cliente", async () => {
    await request(app.server)
      .delete(`/clients/${clientId}`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .expect(403);
  });
});
