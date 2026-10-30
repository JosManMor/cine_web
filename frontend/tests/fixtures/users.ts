export const ADMIN_USER = {
  email: "test@example.com",
  password: "password",
  name: "Test User",
  role: "admin" as const,
};

export const INVALID_USER = {
  email: "nonexistent@example.com",
  password: "wrong-password",
};
