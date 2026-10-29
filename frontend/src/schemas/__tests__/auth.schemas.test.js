import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "../auth.schemas";

function expectFail(schema, data, field) {
  const result = schema.safeParse(data);
  expect(result.success).toBe(false);
  if (field) {
    expect(result.error.issues.some(i => i.path.includes(field))).toBe(true);
  }
}

const validLogin = { email: "user@example.com", password: "secret123" };

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    expect(loginSchema.safeParse(validLogin).success).toBe(true);
  });

  it.each([
    ["empty email",        { ...validLogin, email: "" },                  "email"],
    ["invalid email",      { ...validLogin, email: "not-an-email" },      "email"],
    ["email > 255 chars",  { ...validLogin, email: "a".repeat(250) + "@b.com" }, "email"],
    ["empty password",     { ...validLogin, password: "" },               "password"],
    ["password > 72 chars", { ...validLogin, password: "a".repeat(73) },  "password"],
  ])("rejects %s", (_label, data, field) => {
    expectFail(loginSchema, data, field);
  });
});

const validRegister = {
  name: "María López",
  email: "maria@example.com",
  password: "password123",
  password_confirmation: "password123",
};

describe("registerSchema", () => {
  it("accepts valid registration data", () => {
    expect(registerSchema.safeParse(validRegister).success).toBe(true);
  });

  it.each([
    ["name < 2 chars",       { ...validRegister, name: "A" },             "name"],
    ["name only spaces",     { ...validRegister, name: "   " },           "name"],
    ["name > 255 chars",     { ...validRegister, name: "a".repeat(256) }, "name"],
    ["invalid email",        { ...validRegister, email: "bad" },          "email"],
    ["password < 8 chars",   { ...validRegister, password: "short", password_confirmation: "short" }, "password"],
    ["password > 72 chars",  { ...validRegister, password: "a".repeat(73), password_confirmation: "a".repeat(73) }, "password"],
    ["mismatched confirmation", { ...validRegister, password_confirmation: "different123" }, "password_confirmation"],
    ["empty confirmation",   { ...validRegister, password_confirmation: "" }, "password_confirmation"],
  ])("rejects %s", (_label, data, field) => {
    expectFail(registerSchema, data, field);
  });
});
