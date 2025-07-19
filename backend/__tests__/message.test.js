const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/utils/db");

let token1, token2, user1, user2;

describe("message routes", () => {
  beforeAll(async () => {
    await prisma.message.deleteMany();
    await prisma.user.deleteMany({ where: { username: "user1" } });
    await prisma.user.deleteMany({ where: { username: "user2" } });

    const res1 = await request(app).post("/sign-up").send({
      username: "user1",
      password: "123",
    });
    const res2 = await request(app).post("/sign-up").send({
      username: "user2",
      password: "456",
    });

    token1 = res1.body.user.token;
    token2 = res2.body.user.token;
    user1 = res1.body.user;
    user2 = res2.body.user;
  });
  test("user1 sends a message to user2", async () => {
    const res = await request(app)
      .post("/messages")
      .set("Authorization", `Bearer ${token1}`)
      .send({
        toId: user2.id,
        content: "hello user1!",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toHaveProperty("id");
    expect(res.body.message.content).toBe("hello user1!");
    expect(res.body.message.fromId).toBe(user1.id);
    expect(res.body.message.toId).toBe(user2.id);
  });

  test("user2 fetches messages with user1", async () => {
    const res = await request(app)
      .get(`/messages/${user1.id}`)
      .set("Authorization", `Bearer ${token2}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.messages)).toBe(true);
    expect(res.body.messages.length).toBeGreaterThan(0);
    expect(res.body.messages[0].content).toBe("hello user1!");
  });

  test("fails to send message without auth", async () => {
    const res = await request(app)
      .post("/messages")
      .send({ toId: user1.id, content: "lalala" });

    expect(res.statusCode).toBe(401);
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });
});
