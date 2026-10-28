import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "../auth.schemas";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "secret123" });
    expect(result.success).toBe(true);
  });

  it("rejects empty email", () => {
    const result = loginSchema.safeParse({ email: "", password: "secret123" });
    expect(result.success).toBe(false);
    expect(result.error.issues.some(i => i.path[0] === "email")).toBe(true);
  });

  it("rejects invalid email format", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "secret123" });
    expect(result.success).toBe(false);
    expect(result.error.issues.some(i => i.path[0] === "email")).toBe(true);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "" });
    expect(result.success).toBe(false);
    expect(result.error.issues.some(i => i.path[0] === "password")).toBe(true);
  });

  it("rejects email exceeding 255 characters", () => {
    const longEmail = "a".repeat(250) + "@b.com";
    const result = loginSchema.safeParse({ email: longEmail, password: "secret123" });
    expect(result.success).toBe(false);
  });

  it("rejects password exceeding 72 characters", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "a".repeat(73) });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    name: "María López",
    email: "maria@example.com",
    password: "password123",
    password_confirmation: "password123",
  };

  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects name shorter than 2 characters", () => {
    const result = registerSchema.safeParse({ ...valid, name: "A" });
    expect(result.success).toBe(false);
    expect(result.error.issues.some(i => i.path[0] === "name")).toBe(true);
  });

  it("rejects name that is only spaces", () => {
    const result = registerSchema.safeParse({ ...valid, name: "   " });
    expect(result.success).toBe(false);
    expect(result.error.issues.some(i => i.path[0] === "name")).toBe(true);
  });

  it("rejects name exceeding 255 characters", () => {
    const result = registerSchema.safeParse({ ...valid, name: "a".repeat(256) });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({ ...valid, email: "bad" });
    expect(result.success).toBe(false);
    expect(result.error.issues.some(i => i.path[0] === "email")).toBe(true);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ ...valid, password: "short", password_confirmation: "short" });
    expect(result.success).toBe(false);
    expect(result.error.issues.some(i => i.path[0] === "password")).toBe(true);
  });

  it("rejects password exceeding 72 characters", () => {
    const long = "a".repeat(73);
    const result = registerSchema.safeParse({ ...valid, password: long, password_confirmation: long });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched password confirmation", () => {
    const result = registerSchema.safeParse({ ...valid, password_confirmation: "different123" });
    expect(result.success).toBe(false);
    expect(result.error.issues.some(i => i.path.includes("password_confirmation"))).toBe(true);
  });

  it("rejects empty password confirmation", () => {
    const result = registerSchema.safeParse({ ...valid, password_confirmation: "" });
    expect(result.success).toBe(false);
  });
});
