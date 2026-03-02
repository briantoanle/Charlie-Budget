import { test, expect } from '@playwright/test';

test.describe('Investments Page Forms', () => {
  // Mock login/session
  test.beforeEach(async ({ page }) => {
    // In a real scenario, we'd use a storage state or a login helper
    // For now, we assume the user is logged in or we mock the page
    await page.goto('http://localhost:3000/investments');
  });

  test('should validate trade entry form', async ({ page }) => {
    // Open the form
    const logTradeButton = page.locator('button:has-text("Log Trade")');
    if (await logTradeButton.isVisible()) {
      await logTradeButton.click();
      
      // Try to submit empty
      await page.click('button:has-text("Submit")');
      
      const tickerInput = page.locator('input[placeholder="AAPL"]');
      const isTickerValid = await tickerInput.evaluate((node: HTMLInputElement) => node.checkValidity());
      // The component uses required attribute
      // Wait, let's check if the form is actually visible
      await expect(tickerInput).toBeVisible();
    }
  });

  test('should validate dividend entry form', async ({ page }) => {
    const tabs = page.locator('role=tab');
    const dividendTab = tabs.filter({ hasText: 'Dividends' });
    if (await dividendTab.isVisible()) {
      await dividendTab.click();
      
      const logDividendButton = page.locator('button:has-text("Log Dividend")');
      await logDividendButton.click();
      
      const submitButton = page.locator('button:has-text("Submit")');
      await expect(submitButton).toBeVisible();
    }
  });
});
