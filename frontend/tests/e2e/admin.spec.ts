import { test, expect } from "@playwright/test";
import { ADMIN_USER, INVALID_USER } from "../fixtures/users";

test.describe("Admin panel access", () => {
  test("admin user can access /admin", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill(ADMIN_USER.email);
    await page.getByLabel("Contraseña").fill(ADMIN_USER.password);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page).toHaveURL("/", { timeout: 10_000 });

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin/, { timeout: 10_000 });
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10_000 });
  });

  test("unauthenticated user cannot access /admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/(login)?$/, { timeout: 10_000 });
  });
});
