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

jest.mock("../cloudinary", () => ({
  uploader: {
    destroy: jest.fn().mockResolvedValue({ result: "ok" }),
  },
}));

const cloudinary = require("../cloudinary");
const { emitToChatAndUsers } = require("../src/socket/hub");

async function createAndLogin(username, password = "123") {
  await request(app).post("/sign-up").send({ username, password });
  const res = await request(app).post("/log-in").send({ username, password });
  expect(res.statusCode).toBe(200);
  return { user: res.body.user, token: res.body.user.token };
}

describe("group chat routes", () => {
  let owner, admin, member;
  let tokenOwner, tokenAdmin, tokenMember;
  let chatId;

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { username: "owner" } });
    await prisma.user.deleteMany({ where: { username: "admin" } });
    await prisma.user.deleteMany({ where: { username: "member" } });
    await prisma.chat.deleteMany({ where: { title: "test" } });

    ({ user: owner, token: tokenOwner } = await createAndLogin("owner", "123"));
    ({ user: admin, token: tokenAdmin } = await createAndLogin("admin", "123"));
    ({ user: member, token: tokenMember } = await createAndLogin(
      "member",
      "123"
    ));
  });

  test("POST /chats (GROUP) -> creates group with avatar and propper memberships", async () => {
    const res = await request(app)
      .post("/chats")
      .set("Authorization", `Bearer ${tokenOwner}`)
      .send({
        type: "GROUP",
        title: "test",
        participantIds: [admin.id, member.id],
        avatarUrl: "https://example.com/img1.png",
        avatarPublicId: "pid1",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    chatId = res.body.id;

    const participants = await prisma.chatParticipant.findMany({
      where: { chatId: chatId },
      select: { userId: true, role: true },
    });

    expect(participants).toHaveLength(3);
    const roleById = new Map(
      participants.map((participant) => [participant.userId, participant.role])
    );
    expect(roleById.get(owner.id)).toBe("OWNER");
    expect(roleById.get(admin.id)).toBe("MEMBER");
    expect(roleById.get(member.id)).toBe("MEMBER");
  });

  test("PATCH /chats/:id -> OWNER can change group title", async () => {
    emitToChatAndUsers.mockClear();

    const res = await request(app)
      .patch(`/chats/${chatId}`)
      .set("Authorization", `Bearer ${tokenOwner}`)
      .send({
        newTitle: "test2",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("chat");
    expect(res.body.chat.title).toBe("test2");

    expect(emitToChatAndUsers).toHaveBeenCalled();
    const calls = emitToChatAndUsers.mock.calls;

    expect(
      calls.some(
        (chat) =>
          chat.includes?.("receive_message") || chat[2] === "receive_message"
      )
    ).toBe(true);
  });

  test("PATCH /chats/:id -> avatar change destroys the old one", async () => {
    cloudinary.uploader.destroy.mockClear();
    emitToChatAndUsers.mockClear();

    const res = await request(app)
      .patch(`/chats/${chatId}`)
      .set("Authorization", `Bearer ${tokenOwner}`)
      .send({
        avatarUrl: "https://example.com/img2.png",
        avatarPublicId: "pid2",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.chat.avatarUrl).toBe("https://example.com/img2.png");
    expect(res.body.chat.avatarPublicId).toBe("pid2");
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("pid1");
    expect(emitToChatAndUsers).toHaveBeenCalled();
  });

  test("PATCH /chats/:id -> MEMBER can not edit the group (403)", async () => {
    const res = await request(app)
      .patch(`/chats/${chatId}`)
      .set("Authorization", `Bearer ${tokenMember}`)
      .send({
        newTitle: "test2",
      });
    expect(res.statusCode).toBe(403);
  });

  test("PATCH /chats/:id -> ADMIN can edit the group", async () => {
    await prisma.chatParticipant.update({
      where: { chatId_userId: { chatId: chatId, userId: admin.id } },
      data: { role: "ADMIN" },
    });

    const res = await request(app)
      .patch(`/chats/${chatId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({
        newTitle: "test3",
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.chat.title).toBe("test3");
  });

  test("PATCH /chats/:id -> can not set an empty title (400)", async () => {
    const res = await request(app)
      .patch(`/chats/${chatId}`)
      .set("Authorization", `Bearer ${tokenOwner}`)
      .send({
        newTitle: "   ",
      });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "title cannot be empty");
  });

  test("PATCH /chats/:id -> returns 400 when nothing to update", async () => {
    const res = await request(app)
      .patch(`/chats/${chatId}`)
      .set("Authorization", `Bearer ${tokenOwner}`);
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "nothing to update");
  });

  test("POST /chats/:id/leave -> member can leave the group", async () => {
    const res = await request(app)
      .post(`/chats/${chatId}/leave`)
      .set("Authorization", `Bearer ${tokenMember}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });

    const stillThere = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId: chatId, userId: member.id } },
    });
    expect(stillThere).toBeNull();
  });

  test("DELETE /chats/:id -> only OWNER can delete the group", async () => {
    const res1 = await request(app)
      .delete(`/chats/${chatId}`)
      .set("Authorization", `Bearer ${tokenAdmin}`);
    expect(res1.statusCode).toBe(403);

    const res2 = await request(app)
      .delete(`/chats/${chatId}`)
      .set("Authorization", `Bearer ${tokenOwner}`);
    expect([200, 204]).toContain(res2.statusCode);
    if (res2.statusCode === 200) {
      expect(res2.body).toEqual({ ok: true });
    }

    const gone = await prisma.chat.findUnique({ where: { id: chatId } });
    expect(gone).toBeNull();
  });

  test("POST /chats (GROUP) -> min two participants to create a group", async () => {
    const res = await request(app)
      .post("/chats")
      .set("Authorization", `Bearer ${tokenOwner}`)
      .send({
        type: "GROUP",
        title: "test",
        participantIds: [],
      });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "group must have at least 2 participants"
    );
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { username: "owner" } });
    await prisma.user.deleteMany({ where: { username: "admin" } });
    await prisma.user.deleteMany({ where: { username: "member" } });
    await prisma.chat.deleteMany({ where: { title: "test" } });
    await prisma.$disconnect();
  });
});
