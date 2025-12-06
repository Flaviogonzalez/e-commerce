import { test, expect } from "@playwright/test";

test.describe("Checkout Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/products/sample-product");
    await page.getByRole("button", { name: /add to cart/i }).click();
    await page.goto("/checkout");
  });

  test("should display checkout page with cart summary", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /checkout/i })).toBeVisible();
    await expect(page.getByText(/order summary/i)).toBeVisible();
  });

  test("should show shipping step first", async ({ page }) => {
    await expect(page.getByText(/shipping.*address/i)).toBeVisible();
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/address/i)).toBeVisible();
  });

  test("should validate shipping form", async ({ page }) => {
    await page.getByRole("button", { name: /continue.*payment/i }).click();

    await expect(page.getByText(/required/i).first()).toBeVisible();
  });

  test("should progress through checkout steps", async ({ page }) => {
    // Fill shipping
    await page.getByLabel(/first name/i).fill("John");
    await page.getByLabel(/last name/i).fill("Doe");
    await page.getByLabel(/email/i).fill("john@example.com");
    await page.getByLabel(/phone/i).fill("1234567890");
    await page.getByLabel(/address/i).fill("123 Main St");
    await page.getByLabel(/city/i).fill("New York");
    await page.getByLabel(/state/i).fill("NY");
    await page.getByLabel(/zip/i).fill("10001");

    await page.getByRole("button", { name: /continue.*payment/i }).click();

    // Should be on payment step
    await expect(page.getByText(/payment.*method/i)).toBeVisible();
    await expect(page.getByLabel(/card number/i)).toBeVisible();

    // Fill payment
    await page.getByLabel(/card number/i).fill("4111111111111111");
    await page.getByLabel(/expiry/i).fill("12/25");
    await page.getByLabel(/cvv/i).fill("123");
    await page.getByLabel(/name.*card/i).fill("John Doe");

    await page.getByRole("button", { name: /review.*order/i }).click();

    // Should be on review step
    await expect(page.getByText(/review.*order/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /place order/i })).toBeVisible();
  });

  test("should allow going back to previous steps", async ({ page }) => {
    await page.getByLabel(/first name/i).fill("John");
    await page.getByLabel(/last name/i).fill("Doe");
    await page.getByLabel(/email/i).fill("john@example.com");
    await page.getByLabel(/phone/i).fill("1234567890");
    await page.getByLabel(/address/i).fill("123 Main St");
    await page.getByLabel(/city/i).fill("New York");
    await page.getByLabel(/state/i).fill("NY");
    await page.getByLabel(/zip/i).fill("10001");

    await page.getByRole("button", { name: /continue.*payment/i }).click();
    await page.getByRole("button", { name: /back/i }).click();

    await expect(page.getByText(/shipping.*address/i)).toBeVisible();
    await expect(page.getByLabel(/first name/i)).toHaveValue("John");
  });

  test("should redirect to empty cart message if no items", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem("cart");
      sessionStorage.removeItem("cart");
    });

    await page.goto("/checkout");

    await expect(page.getByText(/cart.*empty/i)).toBeVisible();
  });
});
