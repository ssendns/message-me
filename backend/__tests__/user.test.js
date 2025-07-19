const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/utils/db");

let token;

describe("user routes", () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { username: "testuser" } });

    await request(app).post("/sign-up").send({
      username: "testuser",
      password: "123",
    });

    const res = await request(app).post("/log-in").send({
      username: "testuser",
      password: "123",
    });

    token = res.body.user.token;
  });

  it("should return the current user profile with valid token", async () => {
    const res = await request(app)
      .get("/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user.username).toBe("testuser");
  });

  it("should not return the current user profile with invalid token", async () => {
    const res = await request(app)
      .get("/profile")
      .set("Authorization", `Bearer 111`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error", "invalid or expired token");
  });

  it("should update the user profile with valid token", async () => {
    const res = await request(app)
      .patch("/profile/edit")
      .set("Authorization", `Bearer ${token}`)
      .send({
        newUsername: "newUsername",
        newPassword: "456",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user.username).toBe("newUsername");
  });

  it("should not edit the current user profile with invalid token", async () => {
    const res = await request(app)
      .get("/profile")
      .set("Authorization", `Bearer 111`)
      .send({
        newUsername: "newUsername",
        newPassword: "456",
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error", "invalid or expired token");
  });

  it("should not delete user account with invalid credentials", async () => {
    const res = await request(app)
      .delete("/profile")
      .set("Authorization", `Bearer 111`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error", "invalid or expired token");
  });

  it("returns user ID by username", async () => {
    const res = await request(app).get("/profile/username/newUsername");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("username", "newUsername");
    expect(res.body).not.toHaveProperty("password");
  });

  it("returns 404 if user not found", async () => {
    const res = await request(app).get("/profile/username/nonexistent_user");

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error", "user not found");
  });

  it("should delete user account with valid credentials", async () => {
    const res = await request(app)
      .delete("/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(204);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { username: "testuser" } });
    await prisma.$disconnect();
  });
});
