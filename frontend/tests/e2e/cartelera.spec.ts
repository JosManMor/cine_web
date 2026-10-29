import { test, expect } from "@playwright/test";

test.describe("Movie listings (Cartelera)", () => {
  test("home page shows at least one movie", async ({ page }) => {
    await page.goto("/");

    const movieCards = page.locator("img[alt]");
    await expect(movieCards.first()).toBeVisible({ timeout: 15_000 });
    expect(await movieCards.count()).toBeGreaterThanOrEqual(1);
  });

  test("clicking a movie navigates to detail page", async ({ page }) => {
    await page.goto("/");

    const firstLink = page.locator("a[href*='/pelicula/']").first();
    await expect(firstLink).toBeVisible({ timeout: 15_000 });
    await firstLink.click();

    await expect(page).toHaveURL(/\/pelicula\/\d+/, { timeout: 10_000 });
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10_000 });
  });
});
