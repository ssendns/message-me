const request = require("supertest");
const app = require("../src/api/app");
const prisma = require("../src/utils/prisma");

async function createAndLogin(username, password = "123") {
  await request(app).post("/sign-up").send({ username, password });
  const res = await request(app).post("/log-in").send({ username, password });
  expect(res.statusCode).toBe(200);
  return { user: res.body.user, token: res.body.user.token };
}

describe("user routes", () => {
  let user1, token1, user2, token2;
  beforeAll(async () => {
    ({ user: user1, token: token1 } = await createAndLogin("user1", "123"));
    ({ user: user2, token: token2 } = await createAndLogin("user2", "456"));
  });

  it("GET /user/username/:username -> returns user by username (public)", async () => {
    const res = await request(app).get("/user/username/user1");
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user.username).toBe("user1");
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("GET /user/username/:username -> returns 404 if username not found (public)", async () => {
    const res = await request(app).get("/user/username/not_found");
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error", "user not found");
  });

  it("GET /user -> returns current user with valid token", async () => {
    const res = await request(app)
      .get("/user")
      .set("Authorization", `Bearer ${token1}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user.username).toBe("user1");
  });

  it("GET /user -> returns 401 with invalid token", async () => {
    const res = await request(app)
      .get("/user")
      .set("Authorization", `Bearer 111`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error", "invalid or expired token");
  });

  test("GET /user/all -> returns other users excluding current", async () => {
    const res = await request(app)
      .get("/user/all")
      .set("Authorization", `Bearer ${token1}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("username");
    expect(res.body[0]).toHaveProperty("id");
  });

  it("PATCH /user/edit -> updates username and password with valid token", async () => {
    const res = await request(app)
      .patch("/user/edit")
      .set("Authorization", `Bearer ${token1}`)
      .send({
        newUsername: "user11",
        newPassword: "456",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user.username).toBe("user11");

    user1.username = "user11";
  });

  it("PATCH /user/edit -> set avatar (url + publicId)", async () => {
    const res = await request(app)
      .patch("/user/edit")
      .set("Authorization", `Bearer ${token1}`)
      .send({
        avatarUrl: "https://example.com/avatar1.png",
        avatarPublicId: "avatar_1",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty(
      "avatarUrl",
      "https://example.com/avatar1.png"
    );
    expect(res.body.user).toHaveProperty("avatarPublicId", "avatar_1");
  });

  it("PATCH /user/edit -> clear avatar (set nulls)", async () => {
    const res = await request(app)
      .patch("/user/edit")
      .set("Authorization", `Bearer ${token1}`)
      .send({
        avatarUrl: null,
        avatarPublicId: null,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty("avatarUrl", null);
    expect(res.body.user).toHaveProperty("avatarPublicId", null);
  });

  it("PATCH /user/edit -> 400 when nothing to update", async () => {
    const res = await request(app)
      .patch("/user/edit")
      .set("Authorization", `Bearer ${token1}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "nothing to update");
  });

  it("PATCH /user/edit -> 400 on empty username", async () => {
    const res = await request(app)
      .patch("/user/edit")
      .set("Authorization", `Bearer ${token1}`)
      .send({ newUsername: "   " });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "username cannot be empty");
  });

  it("PATCH /user/edit -> do not update user with invalid token", async () => {
    const res = await request(app)
      .patch("/user/edit")
      .set("Authorization", `Bearer 111`)
      .send({
        newUsername: "newUsername",
        newPassword: "456",
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error", "invalid or expired token");
  });

  it("DELETE /user -> do not delete account with invalid credentials", async () => {
    const res = await request(app)
      .delete("/user")
      .set("Authorization", `Bearer 111`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error", "invalid or expired token");
  });

  it("DELETE /user -> deletes account with valid credentials", async () => {
    const res1 = await request(app)
      .delete("/user")
      .set("Authorization", `Bearer ${token1}`);

    const res2 = await request(app)
      .delete("/user")
      .set("Authorization", `Bearer ${token2}`);

    expect(res1.statusCode).toBe(204);
    expect(res2.statusCode).toBe(204);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
