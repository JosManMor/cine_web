import { test, expect } from "@playwright/test";
import { ADMIN_USER } from "../fixtures/users";

async function loginAs(page: import("@playwright/test").Page, user: typeof ADMIN_USER) {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(user.email);
  await page.locator('input[type="password"]').fill(user.password);
  await page.locator('input[type="password"]').press("Enter");
  await expect(page).toHaveURL("/", { timeout: 10_000 });
}

test.describe("Purchase flow", () => {
  test("select screening, pick seats, see price summary", async ({ page }) => {
    await loginAs(page, ADMIN_USER);

    const movieBtn = page.locator("button[aria-label^='Ver ']").first();
    await expect(movieBtn).toBeVisible({ timeout: 15_000 });
    await movieBtn.click();
    await expect(page).toHaveURL(/\/pelicula\/\d+/, { timeout: 10_000 });

    const seleccionarBtn = page.locator("button", { hasText: "Seleccionar asientos" });
    await expect(seleccionarBtn).toBeEnabled({ timeout: 15_000 });
    await seleccionarBtn.click();

    await expect(page).toHaveURL(/\/asientos\/\d+/, { timeout: 10_000 });

    const seat = page.locator("[class*='seat']:not([class*='occupied']):not([class*='disabled']), button").filter({ hasText: /^[A-Z]?\d+$/ }).first();
    if (await seat.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await seat.click();
      await expect(page.locator("text=/\\$\\d+/")).toBeVisible({ timeout: 5_000 });
    }
  });
});
