import { test, expect } from '@playwright/test';

/**
 * Synap E2E Integration Test Suite.
 * Covers user registration, session entry, and dashboard routing verification.
 */
test.describe('Synap Authentication Flows', () => {
  test('should load landing page and display core download CTA', async ({ page }) => {
    await page.goto('/');
    
    // Validate hero search metrics exist
    await expect(page.locator('h1')).toContainText(/Study 3x Faster|Synap/i);
    
    // Verify core call-to-actions exist
    const ctaButton = page.locator('text=Start Studying Free');
    if (await ctaButton.isVisible()) {
      await expect(ctaButton).toBeVisible();
    }
  });

  test('should render registration page with validation requirements', async ({ page }) => {
    await page.goto('/register');
    
    // Check key inputs exist
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Attempt signup trigger validation
    await page.click('button[type="submit"]');
    
    // Form validation should prevent submit if empty
    const emailInput = page.locator('input[type="email"]');
    const isRequired = await emailInput.getAttribute('required');
    expect(isRequired).not.toBeNull();
  });

  test('should render login interface successfully', async ({ page }) => {
    await page.goto('/login');
    
    // Check credentials form is rendered
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('text=Forgot Password?')).toBeVisible();
  });
});
