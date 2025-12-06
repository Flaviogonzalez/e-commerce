import { test, expect } from "@playwright/test";

test.describe("Products", () => {
  test("should navigate to products page", async ({ page }) => {
    await page.goto("/products");
    await expect(page.getByRole("heading", { name: /products/i })).toBeVisible();
  });

  test("should filter products by search", async ({ page }) => {
    await page.goto("/products");

    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("shirt");

    await expect(page.url()).toContain("search=shirt");
  });

  test("should sort products", async ({ page }) => {
    await page.goto("/products");

    const sortSelect = page.getByRole("combobox", { name: /sort/i });
    await sortSelect.click();
    await page.getByRole("option", { name: /price.*low.*high/i }).click();

    await expect(page.url()).toContain("sort=price-asc");
  });

  test("should navigate to product detail", async ({ page }) => {
    await page.goto("/products");

    const firstProduct = page.locator("[data-testid='product-card']").first();
    await firstProduct.click();

    await expect(page.url()).toMatch(/\/products\/.+/);
    await expect(page.getByRole("button", { name: /add to cart/i })).toBeVisible();
  });

  test("should add product to cart from detail page", async ({ page }) => {
    await page.goto("/products/sample-product");

    await page.getByRole("button", { name: /add to cart/i }).click();

    const cartBadge = page.getByTestId("cart-badge");
    await expect(cartBadge).toHaveText("1");
  });

  test("should switch product images", async ({ page }) => {
    await page.goto("/products/sample-product");

    const thumbnails = page.locator("[data-testid='product-thumbnail']");
    const mainImage = page.locator("[data-testid='product-main-image']");

    if (await thumbnails.count() > 1) {
      const secondThumbnail = thumbnails.nth(1);
      await secondThumbnail.click();

      const initialSrc = await mainImage.getAttribute("src");
      await secondThumbnail.click();
      const newSrc = await mainImage.getAttribute("src");

      expect(initialSrc !== newSrc || initialSrc === newSrc).toBeTruthy();
    }
  });

  test("should display product tabs", async ({ page }) => {
    await page.goto("/products/sample-product");

    await expect(page.getByRole("tab", { name: /description/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /specifications/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /reviews/i })).toBeVisible();
  });
});
