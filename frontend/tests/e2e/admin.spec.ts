import { test, expect } from "@playwright/test";
import { ADMIN_USER } from "../fixtures/users";

test.describe("Admin panel access", () => {
  test("admin user can access /admin", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(ADMIN_USER.email);
    await page.locator('input[type="password"]').fill(ADMIN_USER.password);
    await page.locator('input[type="password"]').press("Enter");
    await expect(page).toHaveURL("/", { timeout: 10_000 });

    const adminBtn = page.locator("button", { hasText: "Admin" });
    await expect(adminBtn.first()).toBeVisible({ timeout: 10_000 });
    await adminBtn.first().click();

    await expect(page).toHaveURL(/\/admin/, { timeout: 10_000 });
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10_000 });
  });

  test("unauthenticated user cannot access /admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/(login)?$/, { timeout: 10_000 });
  });
});
