import { test, expect } from "@playwright/test";
import { ADMIN_USER, INVALID_USER } from "../fixtures/users";

test.describe("Authentication flows", () => {
  test("login with correct credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill(ADMIN_USER.email);
    await page.getByLabel("Contraseña").fill(ADMIN_USER.password);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(page).toHaveURL("/", { timeout: 10_000 });
  });

  test("login with wrong credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill(INVALID_USER.email);
    await page.getByLabel("Contraseña").fill(INVALID_USER.password);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(page.locator("text=Error")).toBeVisible({ timeout: 10_000 });
  });

  test("protected route redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/mis-entradas");

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});
