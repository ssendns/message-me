const request = require("supertest");
const app = require("../src/api/app");
const prisma = require("../src/utils/prisma");

jest.mock("../src/socket/hub", () => ({
  emitToChat: jest.fn(),
  emitToChatAndUsers: jest.fn(),
  getIO: jest.fn(),
  setIO: jest.fn(),
  roomUser: (id) => `user_${id}`,
  roomChat: (id) => `chat_${id}`,
}));

async function createAndLogin(username, password = "123") {
  await request(app).post("/sign-up").send({ username, password });
  const res = await request(app).post("/log-in").send({ username, password });
  expect(res.statusCode).toBe(200);
  return { user: res.body.user, token: res.body.user.token };
}

describe("chat routes (DIRECT only; GROUP tested separately)", () => {
  let user1, token1, user2, token2;
  let chatId;
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { username: "user1" } });
    await prisma.user.deleteMany({ where: { username: "user2" } });
    await prisma.chat.deleteMany({ where: { id: chatId } });

    ({ user: user1, token: token1 } = await createAndLogin("user1", "123"));
    ({ user: user2, token: token2 } = await createAndLogin("user2", "456"));
  });

  it("GET /chats -> return 401 with invalid credentials", async () => {
    const res = await request(app).get("/chats");
    expect(res.statusCode).toBe(401);
  });

  it("POST /chats (DIRECT) -> created a new chat", async () => {
    const res = await request(app)
      .post("/chats")
      .set("Authorization", `Bearer ${token1}`)
      .send({
        type: "DIRECT",
        peerId: user2.id,
      });

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty("id");
    chatId = res.body.id;
    const participants = await prisma.chatParticipant.findMany({
      where: { chatId },
    });
    expect(
      participants.map((participant) => participant.userId).sort()
    ).toEqual([user1.id, user2.id].sort());
  });

  it("POST /chats (DIRECT) -> second request returns the same chat", async () => {
    const res = await request(app)
      .post("/chats")
      .set("Authorization", `Bearer ${token1}`)
      .send({
        type: "DIRECT",
        peerId: user2.id,
      });
    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty("id", chatId);
  });

  it("POST /chats (DIRECT) -> can not create a chat with yourself", async () => {
    const res = await request(app)
      .post("/chats")
      .set("Authorization", `Bearer ${token1}`)
      .send({
        type: "DIRECT",
        peerId: user1.id,
      });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "cannot create direct chat with yourself"
    );
  });

  it("GET /chats -> return all chats for user", async () => {
    const res = await request(app)
      .get("/chats")
      .set("Authorization", `Bearer ${token1}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const chat = res.body.find((chat) => chat.id === chatId);
    expect(chat).toBeTruthy();
    expect(chat).toHaveProperty("type", "DIRECT");
    expect(chat).toHaveProperty("unreadCount", 0);
    const ids = chat.participants.map((participant) => participant.id).sort();
    expect(ids).toEqual([user1.id, user2.id].sort());
  });

  it("GET /chats/:chatId -> returns chat and unread count", async () => {
    const res = await request(app)
      .get(`/chats/${chatId}`)
      .set("Authorization", `Bearer ${token1}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("chat");
    expect(res.body.chat).toHaveProperty("id", chatId);
    expect(res.body.chat).toHaveProperty("type", "DIRECT");
    expect(res.body.chat).toHaveProperty("unreadCount", 0);
  });

  it("unreadCount increase after new message", async () => {
    const message = await prisma.message.create({
      data: {
        chatId,
        fromId: user2.id,
        text: "hello",
        read: false,
        type: "TEXT",
      },
    });
    expect(message.id).toBeTruthy();

    const res1 = await request(app)
      .get("/chats")
      .set("Authorization", `Bearer ${token1}`);
    const chat = res1.body.find((chat) => chat.id === chatId);
    expect(chat).toBeTruthy();
    expect(chat.unreadCount).toBe(1);

    const res2 = await request(app)
      .get(`/chats/${chatId}`)
      .set("Authorization", `Bearer ${token1}`);
    expect(res2.statusCode).toBe(200);
    expect(res2.body.chat.unreadCount).toBe(1);
  });

  it("PATCH /chats/:chatId/read -> toggle read for inbox", async () => {
    const res1 = await request(app)
      .patch(`/chats/${chatId}/read`)
      .set("Authorization", `Bearer ${token1}`);
    expect(res1.statusCode).toBe(200);
    expect(res1.body).toEqual({ ok: true });

    const unread = await prisma.message.count({
      where: { chatId, fromId: user2.id, read: false },
    });
    expect(unread).toBe(0);

    const res2 = await request(app)
      .get("/chats")
      .set("Authorization", `Bearer ${token1}`);
    const chat = res2.body.find((chat) => chat.id === chatId);
    expect(chat.unreadCount).toBe(0);
  });

  it("GET /chats/:unknown -> return 404", async () => {
    const res = await request(app)
      .get(`/chats/9999`)
      .set("Authorization", `Bearer ${token1}`);
    expect([404, 403, 400]).toContain(res.statusCode);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { username: "user1" } });
    await prisma.user.deleteMany({ where: { username: "user2" } });
    await prisma.chat.deleteMany({ where: { id: chatId } });
    await prisma.$disconnect();
  });
});
