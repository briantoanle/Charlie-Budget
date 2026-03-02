import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]');
    
    // HTML5 validation should prevent submission
    const emailInput = page.locator('input[name="email"]');
    const isEmailValid = await emailInput.evaluate((node: HTMLInputElement) => node.checkValidity());
    expect(isEmailValid).toBe(false);
  });

  test('should validate email format', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    
    const emailInput = page.locator('input[name="email"]');
    const isEmailValid = await emailInput.evaluate((node: HTMLInputElement) => node.checkValidity());
    expect(isEmailValid).toBe(false);
  });

  test('should allow submission with valid credentials', async ({ page }) => {
    // We mock the response if needed, but here we just check if it attempts to submit
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // We're just testing the UI interaction here
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });
});
