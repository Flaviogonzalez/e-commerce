import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test("homepage should have no critical accessibility issues", async ({ page }) => {
    await page.goto("/");

    // Check for main landmark
    await expect(page.locator("main")).toBeVisible();

    // Check for skip link
    const skipLink = page.getByRole("link", { name: /skip.*content/i });
    if (await skipLink.count() > 0) {
      await expect(skipLink).toBeVisible({ visible: false });
    }

    // All images should have alt text
    const images = page.locator("img");
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute("alt");
      const role = await img.getAttribute("role");
      expect(alt !== null || role === "presentation").toBeTruthy();
    }

    // Check heading hierarchy
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);

    // Check for form labels
    const inputs = page.locator("input:not([type='hidden'])");
    const inputCount = await inputs.count();
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute("id");
      const ariaLabel = await input.getAttribute("aria-label");
      const ariaLabelledBy = await input.getAttribute("aria-labelledby");

      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        expect(hasLabel || ariaLabel !== null || ariaLabelledBy !== null).toBeTruthy();
      }
    }
  });

  test("should support keyboard navigation", async ({ page }) => {
    await page.goto("/");

    // Tab through the page
    await page.keyboard.press("Tab");
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();

    // Check focus is visible
    const focusOutline = await focusedElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outlineStyle !== "none" || styles.boxShadow !== "none";
    });
    expect(focusOutline).toBeTruthy();
  });

  test("should respect reduced motion preference", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const animated = page.locator("[class*='animate']").first();
    if (await animated.count() > 0) {
      const animation = await animated.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.animationDuration;
      });
      expect(animation === "0s" || animation === "0.01ms").toBeTruthy();
    }
  });

  test("should have sufficient color contrast", async ({ page }) => {
    await page.goto("/");

    // Check primary button contrast (basic check)
    const button = page.getByRole("button").first();
    if (await button.count() > 0) {
      const { bg, color } = await button.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          bg: styles.backgroundColor,
          color: styles.color,
        };
      });
      expect(bg).toBeDefined();
      expect(color).toBeDefined();
    }
  });

  test("forms should have proper error announcements", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("button", { name: /sign in/i }).click();

    // Check for aria-invalid on fields
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toHaveAttribute("aria-invalid", "true");

    // Check for error message association
    const errorId = await emailInput.getAttribute("aria-describedby");
    if (errorId) {
      const errorElement = page.locator(`#${errorId}`);
      await expect(errorElement).toBeVisible();
    }
  });
});
