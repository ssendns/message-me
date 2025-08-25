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

describe("participants routes", () => {
  let owner, member, outsider;
  let tokenOwner, tokenMember, tokenOutsider;
  let chatId;

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { username: "owner" } });
    await prisma.user.deleteMany({ where: { username: "member" } });
    await prisma.user.deleteMany({ where: { username: "outsider" } });
    await prisma.chat.deleteMany({ where: { chatId: chatId } });

    ({ user: owner, token: tokenOwner } = await createAndLogin("owner", "123"));
    ({ user: member, token: tokenMember } = await createAndLogin(
      "member",
      "123"
    ));
    ({ user: outsider, token: tokenOutsider } = await createAndLogin(
      "outsider",
      "123"
    ));

    const res = await request(app)
      .post("/chats")
      .set("Authorization", `Bearer ${tokenOwner}`)
      .send({
        type: "GROUP",
        title: "test",
        participantIds: [member.id],
      });
    expect(res.statusCode).toBe(201);
    chatId = res.body.id;

    const participants = await prisma.chatParticipant.findMany({
      where: { chatId },
      orderBy: { userId: "asc" },
      select: { userId: true, role: true },
    });
    const roles = new Map(
      participants.map((participant) => [participant.userId, participant.role])
    );
    expect(roles.get(owner.id)).toBe("OWNER");
    expect(roles.get(member.id)).toBe("MEMBER");
  });

  it("POST /participants -> OWNER can add new participant", async () => {
    const res = await request(app)
      .post(`/chats/${chatId}/participants`)
      .set("Authorization", `Bearer ${tokenOwner}`)
      .send({
        userId: outsider.id,
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true });

    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: outsider.id } },
    });
    expect(participant).toBeTruthy();
    expect(participant.role).toBe("MEMBER");
  });

  it("POST /participants -> MEMBER can not add participants (403)", async () => {
    const res = await request(app)
      .post(`/chats/${chatId}/participants`)
      .set("Authorization", `Bearer ${tokenMember}`)
      .send({
        userId: outsider.id,
      });
    expect(res.statusCode).toBe(403);
  });

  it("POST /participants/admins -> OWNER can promote member to ADMIN", async () => {
    const res = await request(app)
      .post(`/chats/${chatId}/participants/admins`)
      .set("Authorization", `Bearer ${tokenOwner}`)
      .send({
        userId: member.id,
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true });

    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: member.id } },
      select: { role: true },
    });
    expect(participant.role).toBe("ADMIN");
  });

  it("POST /participants/admins -> MEMBER can not promote to ADMIN (403)", async () => {
    const res = await request(app)
      .post(`/chats/${chatId}/participants/admins`)
      .set("Authorization", `Bearer ${tokenMember}`)
      .send({
        userId: outsider.id,
      });
    expect(res.statusCode).toBe(403);
  });

  it("ensureTargetNotOwner -> can not promote/demote/delete OWNER)", async () => {
    const res1 = await request(app)
      .post(`/chats/${chatId}/participants/admins`)
      .set("Authorization", `Bearer ${tokenOwner}`)
      .send({
        userId: owner.id,
      });
    expect(res1.statusCode).toBe(400);

    const res2 = await request(app)
      .delete(`/chats/${chatId}/participants/admins/${owner.id}`)
      .set("Authorization", `Bearer ${tokenOwner}`);
    expect(res2.statusCode).toBe(400);

    const res3 = await request(app)
      .delete(`/chats/${chatId}/participants/${owner.id}`)
      .set("Authorization", `Bearer ${tokenOwner}`);
    expect(res3.statusCode).toBe(400);
  });

  it("DELETE /participants/admins/:userId -> OWNER can demote ADMIN to MEMBER", async () => {
    const res = await request(app)
      .delete(`/chats/${chatId}/participants/admins/${member.id}`)
      .set("Authorization", `Bearer ${tokenOwner}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true });

    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: member.id } },
      select: { role: true },
    });
    expect(participant.role).toBe("MEMBER");
  });

  it("DELETE /participants/:userId -> ADMIN and OWNER can delete a MEMBER", async () => {
    const promote = await request(app)
      .post(`/chats/${chatId}/participants/admins`)
      .set("Authorization", `Bearer ${tokenOwner}`)
      .send({
        userId: member.id,
      });
    expect(promote.statusCode).toBe(200);

    const adminRemovesMember = await request(app)
      .delete(`/chats/${chatId}/participants/${outsider.id}`)
      .set("Authorization", `Bearer ${tokenMember}`);
    expect(adminRemovesMember.statusCode).toBe(200);
    expect(adminRemovesMember.body).toMatchObject({ ok: true });

    const participant1 = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: outsider.id } },
    });
    expect(participant1).toBeNull();
  });

  it("ensureTargetUserExists -> checks that target exists (404)", async () => {
    const res1 = await request(app)
      .post(`/chats/${chatId}/participants/admins`)
      .set("Authorization", `Bearer ${tokenOwner}`)
      .send({
        userId: 999999,
      });
    expect(res1.statusCode).toBe(404);

    const res2 = await request(app)
      .delete(`/chats/${chatId}/participants/999999`)
      .set("Authorization", `Bearer ${tokenOwner}`);
    expect(res2.statusCode).toBe(404);
  });

  it("ensureTargetMember -> checks that target is in chat (404)", async () => {
    const exists = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: outsider.id } },
    });
    expect(exists).toBeNull();

    const res1 = await request(app)
      .post(`/chats/${chatId}/participants/admins`)
      .set("Authorization", `Bearer ${tokenOwner}`)
      .send({
        userId: outsider.id,
      });
    expect(res1.statusCode).toBe(404);

    const res2 = await request(app)
      .delete(`/chats/${chatId}/participants/admins/${outsider.id}`)
      .set("Authorization", `Bearer ${tokenOwner}`);
    expect(res2.statusCode).toBe(404);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
