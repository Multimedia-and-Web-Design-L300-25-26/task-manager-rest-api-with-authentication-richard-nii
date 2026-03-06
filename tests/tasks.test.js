import request from "supertest";
import app from "../src/app.js";
import mongoose from "mongoose";
import connectDB from "../src/config/db.js";

// ensure JWT secret
process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";

let token;
let taskId;

beforeAll(async () => {
  try {
    await connectDB();
    await mongoose.connection.db.dropDatabase();

    // Register
    await request(app)
      .post("/api/auth/register")
      .send({
        name: "Task User",
        email: "task@example.com",
        password: "123456"
      });

    // Login
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "task@example.com",
        password: "123456"
      });

    token = res.body.token;
  } catch (err) {
    console.error("Failed to set up test:", err.message);
    throw err;
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Task Routes", () => {

  it("should not allow access without token", async () => {
    const res = await request(app)
      .get("/api/tasks");

    expect(res.statusCode).toBe(401);
  });

  it("should create a task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test Task",
        description: "Testing"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Test Task");

    taskId = res.body._id;
  });

  it("should get user tasks only", async () => {
    const res = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should delete a task", async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Task deleted");
  });

});