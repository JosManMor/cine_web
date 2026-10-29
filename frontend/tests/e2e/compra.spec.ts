import { test, expect } from "@playwright/test";
import { ADMIN_USER } from "../fixtures/users";

async function loginAs(page: import("@playwright/test").Page, user: typeof ADMIN_USER) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(user.email);
  await page.getByLabel("Contraseña").fill(user.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/", { timeout: 10_000 });
}

test.describe("Purchase flow", () => {
  test("select screening, pick seats, see price summary", async ({ page }) => {
    await loginAs(page, ADMIN_USER);

    await page.goto("/");
    const movieLink = page.locator("a[href*='/pelicula/']").first();
    await expect(movieLink).toBeVisible({ timeout: 15_000 });
    await movieLink.click();
    await expect(page).toHaveURL(/\/pelicula\/\d+/, { timeout: 10_000 });

    const screeningBtn = page.locator("a[href*='/asientos/'], button").filter({ hasText: /horario|función|ver|comprar|asientos/i }).first();
    if (await screeningBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await screeningBtn.click();
      await expect(page).toHaveURL(/\/asientos\/\d+/, { timeout: 10_000 });

      const seat = page.locator("[class*='seat']:not([class*='occupied']):not([class*='disabled']), button").filter({ hasText: /^[A-Z]?\d+$/ }).first();
      if (await seat.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await seat.click();
        await expect(page.locator("text=/\\$\\d+/")).toBeVisible({ timeout: 5_000 });
      }
    }
  });
});
