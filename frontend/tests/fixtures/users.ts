// Mismas variables que usa DatabaseSeeder; sin ellas, el admin por defecto de desarrollo.
export const ADMIN_USER = {
  email: process.env.ADMIN_EMAIL || "test@example.com",
  password: process.env.ADMIN_PASSWORD || "password",
  name: "Administrador",
  role: "admin" as const,
};

export const INVALID_USER = {
  email: "nonexistent@example.com",
  password: "wrong-password",
};
