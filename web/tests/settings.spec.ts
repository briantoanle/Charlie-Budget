import { test, expect } from '@playwright/test';

test.describe('Settings Page Forms', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/settings');
  });

  test('should handle profile name editing', async ({ page }) => {
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      
      const nameInput = page.locator('input.h-8'); // Based on the code seen
      await expect(nameInput).toBeVisible();
      
      await nameInput.fill('');
      // The save button should be disabled or return error (it checks name.trim())
      const saveButton = page.locator('button:has(svg.h-3.5)'); // The check icon button
      await saveButton.click();
      
      // Should still be in editing mode if validation fails correctly in UI
      await expect(nameInput).toBeVisible();
    }
  });

  test('should show delete account confirmation', async ({ page }) => {
    const deleteButton = page.locator('button:has-text("Delete Account")');
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      const confirmInput = page.locator('input[placeholder="Type DELETE"]');
      await expect(confirmInput).toBeVisible();
      
      const finalDeleteButton = page.locator('button:has-text("Confirm Delete")');
      await expect(finalDeleteButton).toBeDisabled();
      
      await confirmInput.fill('DELETE');
      await expect(finalDeleteButton).toBeEnabled();
    }
  });
});
