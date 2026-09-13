import { test, expect } from '@playwright/test';

test('creates a session room', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.getByRole('button', { name: /create session link/i }).click();
  await expect(page.getByText(/live room/i)).toBeVisible();
  await expect(page.getByText(/connected/i)).toBeVisible();
});
