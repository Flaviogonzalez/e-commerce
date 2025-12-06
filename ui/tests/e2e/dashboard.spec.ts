import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.use({ baseURL: "http://localhost:3001" });

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("should display dashboard overview", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /dashboard|overview/i })).toBeVisible();
  });

  test("should display analytics cards", async ({ page }) => {
    await expect(page.getByText(/total revenue/i)).toBeVisible();
    await expect(page.getByText(/orders/i)).toBeVisible();
    await expect(page.getByText(/customers/i)).toBeVisible();
  });

  test("should have working sidebar navigation", async ({ page }) => {
    const sidebar = page.getByRole("navigation");
    await expect(sidebar).toBeVisible();

    await expect(sidebar.getByRole("link", { name: /orders/i })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: /customers/i })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: /products/i })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: /settings/i })).toBeVisible();
  });

  test("should navigate to orders page", async ({ page }) => {
    await page.getByRole("link", { name: /orders/i }).click();

    await expect(page).toHaveURL(/\/dashboard\/orders/);
    await expect(page.getByRole("heading", { name: /orders/i })).toBeVisible();
  });

  test("should navigate to customers page", async ({ page }) => {
    await page.getByRole("link", { name: /customers/i }).click();

    await expect(page).toHaveURL(/\/dashboard\/customers/);
    await expect(page.getByRole("heading", { name: /customers/i })).toBeVisible();
  });

  test("should navigate to products page", async ({ page }) => {
    await page.getByRole("link", { name: /products/i }).click();

    await expect(page).toHaveURL(/\/dashboard\/products/);
    await expect(page.getByRole("heading", { name: /products/i })).toBeVisible();
  });

  test("should navigate to settings page", async ({ page }) => {
    await page.getByRole("link", { name: /settings/i }).click();

    await expect(page).toHaveURL(/\/dashboard\/settings/);
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();
  });

  test("should display charts on overview", async ({ page }) => {
    const charts = page.locator(".recharts-wrapper");
    await expect(charts.first()).toBeVisible();
  });
});
