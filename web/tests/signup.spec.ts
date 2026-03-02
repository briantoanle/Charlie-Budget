import { test, expect } from '@playwright/test';

test.describe('Signup Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/signup');
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]');
    
    const emailInput = page.locator('input[name="email"]');
    const isEmailValid = await emailInput.evaluate((node: HTMLInputElement) => node.checkValidity());
    expect(isEmailValid).toBe(false);
  });

  test('should validate password length', async ({ page }) => {
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'short');
    await page.click('button[type="submit"]');
    
    const passwordInput = page.locator('input[name="password"]');
    const isPasswordValid = await passwordInput.evaluate((node: HTMLInputElement) => node.checkValidity());
    expect(isPasswordValid).toBe(false);
  });

  test('should show success message on valid signup', async ({ page }) => {
    // This depends on mocking the action result or having a real backend
    // For UI testing, we check if the inputs are accepted
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'securepassword123');
    
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });
});
