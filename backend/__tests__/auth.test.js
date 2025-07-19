const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/utils/db");

let token;

describe("auth routes", () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { username: "testuser" } });
  });

  it("should register a new user", async () => {
    const res = await request(app).post("/sign-up").send({
      username: "testuser",
      password: "123",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user.username).toBe("testuser");
    expect(res.body.user).toHaveProperty("token");
  });

  it("should log in an existing user", async () => {
    const res = await request(app).post("/log-in").send({
      username: "testuser",
      password: "123",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user.username).toBe("testuser");
    expect(res.body.user).toHaveProperty("token");

    token = res.body.user.token;
  });

  it("should reject invalid log in", async () => {
    const res = await request(app).post("/log-in").send({
      username: "testuser",
      password: "1234",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "invalid credentials");
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { username: "testuser" } });
    await prisma.$disconnect();
  });
});
