import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display hero section", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /shop now/i })).toBeVisible();
  });

  test("should have working navigation", async ({ page }) => {
    const nav = page.getByRole("navigation");
    await expect(nav).toBeVisible();

    await expect(nav.getByRole("link", { name: /products/i })).toBeVisible();
  });

  test("should toggle theme", async ({ page }) => {
    const themeToggle = page.getByRole("button", { name: /toggle theme/i });
    await themeToggle.click();

    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("should display featured products", async ({ page }) => {
    await expect(page.getByText(/featured products/i)).toBeVisible();
  });

  test("should display footer", async ({ page }) => {
    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();
  });
});
