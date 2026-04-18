import request from "supertest";
import app from "../src/app.js";
import mongoose from "mongoose";
import connectDB from "../src/config/db.js";

// make sure JWT secret is set for tests
process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";

describe("Auth Routes", () => {

  let token;

  beforeAll(async () => {
    try {
      await connectDB();
      // clear database so tests are idempotent
      await mongoose.connection.db.dropDatabase();
    } catch (err) {
      console.error("Failed to connect to database:", err.message);
      throw err;
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should register a user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "123456"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.email).toBe("test@example.com");
  });

  it("should login user and return token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "123456"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();

    token = res.body.token;
  });

  it("should not register user with duplicate email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Another User",
        email: "test@example.com",
        password: "654321"
      });

    expect(res.statusCode).toBe(400);
  });

  it("should not login with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "wrongpassword"
      });

    expect(res.statusCode).toBe(400);
  });

});