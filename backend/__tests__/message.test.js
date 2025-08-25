const request = require("supertest");
const app = require("../src/api/app");
const prisma = require("../src/utils/prisma");

jest.mock("../src/socket/hub", () => ({
  emitToChat: jest.fn(),
  emitToUser: jest.fn(),
  emitToUsers: jest.fn(),
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

describe("messages routes", () => {
  let user1, user2, token1, token2, chatId;

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { username: "user1" } });
    await prisma.user.deleteMany({ where: { username: "user2" } });
    await prisma.chat.deleteMany({ where: { id: chatId } });

    ({ user: user1, token: token1 } = await createAndLogin("user1", "123"));
    ({ user: user2, token: token2 } = await createAndLogin("user2", "456"));

    const res = await request(app)
      .post("/chats")
      .set("Authorization", `Bearer ${token1}`)
      .send({
        type: "DIRECT",
        peerId: user2.id,
      });
    expect([200, 201]).toContain(res.statusCode);
    chatId = res.body.id;

    const parts = await prisma.chatParticipant.findMany({
      where: { chatId },
      select: { userId: true },
    });
    const ids = new Set(parts.map((p) => p.userId));
    expect(ids.has(user1.id)).toBe(true);
    expect(ids.has(user2.id)).toBe(true);
  });

  it("POST /chats/:chatId/messages -> creates a message", async () => {
    const res = await request(app)
      .post(`/chats/${chatId}/messages`)
      .set("Authorization", `Bearer ${token1}`)
      .send({
        text: "test",
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toMatchObject({
      chatId,
      fromId: user1.id,
      text: "test",
      imageUrl: null,
      read: false,
      type: "TEXT",
    });
  });

  it("GET /chats/:chatId/messages -> returns chat messages", async () => {
    const res = await request(app)
      .get(`/chats/${chatId}/messages?limit=30&direction=older`)
      .set("Authorization", `Bearer ${token2}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.messages.length).toBe(1);
    const message = res.body.messages[0];
    expect(message.text).toBe("test");
  });

  it("POST /chats/:chatId/messages -> can send a picture without text", async () => {
    const res = await request(app)
      .post(`/chats/${chatId}/messages`)
      .set("Authorization", `Bearer ${token2}`)
      .send({
        text: " ",
        imageUrl: "https://example.com/pic.png",
        imagePublicId: "imgpid1",
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.text).toBe("");
    expect(res.body.imageUrl).toBe("https://example.com/pic.png");
    expect(res.body.imagePublicId).toBe("imgpid1");
    expect(res.body.fromId).toBe(user2.id);
  });

  it("POST /chats/:chatId/messages - can not send message without text and image", async () => {
    const res = await request(app)
      .post(`/chats/${chatId}/messages`)
      .set("Authorization", `Bearer ${token1}`)
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "message must have text or image"
    );
  });

  it("load older and change cursor position", async () => {
    const message1 = await request(app)
      .post(`/chats/${chatId}/messages`)
      .set("Authorization", `Bearer ${token1}`)
      .send({
        text: "message1",
      });
    const message2 = await request(app)
      .post(`/chats/${chatId}/messages`)
      .set("Authorization", `Bearer ${token1}`)
      .send({
        text: "message2",
      });

    expect(message1.statusCode).toBe(201);
    expect(message2.statusCode).toBe(201);

    const page1 = await request(app)
      .get(`/chats/${chatId}/messages?limit=1&direction=older`)
      .set("Authorization", `Bearer ${token1}`);
    expect(page1.statusCode).toBe(200);
    expect(page1.body.messages.length).toBe(1);
    const nextCursor = page1.body.nextCursor;
    expect(nextCursor).toBeTruthy();

    const page2 = await request(app)
      .get(
        `/chats/${chatId}/messages?limit=1&direction=older&cursor=${nextCursor}`
      )
      .set("Authorization", `Bearer ${token1}`);
    expect(page2.statusCode).toBe(200);
    expect(page2.body.messages.length).toBe(1);
  });

  it("PATCH /chats/:chatId/messages/:id -> sender can edit text and image", async () => {
    const message = await request(app)
      .post(`/chats/${chatId}/messages`)
      .set("Authorization", `Bearer ${token1}`)
      .send({
        text: "message",
      });
    expect(message.statusCode).toBe(201);
    const messageId = message.body.id;

    const res = await request(app)
      .patch(`/chats/${chatId}/messages/${messageId}`)
      .set("Authorization", `Bearer ${token1}`)
      .send({
        text: "edited text",
        imageUrl: "https://example.com/new.png",
        imagePublicId: "newpid",
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.text).toBe("edited text");
    expect(res.body.imageUrl).toBe("https://example.com/new.png");
    expect(res.body.imagePublicId).toBe("newpid");
    expect(res.body.edited).toBe(true);
  });

  it("PATCH /chats/:chatId/messages/:id -> can not edit others messages (403)", async () => {
    const message = await request(app)
      .post(`/chats/${chatId}/messages`)
      .set("Authorization", `Bearer ${token1}`)
      .send({
        text: "message",
      });
    expect(message.statusCode).toBe(201);
    const messageId = message.body.id;

    const res = await request(app)
      .patch(`/chats/${chatId}/messages/${messageId}`)
      .set("Authorization", `Bearer ${token2}`)
      .send({
        text: "edited text",
      });

    expect(res.statusCode).toBe(403);
  });

  it("DELETE /chats/:chatId/messages/:id -> sender can delete his message", async () => {
    const message1 = await request(app)
      .post(`/chats/${chatId}/messages`)
      .set("Authorization", `Bearer ${token1}`)
      .send({
        text: "message1",
      });
    const message2 = await request(app)
      .post(`/chats/${chatId}/messages`)
      .set("Authorization", `Bearer ${token1}`)
      .send({
        text: "message2",
      });
    const message3 = await request(app)
      .post(`/chats/${chatId}/messages`)
      .set("Authorization", `Bearer ${token1}`)
      .send({
        text: "message3",
      });

    const id1 = message1.body.id;
    const id2 = message2.body.id;
    const id3 = message3.body.id;

    const res = await request(app)
      .delete(`/chats/${chatId}/messages/${id3}`)
      .set("Authorization", `Bearer ${token1}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", id3);
    expect(res.body).toHaveProperty("chatId", chatId);
    expect(res.body.nextLast).toBeTruthy();
    expect(res.body.nextLast.text).toBe("message2");

    const exists = await prisma.message.findUnique({ where: { id: id3 } });
    expect(exists).toBeNull();
  });

  test("DELETE /chats/:chatId/messages/:id -> can not delete others message (403)", async () => {
    const message = await request(app)
      .post(`/chats/${chatId}/messages`)
      .set("Authorization", `Bearer ${token1}`)
      .send({
        text: "message",
      });

    const res = await request(app)
      .delete(`/chats/${chatId}/messages/${message.body.id}`)
      .set("Authorization", `Bearer ${token2}`);
    expect(res.statusCode).toBe(403);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { username: "user1" } });
    await prisma.user.deleteMany({ where: { username: "user2" } });
    await prisma.chat.deleteMany({ where: { id: chatId } });
    await prisma.$disconnect();
  });
});
