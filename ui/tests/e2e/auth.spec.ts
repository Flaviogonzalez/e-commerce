import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.describe("Login", () => {
    test("should display login form", async ({ page }) => {
      await page.goto("/login");

      await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    });

    test("should show validation errors for empty form", async ({ page }) => {
      await page.goto("/login");

      await page.getByRole("button", { name: /sign in/i }).click();

      await expect(page.getByText(/email.*required/i)).toBeVisible();
      await expect(page.getByText(/password.*required/i)).toBeVisible();
    });

    test("should show error for invalid email", async ({ page }) => {
      await page.goto("/login");

      await page.getByLabel(/email/i).fill("invalid-email");
      await page.getByLabel(/password/i).fill("password123");
      await page.getByRole("button", { name: /sign in/i }).click();

      await expect(page.getByText(/invalid.*email/i)).toBeVisible();
    });

    test("should navigate to register page", async ({ page }) => {
      await page.goto("/login");

      await page.getByRole("link", { name: /create.*account|sign up|register/i }).click();

      await expect(page).toHaveURL(/\/register/);
    });

    test("should have magic link option", async ({ page }) => {
      await page.goto("/login");

      await expect(page.getByRole("tab", { name: /magic link/i })).toBeVisible();
    });
  });

  test.describe("Register", () => {
    test("should display register form", async ({ page }) => {
      await page.goto("/register");

      await expect(page.getByRole("heading", { name: /create.*account/i })).toBeVisible();
      await expect(page.getByLabel(/first name/i)).toBeVisible();
      await expect(page.getByLabel(/last name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel("Password")).toBeVisible();
      await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    });

    test("should validate password match", async ({ page }) => {
      await page.goto("/register");

      await page.getByLabel(/first name/i).fill("John");
      await page.getByLabel(/last name/i).fill("Doe");
      await page.getByLabel(/email/i).fill("john@example.com");
      await page.getByLabel("Password").fill("password123");
      await page.getByLabel(/confirm password/i).fill("password456");
      await page.getByRole("button", { name: /create account/i }).click();

      await expect(page.getByText(/passwords.*match/i)).toBeVisible();
    });

    test("should require terms acceptance", async ({ page }) => {
      await page.goto("/register");

      await page.getByLabel(/first name/i).fill("John");
      await page.getByLabel(/last name/i).fill("Doe");
      await page.getByLabel(/email/i).fill("john@example.com");
      await page.getByLabel("Password").fill("password123");
      await page.getByLabel(/confirm password/i).fill("password123");
      await page.getByRole("button", { name: /create account/i }).click();

      await expect(page.getByText(/accept.*terms/i)).toBeVisible();
    });

    test("should navigate to login page", async ({ page }) => {
      await page.goto("/register");

      await page.getByRole("link", { name: /sign in|login|already have/i }).click();

      await expect(page).toHaveURL(/\/login/);
    });
  });
});
